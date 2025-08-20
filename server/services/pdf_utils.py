import fitz  # PyMuPDF

def extract_text_from_pdf(path: str) -> str:
    extracted_text = ""
    doc = fitz.open(path)
    for page in doc:
        extracted_text += page.get_text()
    return extracted_text.strip()
