import os
import logging
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from services.enhanced_extractor import extract_outline_from_pdf

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1",
    tags=["Extraction"]
)

UPLOAD_DIRECTORY = "uploads"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

@router.get("/extract-outline/")
async def extract_outline(file_name: str = Query(..., description="PDF file name in uploads folder")):
    """
    Extract outline for a PDF file already in the uploads folder.
    """
    file_path = os.path.join(UPLOAD_DIRECTORY, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File '{file_name}' not found in uploads folder.")

    try:
        logger.info(f"Starting outline extraction for {file_name}...")
        extracted_data = extract_outline_from_pdf(file_path)
        logger.info(f"Extraction successful for {file_name}.")

        return JSONResponse(
            status_code=200,
            content={
                "message": "Outline extracted successfully",
                "data": extracted_data
            }
        )
    except Exception as e:
        logger.error(f"Error processing {file_name}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
