from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict
from pathlib import Path
import os
import requests
import json
from urllib.parse import urlparse
from backends.tts.generate_audio import azure_tts

router = APIRouter(prefix="/v1/audio", tags=["TTS"])

class AudioRequest(BaseModel):
    text: Dict

def get_gemini_api_key() -> str:
    # Get path to JSON credentials
    gcp_credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not gcp_credentials_path or not os.path.exists(gcp_credentials_path):
        raise Exception("GOOGLE_APPLICATION_CREDENTIALS not set or file missing")
    
    # Load JSON and extract API key
    with open(gcp_credentials_path, "r") as f:
        creds = json.load(f)
    api_key = creds.get("api_key")
    if not api_key:
        raise Exception("GEMINI API key not found in credentials JSON")
    return api_key

def generate_script_from_llm(text: dict) -> List[Dict]:
    try:
        api_key = get_gemini_api_key()
        gemini_model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent"
        headers = {"Content-Type": "application/json", "X-goog-api-key": api_key}
        prompt = (
            f"Generate an engaging, natural-sounding audio script for an overview. "
            f"Start with no introduction and pour knowledge from the first word. "
            f"Base it *exclusively* on the following JSON insights data: {text}"
        )

        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        for attempt in range(2):
            try:
                resp = requests.post(url, headers=headers, json=payload, timeout=25)
                resp.raise_for_status()
                generated_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                return [{"speaker": "sp1", "text": generated_text}]
            except Exception:
                if attempt == 1:
                    return [{"speaker": "sp1", "text": "Error generating script."}]
    except Exception:
        return [{"speaker": "sp1", "text": "Error generating script."}]

def delete_file(path: Path):
    try:
        if path.exists():
            path.unlink()
    except:
        pass

@router.post("/")
def create_audio(req: AudioRequest):
    script_turns = generate_script_from_llm(req.text)
    full_text = " ".join([t["text"] for t in script_turns])

    try:
        media_dir = Path("storage/media")
        media_dir.mkdir(parents=True, exist_ok=True)
        temp_file = media_dir / "output.mp3"
        background_tasks = BackgroundTasks()
        background_tasks.add_task(delete_file, temp_file)

        # Azure credentials from environment
        AZURE_KEY = os.environ.get("AZURE_TTS_KEY")
        AZURE_ENDPOINT = os.environ.get("AZURE_TTS_ENDPOINT")

        if not AZURE_KEY or not AZURE_ENDPOINT:
            raise HTTPException(status_code=500, detail="Azure TTS credentials not set")

        # Parse region from endpoint dynamically
        parsed_url = urlparse(AZURE_ENDPOINT)
        AZURE_REGION = parsed_url.netloc.split(".")[0]  # e.g., 'centralindia'

        # Generate audio
        azure_tts("en-US-DavisNeural", full_text, AZURE_REGION, AZURE_KEY, temp_file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {e}")

    return FileResponse(
        path=temp_file,
        media_type="audio/mpeg",
        filename="output.mp3",
        background=background_tasks
    )
