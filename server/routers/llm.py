from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import asyncio
import os
import json

router = APIRouter(prefix="/v1/llm", tags=["LLM"])

# Request body model
class LLMRequest(BaseModel):
    prompt: str

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

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

@router.post("/generate")
async def generate_llm(req: LLMRequest):
    api_key = get_gemini_api_key()
    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    GEMINI_URL,
                    json={"contents": [{"parts": [{"text": req.prompt}]}]},
                    headers={
                        "Content-Type": "application/json",
                        "X-goog-api-key": api_key
                    },
                    timeout=30
                )
            response.raise_for_status()
            return response.json()  # pass Gemini output back
        except httpx.HTTPError as e:
            if attempt == max_retries:
                raise HTTPException(status_code=500, detail=str(e))
            await asyncio.sleep(1 * (attempt + 1))  # exponential backoff
