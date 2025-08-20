from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import your routers
from routers import tts, files, model_relevant, model_a,llm 

app = FastAPI(title="Unified Backend")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount React build as static files
app.mount("/", StaticFiles(directory="static", html=True), name="frontend")

# Register API routers
app.include_router(files.router)
app.include_router(tts.router)
app.include_router(model_relevant.router)
app.include_router(model_a.router)
app.include_router(llm.router)
