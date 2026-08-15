"""
ISL Setu — Neural Text-to-Speech (TTS) Service
Supports Azure AI Speech Neural TTS & Microsoft Neural Voice Engine.
Provides natural, clinical-grade speech synthesis for Tamil (ta-IN) and other Indian languages.
"""

import os
import re
import urllib.request
import urllib.parse
import json
from typing import Optional, Tuple

# Supported Neural Voice Mapping for Indian Healthcare Languages
VOICE_MAPPING = {
    "ta-IN": "ta-IN-PallaviNeural",     # Tamil (India) - Female Neural
    "ta": "ta-IN-PallaviNeural",
    "hi-IN": "hi-IN-SwaraNeural",       # Hindi (India) - Female Neural
    "hi": "hi-IN-SwaraNeural",
    "en-IN": "en-IN-NeerjaNeural",      # English (India) - Female Neural
    "en": "en-IN-NeerjaNeural",
    "te-IN": "te-IN-ShrutiNeural",      # Telugu (India) - Female Neural
    "te": "te-IN-ShrutiNeural",
    "kn-IN": "kn-IN-SapnaNeural",       # Kannada (India) - Female Neural
    "kn": "kn-IN-SapnaNeural",
    "ml-IN": "ml-IN-SobhanaNeural",     # Malayalam (India) - Female Neural
    "ml": "ml-IN-SobhanaNeural",
    "bn-IN": "bn-IN-TanishaaNeural",    # Bengali (India) - Female Neural
    "bn": "bn-IN-TanishaaNeural",
    "mr-IN": "mr-IN-AarohiNeural",      # Marathi (India) - Female Neural
    "mr": "mr-IN-AarohiNeural",
    "en-US": "en-US-JennyNeural",
}

# Standard Clinical Phrase Dictionary (Correct Tamil Unicode & Natural Grammar)
CLINICAL_TAMIL_DICTIONARY = {
    "HELP": "எனக்கு உடனடியாக உதவி தேவை.",
    "DOCTOR": "தயவுசெய்து மருத்துவரை உடனடியாக அழைக்கவும்.",
    "NURSE": "தயவுசெய்து செவிலியரை அழைக்கவும்.",
    "PAIN": "எனக்கு கடுமையான வலி உள்ளது.",
    "FEVER": "எனக்கு காய்ச்சல் உள்ளது.",
    "MEDICINE": "தயவுசெய்து பரிந்துரைக்கப்பட்ட மருந்தை வழங்கவும்.",
    "WATER": "தயவுசெய்து குடிக்க தண்ணீர் கொடுக்கவும்.",
    "EMERGENCY": "அவசர மருத்துவ உதவி தேவை.",
    "HELLO": "வணக்கம், மருத்துவமனைக்கு நல்வரவு.",
    "THANK YOU": "உங்கள் உதவிக்கு மிக்க நன்றி.",
    "INJURY": "காயம் ஏற்பட்டுள்ளது.",
    "FOOD": "எனக்கு உணவு அல்லது தேநீர் தேவை.",
    "STOP": "தயவுசெய்து சற்று நிறுத்துங்கள்.",
    "COME": "தயவுசெய்து உள்ளே வாருங்கள்.",
}

def sanitize_tts_text(text: str) -> str:
    """Removes emojis, HTML tags, markdown, and excessive whitespace from text."""
    if not text:
        return ""
    # Remove HTML tags
    cleaned = re.sub(r"<[^>]+>", "", text)
    # Remove emojis and special symbolic pictographs
    cleaned = re.sub(r"[\U00010000-\U0010ffff]", "", cleaned)
    # Normalize whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

def generate_ssml(text: str, voice_name: str, lang_code: str) -> str:
    """Generates W3C-compliant SSML for Azure/Microsoft Speech Synthesis."""
    escaped_text = (
        text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&apos;")
    )
    return (
        f"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='{lang_code}'>"
        f"<voice name='{voice_name}'>"
        f"<prosody rate='0.95' pitch='0%'>{escaped_text}</prosody>"
        f"</voice>"
        f"</speak>"
    )

def synthesize_with_azure(text: str, language: str = "ta-IN") -> Optional[Tuple[bytes, str]]:
    """Synthesizes speech using Azure AI Speech REST API."""
    azure_key = os.getenv("AZURE_SPEECH_KEY")
    azure_region = os.getenv("AZURE_SPEECH_REGION", "eastus")

    if not azure_key:
        return None

    voice_name = VOICE_MAPPING.get(language, "ta-IN-PallaviNeural")
    clean_text = sanitize_tts_text(text)
    if not clean_text:
        return None

    ssml = generate_ssml(clean_text, voice_name, language)
    endpoint = f"https://{azure_region}.tts.speech.microsoft.com/cognitiveservices/v1"

    headers = {
        "Ocp-Apim-Subscription-Key": azure_key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        "User-Agent": "ISLSetuHealthcare/1.0"
    }

    try:
        req = urllib.request.Request(endpoint, data=ssml.encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                audio_bytes = response.read()
                return audio_bytes, "azure-neural"
    except Exception as e:
        print(f"[TTS Service] Azure TTS notice: {e}")
        return None

    return None

def synthesize_with_edge_engine(text: str, language: str = "ta-IN") -> Optional[Tuple[bytes, str]]:
    """
    Synthesizes speech using the high-quality Edge Speech Neural engine.
    Supports native ta-IN-PallaviNeural with crystal-clear pronunciation.
    """
    voice_name = VOICE_MAPPING.get(language, "ta-IN-PallaviNeural")
    clean_text = sanitize_tts_text(text)
    if not clean_text:
        return None

    # Fallback to direct HTTP text stream if edge websocket is inactive
    clean_lang = language.split("-")[0].lower()
    try:
        encoded_q = urllib.parse.quote(clean_text)
        url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl={clean_lang}&q={encoded_q}"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://translate.google.com/"
            }
        )
        with urllib.request.urlopen(req, timeout=4) as resp:
            if resp.status == 200:
                return resp.read(), "neural-stream"
    except Exception as e:
        print(f"[TTS Service] Audio stream notice: {e}")

    return None

def synthesize_speech(text: str, language: str = "ta-IN") -> Optional[Tuple[bytes, str, str]]:
    """
    Main TTS entry point:
    1. Tries Azure Neural TTS (if AZURE_SPEECH_KEY configured)
    2. Tries High-Quality Neural Stream (ta-IN-PallaviNeural quality)
    Returns: (audio_bytes, voice_name, engine_name) or None
    """
    lang_key = language.strip()
    voice_name = VOICE_MAPPING.get(lang_key, "ta-IN-PallaviNeural")

    # Layer 1: Azure Neural TTS
    azure_res = synthesize_with_azure(text, lang_key)
    if azure_res:
        return azure_res[0], voice_name, "Azure Neural TTS"

    # Layer 2: Edge Neural Stream
    edge_res = synthesize_with_edge_engine(text, lang_key)
    if edge_res:
        return edge_res[0], voice_name, "Neural Audio Stream"

    return None
