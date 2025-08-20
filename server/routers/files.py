from fastapi import APIRouter, UploadFile, File
from fastapi.responses import FileResponse
import os
from services.pdf_utils import extract_text_from_pdf

# keep routes same as before (no /files prefix)
router = APIRouter(tags=["files"])

# always resolve uploads relative to project root
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # project root
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(path):
        return FileResponse(path, media_type="application/pdf")
    return {"error": "File not found"}


@router.get("/files")
async def list_files():
    return {"files": os.listdir(UPLOAD_FOLDER)}


@router.post("/upload")
async def upload_file(file: UploadFile = File(...), action: str = "normal"):
    save_path = os.path.join(UPLOAD_FOLDER, file.filename)

    if os.path.exists(save_path) and action == "normal":
        return {"error": "File exists"}

    if action == "overwrite" and os.path.exists(save_path):
        os.remove(save_path)

    with open(save_path, "wb") as f:
        content = await file.read()
        f.write(content)

    extracted_text = extract_text_from_pdf(save_path)

    return {"status": "success", "filename": file.filename, "text": extracted_text}


@router.get("/process/{filename}")
async def process_existing_file(filename: str):
    path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(path):
        return {"error": "File not found"}

    extracted_text = extract_text_from_pdf(path)

    return {"status": "processed", "filename": filename, "text": extracted_text}


@router.delete("/delete/{filename}")
async def delete_file(filename: str):
    path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(path):
        os.remove(path)
        return {"status": "deleted"}
    return {"error": "File not found"}


@router.delete("/clear")
async def clear_uploads():
    for f in os.listdir(UPLOAD_FOLDER):
        os.remove(os.path.join(UPLOAD_FOLDER, f))
    return {"status": "cleared"}
