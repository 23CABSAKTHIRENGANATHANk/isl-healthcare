"""
ISL Setu — Production FastAPI AI Backend
Real-Time MediaPipe Landmark Sign Recognition, VoiceBridge, and PDF Certificate API
"""

import os
import sys
from io import BytesIO
from typing import Optional, List, Dict

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(__file__))

from services.sign_recognizer import recognizer, HEALTHCARE_VOCABULARY, PHRASE_MAPPINGS
from services.certificate_generator import generate_certificate_pdf
from services.tts_service import synthesize_speech, VOICE_MAPPING, CLINICAL_TAMIL_DICTIONARY

app = FastAPI(
    title="ISL Setu AI Backend",
    description="Real-Time Indian Sign Language Landmark Recognition, VoiceBridge, and Certificate API",
    version="1.0.0"
)

# Dynamic CORS origins for staging, preview, and production domains
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()] if raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True if allowed_origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Request & Response Models
# -----------------------------------------------------------------------------

class PredictRequest(BaseModel):
    image: Optional[str] = None
    target_sign: Optional[str] = None
    mode: Optional[str] = "ai"
    landmarks: Optional[List[List[Dict[str, float]]]] = None

class PredictResponse(BaseModel):
    success: bool
    sign: Optional[str] = None
    confidence: float
    phrase: Optional[str] = None
    mode: str = "ai"
    model_version: str = "isl_v1"
    message: Optional[str] = None
    landmarks: Optional[List[List[Dict[str, float]]]] = None

class VoiceBridgeRequest(BaseModel):
    signs: List[str]

class VoiceBridgeResponse(BaseModel):
    sentence: str
    signs: List[str]
    phrases: List[str]

class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "ta-IN"

# -----------------------------------------------------------------------------
# Health & Metadata Endpoints
# -----------------------------------------------------------------------------

@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "ISL Setu AI Sign Recognition Service",
        "model_loaded": recognizer.is_loaded,
        "model_version": "isl_v1",
        "supported_vocabulary": len(HEALTHCARE_VOCABULARY),
        "confidence_threshold": recognizer.confidence_threshold,
        "pdf_generation": "available (stdlib)"
    }

@app.get("/signs")
@app.get("/api/signs")
def list_supported_signs():
    return {
        "classes": HEALTHCARE_VOCABULARY,
        "phrases": PHRASE_MAPPINGS
    }

# -----------------------------------------------------------------------------
# Sign Prediction Endpoint
# -----------------------------------------------------------------------------

@app.post("/predict-sign", response_model=PredictResponse)
@app.post("/api/predict-sign", response_model=PredictResponse)
def predict_sign_endpoint(payload: PredictRequest):
    if payload.mode == "demo":
        target = (payload.target_sign or "HELLO").upper()
        return PredictResponse(
            success=True,
            sign=target,
            confidence=0.92,
            phrase=PHRASE_MAPPINGS.get(target, f"{target}."),
            mode="demo",
            model_version="isl_demo",
            message="Demo Mode simulation result"
        )

    result = recognizer.predict(payload.image, target_sign=payload.target_sign, client_landmarks=payload.landmarks)

    return PredictResponse(
        success=result["success"],
        sign=result.get("sign"),
        confidence=result.get("confidence", 0.0),
        phrase=result.get("phrase"),
        mode="ai",
        model_version=result.get("model_version", "isl_v1"),
        message=result.get("message"),
        landmarks=result.get("landmarks")
    )

# -----------------------------------------------------------------------------
# VoiceBridge Endpoint
# -----------------------------------------------------------------------------

@app.post("/voicebridge", response_model=VoiceBridgeResponse)
@app.post("/api/voicebridge", response_model=VoiceBridgeResponse)
def voicebridge_endpoint(payload: VoiceBridgeRequest):
    if not payload.signs:
        return VoiceBridgeResponse(sentence="", signs=[], phrases=[])

    phrases = [PHRASE_MAPPINGS.get(s.upper(), f"{s}.") for s in payload.signs]
    full_sentence = " ".join(phrases)

    return VoiceBridgeResponse(
        sentence=full_sentence,
        signs=payload.signs,
        phrases=phrases
    )

# -----------------------------------------------------------------------------
# Neural Text-to-Speech (TTS) Endpoint
# -----------------------------------------------------------------------------

@app.post("/api/tts")
@app.post("/tts")
def text_to_speech_endpoint(payload: TTSRequest):
    from fastapi import HTTPException
    
    clean_text = (payload.text or "").strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text payload cannot be empty.")
    
    if len(clean_text) > 500:
        raise HTTPException(status_code=400, detail="Text length exceeds maximum allowed limit of 500 characters.")
    
    lang = (payload.language or "ta-IN").strip()
    if lang not in VOICE_MAPPING and lang.split("-")[0] not in VOICE_MAPPING:
        raise HTTPException(status_code=400, detail=f"Unsupported language code '{lang}'. Supported: {list(VOICE_MAPPING.keys())}")
    
    result = synthesize_speech(clean_text, language=lang)
    if not result:
        raise HTTPException(status_code=503, detail="TTS service temporarily unavailable. Use client-side WebSpeech fallback.")
    
    audio_bytes, voice_name, engine_name = result
    
    return StreamingResponse(
        BytesIO(audio_bytes),
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": "inline; filename=speech.mp3",
            "X-TTS-Voice": voice_name,
            "X-TTS-Engine": engine_name,
            "Cache-Control": "public, max-age=86400",
        }
    )

# -----------------------------------------------------------------------------
# PDF Certificate Generation Endpoint
# -----------------------------------------------------------------------------

@app.get("/api/certificate/{credential_id}/pdf")
@app.get("/certificate/{credential_id}/pdf")
def download_certificate_pdf(
    credential_id: str,
    name: Optional[str] = Query(default="Healthcare Professional"),
    tier: Optional[str] = Query(default="bronze"),
    role: Optional[str] = Query(default="nurse"),
    score: Optional[int] = Query(default=80),
    issued_at: Optional[str] = Query(default=None),
):
    """
    Generates and streams an ISL Setu certificate PDF.

    Query parameters:
    - name: recipient full name
    - tier: bronze | silver | gold
    - role: healthcare role
    - score: assessment score 0-100
    - issued_at: ISO timestamp string (optional)
    """
    pdf_bytes = generate_certificate_pdf(
        recipient_name=name or "Healthcare Professional",
        credential_id=credential_id,
        tier=tier or "bronze",
        role=role or "nurse",
        score=score or 80,
        issued_at=issued_at,
    )

    safe_id = credential_id.replace("/", "_").replace("\\", "_")

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=ISL-Setu-Certificate-{safe_id}.pdf",
            "Cache-Control": "no-store",
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
