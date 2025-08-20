import sys
import requests
from pathlib import Path

def azure_tts(voice: str, text: str, region: str, key: str, out_path: Path):
    """
    Generate TTS using Azure and write audio to out_path.
    """
    try:
        print("[Azure TTS] Ensuring output directory exists...")
        out_path.parent.mkdir(parents=True, exist_ok=True)

        # Request token
        token_url = f"https://{region}.api.cognitive.microsoft.com/sts/v1.0/issueToken"
        print("[Azure TTS] Requesting access token...")
        token_resp = requests.post(token_url, headers={"Ocp-Apim-Subscription-Key": key}, timeout=10)
        print("[Azure TTS] Token status code:", token_resp.status_code)
        if token_resp.status_code != 200:
            raise Exception(f"Token request failed: {token_resp.status_code}, {token_resp.text}")
        access_token = token_resp.text
        print("[Azure TTS] Token acquired.")

        # Prepare SSML
        ssml = f"<speak version='1.0' xml:lang='en-US'><voice name='{voice}'>{text}</voice></speak>"

        # TTS request
        tts_url = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
        print("[Azure TTS] Sending TTS request...")
        resp = requests.post(
            tts_url,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3"
            },
            data=ssml.encode("utf-8"),
            timeout=30
        )
        print("[Azure TTS] TTS response status:", resp.status_code)
        resp.raise_for_status()

        if not resp.content:
            raise Exception("Azure TTS returned empty audio content")

        with open(out_path, "wb") as f:
            f.write(resp.content)
        print(f"[Azure TTS] Audio written to {out_path} (size={out_path.stat().st_size} bytes)")

    except Exception as e:
        print(f"[Azure TTS] Error: {e}", file=sys.stderr)
        raise
