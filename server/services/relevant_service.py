import os
from backends.relevant_model import relevant_utilis


# uploads is sibling folder, not inside relevant_model
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
UPLOAD_DIR = os.path.abspath(UPLOAD_DIR)

INDEX_DIR = os.path.join(os.path.dirname(__file__), "..", "storage", "index_data")
INDEX_DIR = os.path.abspath(INDEX_DIR)


def index_pdfs():
    """Index all PDFs in uploads folder."""
    corpus = relevant_utilis.create_corpus_from_folder(UPLOAD_DIR)
    if not corpus:
        return {"message": "No PDFs found in uploads"}

    embeddings, model = relevant_utilis.build_embeddings(corpus)
    metadata = [
        {"doc_id": c["doc_id"], "page": c["page"], "text": c["text"], "chunk_id": c["chunk_id"]}
        for c in corpus
    ]
    relevant_utilis.build_faiss_index(embeddings, INDEX_DIR, metadata)

    return {"message": f"Indexed {len(corpus)} paragraphs from PDFs"}


def query_pdfs(query: str, k: int = 5, context: int = 0):
    """Search PDFs for relevant paragraphs."""
    index, metadata = relevant_utilis.load_index_and_meta(INDEX_DIR)
    results = relevant_utilis.query_index_with_context(query, index, metadata, k=k, context_paras=context)
    return results
