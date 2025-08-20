import os
import json
import faiss
import numpy as np
import re
import logging
from tqdm import tqdm
from sentence_transformers import SentenceTransformer
import fitz  # PyMuPDF

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# -------------------------------
# PDF TEXT EXTRACTION
# -------------------------------
def extract_paragraphs_from_pdf(pdf_path):
    """
    Return list of (page_number, paragraph_text) pairs from a PDF.
    """
    doc = fitz.open(pdf_path)
    paragraphs = []
    for i in range(doc.page_count):
        page = doc.load_page(i)
        text = page.get_text("text")
        paras = [p.strip() for p in text.split("\n\n") if p.strip()]
        for p in paras:
            paragraphs.append((i + 1, p))
    doc.close()
    return paragraphs


def create_corpus_from_folder(input_dir):
    """
    Returns list of dicts: {"doc_id", "page", "text", "chunk_id"} for each paragraph.
    """
    corpus = []
    for fname in os.listdir(input_dir):
        if not fname.lower().endswith(".pdf"):
            continue
        path = os.path.join(input_dir, fname)
        paragraphs = extract_paragraphs_from_pdf(path)
        for pidx, (page_no, paragraph) in enumerate(paragraphs):
            item = {
                "doc_id": fname,
                "page": page_no,
                "chunk_id": f"{fname}::p{page_no}::para{pidx}",
                "text": paragraph,
            }
            corpus.append(item)
    return corpus


# -------------------------------
# EMBEDDINGS + INDEXING
# -------------------------------
def build_embeddings(corpus, model_name="sentence-transformers/multi-qa-mpnet-base-dot-v1", batch_size=32):
    """
    Build embeddings for the corpus and return (embeddings, model).
    Uses offline model directory if available.
    """
    texts = [c["text"] for c in corpus]
    offline_model_dir = "offline_model"

    # Load or download model
    if os.path.exists(offline_model_dir) and os.listdir(offline_model_dir):
        logger.info(f"Loading SentenceTransformer from offline dir: {offline_model_dir}")
        model = SentenceTransformer(offline_model_dir)
    else:
        logger.info(f"Downloading SentenceTransformer model: {model_name}")
        model = SentenceTransformer(model_name)
        if not os.path.exists(offline_model_dir):
            os.makedirs(offline_model_dir)
        model.save(offline_model_dir)
        logger.info(f"Saved model to offline dir: {offline_model_dir}")

    model = model.to("cpu")

    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )
    return embeddings, model


def build_faiss_index(embeddings, index_dir, metadata):
    """
    Build and save a FAISS index from embeddings and metadata.
    """
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)  # cosine similarity with normalized embeddings
    index.add(embeddings.astype("float32"))

    if not os.path.exists(index_dir):
        os.makedirs(index_dir)

    faiss.write_index(index, os.path.join(index_dir, "faiss_index.bin"))
    with open(os.path.join(index_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    logger.info(f"Saved FAISS index and metadata to {index_dir}")
    return index


def load_index_and_meta(index_dir):
    """
    Load FAISS index and metadata from disk.
    """
    idx_path = os.path.join(index_dir, "faiss_index.bin")
    meta_path = os.path.join(index_dir, "metadata.json")

    if not os.path.exists(idx_path) or not os.path.exists(meta_path):
        raise FileNotFoundError("Index or metadata not found in " + index_dir)

    index = faiss.read_index(idx_path)
    with open(meta_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    logger.info(f"Loaded FAISS index and metadata from {index_dir}")
    return index, metadata


# -------------------------------
# QUERYING
# -------------------------------
def query_index_with_context(query, index, metadata, model_name="sentence-transformers/multi-qa-mpnet-base-dot-v1", k=5, context_paras=0):
    """
    Query FAISS index with a text query and return top-k results as list of dicts.
    """
    offline_model_dir = "offline_model"
    if os.path.exists(offline_model_dir) and os.listdir(offline_model_dir):
        logger.info(f"Loading SentenceTransformer from offline dir: {offline_model_dir}")
        model = SentenceTransformer(offline_model_dir)
    else:
        logger.info(f"Downloading SentenceTransformer model: {model_name}")
        model = SentenceTransformer(model_name)
        if not os.path.exists(offline_model_dir):
            os.makedirs(offline_model_dir)
        model.save(offline_model_dir)
        logger.info(f"Saved model to offline dir: {offline_model_dir}")

    model = model.to("cpu")

    q_emb = model.encode([query], convert_to_numpy=True, normalize_embeddings=True)
    D, I = index.search(q_emb, k)

    results = []
    for rank, idx in enumerate(I[0], start=1):
        if idx < 0 or idx >= len(metadata):
            continue

        meta = metadata[idx]
        doc_id = meta["doc_id"]
        page = meta["page"]
        para_idx = int(meta["chunk_id"].split("para")[-1])

        # Context paragraphs (same doc + page)
        related = []
        for offset in range(-context_paras, context_paras + 1):
            ctx_idx = idx + offset
            if (
                0 <= ctx_idx < len(metadata)
                and metadata[ctx_idx]["doc_id"] == doc_id
                and metadata[ctx_idx]["page"] == page
            ):
                related.append(metadata[ctx_idx]["text"])

        full_text = "\n\n".join(related)
        cleaned_text = clean_text(full_text)

        results.append(
            {
                "paragraph_with_context": cleaned_text,
                "page": page,
                "importance_rank": rank,
                "score": float(D[0][rank - 1]),
                "doc_id": doc_id,
            }
        )

    logger.info(f"Query '{query}' returned {len(results)} results")
    return results


# -------------------------------
# TEXT CLEANING
# -------------------------------
def clean_text(text: str) -> str:
    """
    Clean extracted text for readability.
    """
    text = re.sub(r"\s*\n\s*", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"-\s+", "", text)  # Fix hyphenated line breaks
    return text
