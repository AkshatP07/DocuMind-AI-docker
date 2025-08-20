from fastapi import APIRouter, UploadFile, BackgroundTasks, File
from typing import List
import os, shutil
from enum import Enum

from services import relevant_service

router = APIRouter(prefix="/relevant", tags=["Relevant Model"])

UPLOAD_DIR = "uploads"

@router.post("/upload")
async def upload_files(files: List[UploadFile]):
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
    
    for file in files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    
    # Re-index PDFs after upload
    result = relevant_service.index_pdfs()
    return {"status": "success", "details": result}


#Train route (indexes all PDFs already inside uploads/)
class TrainingStatus(str, Enum):
    idle = "idle"
    running = "running"
    done = "done"
    failed = "failed"

training_state = {"status": TrainingStatus.idle}

def run_training():
    try:
        training_state["status"] = TrainingStatus.running
        # your heavy blocking function
        relevant_service.index_pdfs()
        training_state["status"] = TrainingStatus.done
    except Exception as e:
        training_state["status"] = TrainingStatus.failed
        print("Training failed:", e)

@router.post("/train")
async def train(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_training)
    return {"status": "training started"}

@router.get("/train/status")
async def train_status():
    return training_state

@router.get("/search")
async def search(query: str, k: int = 5, context: int = 0):
    results = relevant_service.query_pdfs(query=query, k=k, context=context)
    return {"results": results}
