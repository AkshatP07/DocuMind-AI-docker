import os
import re
import statistics
import logging
from collections import Counter
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional, Set, Any

import fitz
from fitz import Rect as FitzRect

try:
    from PIL import Image
    import pytesseract
    TESS_AVAILABLE = True
except ImportError:
    Image = Any
    pytesseract = Any
    TESS_AVAILABLE = False

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
NUM_PATTERN = re.compile(r"^\s*\d+(\.\d+)*\s*")

@dataclass
class LineObj:
    page_idx: int
    text: str
    bbox: Tuple[float, float, float, float]
    font_size: float
    bold: bool

@dataclass
class DocumentProfile:
    doc_type: str

class EnhancedPDFExtractor:
    def __init__(self):
        self.doc_profile: Optional[DocumentProfile] = None
        self._current_doc: Optional[fitz.Document] = None
        self.table_cache: Dict[int, Any] = {}
        self.FORM_KEYWORDS = ['form', 'application', 'declaration', 'proforma']

    def classify_document(self, text_sample: str) -> DocumentProfile:
        text_sample = text_sample.lower()
        if any(k in text_sample for k in self.FORM_KEYWORDS):
            return DocumentProfile(doc_type='form')
        return DocumentProfile(doc_type='report')

    def normalize_line_for_repeat(self, s: str) -> str:
        s = re.sub(r"\d", "@", s)
        s = re.sub(r"\s+", " ", s).strip().lower()
        s = re.sub(r"[^\w\s@]", "", s)
        return s

    def page_has_any_images(self, page: fitz.Page) -> bool:
        return bool(page.get_images(full=True))

    def get_font_stats(self, page: fitz.Page, bbox: Tuple[float, float, float, float]) -> Tuple[float, bool]:
        try:
            spans = page.get_text("dict", clip=bbox)['blocks'][0]['lines'][0]['spans']
            if not spans: return 12.0, False
            sizes = [span['size'] for span in spans]
            is_bold = any((span['flags'] & 1 << 4) for span in spans)
            return statistics.median(sizes) if sizes else 12.0, is_bold
        except (IndexError, KeyError):
            return 12.0, False

    def collect_lines(self, doc: fitz.Document) -> List[List[LineObj]]:
        pages_lines: List[List[LineObj]] = []
        for i, page in enumerate(doc):
            lines_this_page: List[LineObj] = []
            blocks = page.get_text("blocks", sort=True)
            for b in blocks:
                x0, y0, x1, y1, text, _, _ = b
                text = text.strip().replace('\n', ' ')
                if not text: continue
                bbox = (x0, y0, x1, y1)
                font_size, bold = self.get_font_stats(page, bbox)
                lines_this_page.append(LineObj(page_idx=i, text=text, bbox=bbox, font_size=font_size, bold=bold))
            pages_lines.append(lines_this_page)
        return pages_lines

    def detect_repeated_headers_footers(self, pages_lines: List[List[LineObj]], page_sizes: Dict[int, Tuple[float, float]]) -> Set[Tuple[int, int]]:
        text_counter = Counter()
        line_positions = {}
        for i, lines in enumerate(pages_lines):
            _, ph = page_sizes[i]
            for j, line in enumerate(lines):
                if line.bbox[3] < ph * 0.15 or line.bbox[1] > ph * 0.85:
                    norm_text = self.normalize_line_for_repeat(line.text)
                    if len(norm_text) > 4:
                        text_counter[norm_text] += 1
                        if norm_text not in line_positions: line_positions[norm_text] = []
                        line_positions[norm_text].append((i, j))
        to_drop: Set[Tuple[int, int]] = set()
        min_occurrences = max(2, int(len(pages_lines) * 0.4))
        for text, count in text_counter.items():
            if count >= min_occurrences:
                for pos in line_positions[text]:
                    to_drop.add(pos)
        return to_drop

    def merge_multiline_headings(self, pages_lines: List[List[LineObj]]) -> List[List[LineObj]]:
        merged_pages = []
        for lines in pages_lines:
            if not lines:
                merged_pages.append([])
                continue
            lines.sort(key=lambda x: (x.bbox[1], x.bbox[0]))
            final_merged = []
            i = 0
            while i < len(lines):
                curr = lines[i]
                j = i + 1
                while j < len(lines):
                    nxt = lines[j]
                    fs_close = abs(nxt.font_size - curr.font_size) <= 1.5
                    is_close_vertically = 0 <= nxt.bbox[1] - curr.bbox[3] <= curr.font_size * 0.5
                    is_aligned = abs(nxt.bbox[0] - curr.bbox[0]) <= 15.0
                    if fs_close and is_close_vertically and is_aligned:
                        curr.text = (curr.text.strip() + " " + nxt.text.strip()).strip()
                        curr.bbox = (min(curr.bbox[0], nxt.bbox[0]), curr.bbox[1], max(curr.bbox[2], nxt.bbox[2]), nxt.bbox[3])
                        curr.bold = curr.bold or nxt.bold
                        j += 1
                    else:
                        break
                final_merged.append(curr)
                i = j
            merged_pages.append(final_merged)
        return merged_pages

    def is_part_of_dense_layout(self, line: LineObj, all_lines: List[LineObj]) -> bool:
        text = line.text.lower().strip()
        if self._current_doc:
            try:
                page = self._current_doc[line.page_idx]
                if line.page_idx in self.table_cache:
                    tables = self.table_cache[line.page_idx]
                else:
                    tables = getattr(page, "find_tables", lambda: [])()
                    self.table_cache[line.page_idx] = tables
                for table in tables:
                    if FitzRect(line.bbox).intersects(table.bbox):
                        return True
            except Exception:
                pass
        return False

    def has_corrupted_text(self, text: str) -> bool:
        words = text.split()
        if len(words) < 4: return False
        for i in range(len(words) - 3):
            if words[i:i+2] == words[i+2:i+4]:
                return True
        for i in range(len(words) - 1):
            if len(words[i]) > 5 and words[i].endswith(words[i+1]):
                return True
        return False

    def pick_candidates(self, pages_lines: List[List[LineObj]]) -> List[LineObj]:
        candidates = []
        all_font_sizes = [ln.font_size for page in pages_lines for ln in page if len(ln.text.split()) > 2]
        avg_font_size = statistics.mean(all_font_sizes) if all_font_sizes else 12.0
        
        for i, lines_on_page in enumerate(pages_lines):
            for line in lines_on_page:
                text = line.text.strip()
                if not text: continue
                if self.has_corrupted_text(text): continue
                word_count = len(text.split())
                if not (2 <= word_count <= 15): continue
                if text[0].islower(): continue
                if line.font_size > avg_font_size * 1.2 or line.bold:
                    candidates.append(line)
        return candidates

    def extract_title(self, doc: fitz.Document, candidates: List[LineObj], all_lines: List[List[LineObj]]) -> Optional[str]:
        title = None
        if all_lines:
            largest_line = max(all_lines[0], key=lambda x: x.font_size, default=None)
            if largest_line and not self.has_corrupted_text(largest_line.text):
                title = largest_line.text
        return title

    def assign_levels(self, title: Optional[str], candidates: List[LineObj]) -> List[Dict[str, Any]]:
        if not candidates: return []
        outline = []
        font_sizes = sorted({round(c.font_size, 1) for c in candidates}, reverse=True)
        size_to_level = {size: f"H{i+1}" for i, size in enumerate(font_sizes[:3])}
        for c in sorted(candidates, key=lambda x: (x.page_idx, x.bbox[1])):
            if c.text == title: continue
            level = size_to_level.get(round(c.font_size, 1), "H3")
            outline.append({"level": level, "text": c.text, "page": c.page_idx + 1})
        return outline

    def extract_outline_from_pdf(self, pdf_path: str) -> Dict:
        try:
            self.table_cache.clear()
            doc = fitz.open(pdf_path)
            self._current_doc = doc
            self.doc_profile = self.classify_document(doc[0].get_text() if len(doc) else "")
            all_lines = self.collect_lines(doc)
            page_sizes = {i: (p.rect.width, p.rect.height) for i, p in enumerate(doc)}
            drop_mask = self.detect_repeated_headers_footers(all_lines, page_sizes)
            filtered_lines = [[ln for j, ln in enumerate(lines) if (i, j) not in drop_mask] for i, lines in enumerate(all_lines)]
            merged_pages = self.merge_multiline_headings(filtered_lines)
            candidates = self.pick_candidates(merged_pages)
            title = self.extract_title(doc, candidates, all_lines)
            outline = self.assign_levels(title, candidates)
            doc.close()
            return {"title": title or "", "outline": outline}
        except Exception as e:
            logging.error(f"Error processing {pdf_path}: {e}")
            return {"title": "", "outline": []}

def extract_outline_from_pdf(pdf_path: str) -> Dict:
    extractor = EnhancedPDFExtractor()
    return extractor.extract_outline_from_pdf(pdf_path)
