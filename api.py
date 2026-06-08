import os
import io
import uuid
import json
import shutil
import logging
from contextlib import asynccontextmanager
from typing import Optional, Dict

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import scipy.io.wavfile as wavfile
import numpy as np

# Import the original demo class without modifying app.py
from app import VoxCPMDemo

logger = logging.getLogger(__name__)

# Global variables to hold the loaded model and voice mapping
voxcpm_demo: Optional[VoxCPMDemo] = None
# A simple in-memory mapping of voice_id to file path
VOICES_DIR = os.path.join(os.path.dirname(__file__), "voices")
voices_db: Dict[str, dict] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    global voxcpm_demo
    # Ensure the voices directory exists
    os.makedirs(VOICES_DIR, exist_ok=True)
    
    # Load any existing voices from the voices directory into memory
    for item in os.listdir(VOICES_DIR):
        item_path = os.path.join(VOICES_DIR, item)
        if os.path.isdir(item_path):
            config_path = os.path.join(item_path, "config.json")
            if os.path.exists(config_path):
                try:
                    with open(config_path, "r", encoding="utf-8") as f:
                        config = json.load(f)
                    
                    voice_id = config.get("id", item)
                    name = config.get("name", "Unknown Voice")
                    filename = config.get("filename")
                    
                    if filename:
                        file_path = os.path.join(item_path, filename)
                        voices_db[voice_id] = {
                            "id": voice_id,
                            "name": name,
                            "file_path": file_path
                        }
                except Exception as e:
                    logger.warning(f"Failed to load config for voice folder {item}: {e}")
            
    logger.info("Initializing VoxCPM Demo and loading model...")
    # Initialize and pre-load the model
    voxcpm_demo = VoxCPMDemo(model_id="openbmb/VoxCPM2")
    voxcpm_demo.get_or_load_voxcpm()
    logger.info("VoxCPM model loaded successfully.")
    yield
    # Cleanup if needed
    logger.info("Shutting down API...")

app = FastAPI(
    title="VoxCPM API",
    description="API for VoxCPM TTS Agent",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None
    control_instruction: Optional[str] = ""
    cfg_value: float = 2.0
    dit_steps: int = 10
    prompt_text: Optional[str] = ""
    do_normalize: bool = True
    denoise: bool = True

@app.get("/")
def read_root():
    return {"message": "VoxCPM API is running."}

@app.get("/healthz")
def health_check():
    return {"status": "ok"}

@app.post("/api/voices", summary="Upload a new voice reference")
async def add_voice(
    file: UploadFile = File(...),
    name: str = Form(...)
):
    """
    Upload a voice audio file without running ASR transcription to save VRAM.
    """
    if not file.filename.endswith((".wav", ".mp3", ".flac", ".ogg")):
        raise HTTPException(status_code=400, detail="Invalid audio file type.")
    
    # Sanitize name to create voice_id (replace spaces with underscores)
    voice_id = name.replace(" ", "_")
    voice_dir = os.path.join(VOICES_DIR, voice_id)
    os.makedirs(voice_dir, exist_ok=True)
    
    # Keep the original extension
    ext = os.path.splitext(file.filename)[1]
    save_filename = f"audio{ext}"
    file_path = os.path.join(voice_dir, save_filename)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    config = {
        "id": voice_id,
        "name": name,
        "filename": save_filename
    }
    with open(os.path.join(voice_dir, "config.json"), "w", encoding="utf-8") as f:
        json.dump(config, f, indent=4)
        
    voice_record = {
        "id": voice_id,
        "name": name,
        "file_path": file_path
    }
    voices_db[voice_id] = voice_record
    
    return voice_record

@app.delete("/api/voices/{voice_id}", summary="Delete a voice reference")
def delete_voice(voice_id: str):
    """Deletes a voice reference and its associated audio file."""
    if voice_id not in voices_db:
        raise HTTPException(status_code=404, detail="Voice not found")
        
    voice_dir = os.path.join(VOICES_DIR, voice_id)
    try:
        if os.path.exists(voice_dir):
            shutil.rmtree(voice_dir)
    except Exception as e:
        logger.error(f"Failed to delete directory {voice_dir}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete voice folder from disk")
        
    del voices_db[voice_id]
    return {"status": "success", "message": f"Voice {voice_id} deleted"}

@app.get("/api/voices", summary="List added voices")
def list_voices():
    """Returns a list of all available voice references."""
    return list(voices_db.values())

@app.post("/api/generate", summary="Generate TTS Audio")
async def generate_tts(req: GenerateRequest):
    """
    Generate speech using VoxCPM.
    If voice_id is provided, it uses it for cloning.
    If control_instruction is provided without voice_id, it uses Voice Design mode.
    """
    global voxcpm_demo
    if not voxcpm_demo:
        raise HTTPException(status_code=503, detail="Model is not loaded yet.")
    
    reference_wav_path = None
    if req.voice_id:
        if req.voice_id not in voices_db:
            raise HTTPException(status_code=404, detail="Voice ID not found.")
        reference_wav_path = voices_db[req.voice_id]["file_path"]

    try:
        sr, wav_np = voxcpm_demo.generate_tts_audio(
            text_input=req.text,
            control_instruction=req.control_instruction,
            reference_wav_path_input=reference_wav_path,
            prompt_text=req.prompt_text,
            cfg_value_input=req.cfg_value,
            do_normalize=req.do_normalize,
            denoise=req.denoise,
            inference_timesteps=req.dit_steps,
        )
        
        # Write numpy array to a bytes buffer
        buffer = io.BytesIO()
        wavfile.write(buffer, sr, wav_np)
        buffer.seek(0)
        
        return StreamingResponse(buffer, media_type="audio/wav")
    except Exception as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
