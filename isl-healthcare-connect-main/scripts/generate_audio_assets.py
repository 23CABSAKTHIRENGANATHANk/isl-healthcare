"""
ISL Setu — Healthcare Audio Asset Generator
Generates high-clarity natural Tamil, Hindi, and English spoken audio files for all core healthcare signs.
Saves them in public/audio/{lang}/{sign}.mp3 for 100% offline & instant client-side playback.
"""

import os
import urllib.parse
import urllib.request
import time

AUDIO_BASE = os.path.join(os.path.dirname(__file__), "..", "public", "audio")

PHRASES = {
    "ta": {
        "HELP": "எனக்கு உடனடியாக உதவி தேவை.",
        "DOCTOR": "தயவுசெய்து மருத்துவரை உடனடியாக அழைக்கவும்.",
        "NURSE": "தயவுசெய்து செவிலியரை அழைக்கவும்.",
        "PAIN": "எனக்கு கடுமையான வலி உள்ளது.",
        "FEVER": "எனக்கு காய்ச்சல் உள்ளது.",
        "MEDICINE": "தயவுசெய்து பரிந்துரைக்கப்பட்ட மருந்தை வழங்கவும்.",
        "WATER": "தயவுசெய்து குடிக்க தண்ணீர் கொடுக்கவும்.",
        "EMERGENCY": "அவசர மருத்துவ உதவி தேவை.",
        "HELLO": "வணக்கம், மருத்துவமனைக்கு நல்வரவு.",
        "THANK_YOU": "உங்கள் உதவிக்கு மிக்க நன்றி.",
        "INJURY": "காயம் ஏற்பட்டுள்ளது.",
        "FOOD": "எனக்கு உணவு அல்லது தேநீர் தேவை.",
        "STOP": "தயவுசெய்து சற்று நிறுத்துங்கள்.",
        "COME": "தயவுசெய்து உள்ளே வாருங்கள்.",
    },
    "hi": {
        "HELP": "मुझे तुरंत सहायता चाहिए।",
        "DOCTOR": "कृपया डॉक्टर को तुरंत बुलाएं।",
        "NURSE": "कृपया नर्स को बुलाएं।",
        "PAIN": "मुझे बहुत दर्द हो रहा है।",
        "FEVER": "मुझे बुखार है।",
        "MEDICINE": "कृपया निर्धारित दवाई दें।",
        "WATER": "कृपया पीने का पानी दें।",
        "EMERGENCY": "यह एक आपातकालीन स्थिति है।",
        "HELLO": "नमस्ते, अस्पताल में आपका स्वागत है।",
        "THANK_YOU": "आपकी सहायता के लिए धन्यवाद।",
        "INJURY": "चोट लगी है।",
        "FOOD": "मुझे भोजन चाहिए।",
        "STOP": "कृपया रुकिए।",
        "COME": "कृपया अंदर आइए।",
    },
    "en": {
        "HELP": "I need immediate help.",
        "DOCTOR": "Please call the doctor immediately.",
        "NURSE": "Please call the nurse.",
        "PAIN": "I am experiencing severe pain.",
        "FEVER": "I have a fever.",
        "MEDICINE": "Please provide the prescribed medicine.",
        "WATER": "Please give me drinking water.",
        "EMERGENCY": "Emergency medical assistance needed.",
        "HELLO": "Hello, welcome to the hospital.",
        "THANK_YOU": "Thank you for your assistance.",
        "INJURY": "Injury detected.",
        "FOOD": "I need food or water.",
        "STOP": "Please stop.",
        "COME": "Please come in.",
    }
}

def generate_audio():
    for lang, sign_map in PHRASES.items():
        lang_dir = os.path.join(AUDIO_BASE, lang)
        os.makedirs(lang_dir, exist_ok=True)
        
        for sign, text in sign_map.items():
            filepath = os.path.join(lang_dir, f"{sign}.mp3")
            if os.path.exists(filepath) and os.path.getsize(filepath) > 500:
                print(f"[Audio Generator] Exists: {lang}/{sign}.mp3 ({os.path.getsize(filepath)} bytes)")
                continue

            encoded_text = urllib.parse.quote(text)
            url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl={lang}&q={encoded_text}"
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://translate.google.com/"
            }
            
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=6) as resp:
                    if resp.status == 200:
                        content = resp.read()
                        with open(filepath, "wb") as f:
                            f.write(content)
                        print(f"[OK] Generated: {lang}/{sign}.mp3 ({len(content)} bytes)")
                time.sleep(0.15)
            except Exception as e:
                print(f"[ERR] Failed for {lang}/{sign}: {e}")

if __name__ == "__main__":
    generate_audio()
