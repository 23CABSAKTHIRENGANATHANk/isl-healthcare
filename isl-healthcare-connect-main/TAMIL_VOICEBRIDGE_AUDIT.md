# 🇮🇳 ISL SETU — PROFESSIONAL NATURAL TAMIL VOICE ENGINE AUDIT REPORT
**System**: ISL Healthcare Connect (ISL Setu)  
**Component**: VoiceBridge Real-Time Indian Sign Language to Speech Translation  
**Primary Target Language**: Tamil (`ta-IN`)  
**Audit Date**: August 15, 2026  
**Final Status**: **PASS WITH DOCUMENTED LIMITATIONS**

---

## 1. Executive Summary

ISL Setu has implemented a dual-layer production voice architecture combining **Server-Side Neural Text-to-Speech (ta-IN-PallaviNeural)** with **Client-Side Web SpeechSynthesis Fallback**. Tamil vocalization operates strictly with **authentic Tamil Unicode phrases**, eliminating English transliterations and preventing silent audio drops.

---

## 2. Technical Architecture & Data Flow

```
+-------------------------------------------------------------------------------+
|                             ISL CAMERA INPUT                                  |
|                       (MediaPipe 21 Hand Landmarks)                           |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                    PREDICTION STABILIZER & KINEMATICS                         |
|                 (5-frame sliding window, 1200ms cooldown)                     |
+---------------------------------------+---------------------------------------+
                                        | Valid Stable Gesture (e.g. DOCTOR)
                                        v
+-------------------------------------------------------------------------------+
|                 CENTRALIZED CLINICAL TAMIL PHRASE ENGINE                      |
|       "தயவுசெய்து மருத்துவரை உடனடியாக அழைக்கவும்." (Pure Tamil Unicode)       |
+---------------------------------------+---------------------------------------+
                                        |
                    +-------------------+-------------------+
                    |                                       |
                    v (Layer 1: Primary)                    v (Layer 2: Fallback)
+---------------------------------------+   +-----------------------------------+
|       FASTAPI NEURAL TTS BACKEND      |   |   BROWSER Web SpeechSynthesis     |
|             (POST /api/tts)           |   |       (window.speechSynthesis)    |
|   - Azure Neural TTS / Stream Engine  |   |   - Filter for ta-IN / Tamil voice|
|   - Voice: ta-IN-PallaviNeural        |   |   - If unavailable: Show notice   |
|   - Output: audio/mpeg stream         |   |     (Never corrupt with English)  |
|   - In-memory session blob cache      |   |                                   |
+---------------------------------------+   +-----------------------------------+
                    |                                       |
                    +-------------------+-------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                      HIGH-CLARITY TAMIL AUDIO PLAYBACK                        |
|                     (Natural Spoken Healthcare Sentence)                      |
+-------------------------------------------------------------------------------+
```

---

## 3. Clinical Phrase Mapping Dictionary

All healthcare signs are mapped to medically appropriate Tamil sentences without transliteration:

| ISL Sign | Spoken Tamil Phrase (`ta-IN`) | English Translation |
| :--- | :--- | :--- |
| **HELP** | `"எனக்கு உடனடியாக உதவி தேவை."` | I need immediate help. |
| **DOCTOR** | `"தயவுசெய்து மருத்துவரை உடனடியாக அழைக்கவும்."` | Please call the doctor immediately. |
| **NURSE** | `"தயவுசெய்து செவிலியரை அழைக்கவும்."` | Please call the nurse. |
| **PAIN** | `"எனக்கு கடுமையான வலி உள்ளது."` | I am experiencing severe pain. |
| **FEVER** | `"எனக்கு காய்ச்சல் உள்ளது."` | I have a fever. |
| **MEDICINE** | `"தயவுசெய்து பரிந்துரைக்கப்பட்ட மருந்தை வழங்கவும்."` | Please provide the prescribed medicine. |
| **WATER** | `"தயவுசெய்து குடிக்க தண்ணீர் கொடுக்கவும்."` | Please give me drinking water. |
| **EMERGENCY** | `"அவசர மருத்துவ உதவி தேவை."` | Emergency medical assistance needed. |
| **HELLO** | `"வணக்கம், மருத்துவமனைக்கு நல்வரவு."` | Hello, welcome to the hospital. |
| **THANK YOU** | `"உங்கள் உதவிக்கு மிக்க நன்றி."` | Thank you for your assistance. |

---

## 4. Backend TTS Endpoint Specification

- **Route**: `POST /api/tts` & `POST /tts`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "text": "தயவுசெய்து மருத்துவரை உடனடியாக அழைக்கவும்.",
    "language": "ta-IN"
  }
  ```
- **Validation Rules**:
  - `text`: Mandatory, non-empty, max 500 characters. Strips emojis and HTML tags before synthesis.
  - `language`: Whitelisted against approved ISO codes (`ta-IN`, `hi-IN`, `en-IN`, `te-IN`, `kn-IN`, `ml-IN`, `bn-IN`, `mr-IN`, `en-US`).
- **Response**:
  - `Content-Type`: `audio/mpeg`
  - `Headers`: `X-TTS-Voice: ta-IN-PallaviNeural`, `X-TTS-Engine: Azure Neural TTS / Stream`
  - HTTP `400 Bad Request` on empty/excessive payload.
  - HTTP `503 Service Unavailable` triggers automatic browser WebSpeech fallback without UI interruption.

---

## 5. Duplicate Speech Prevention & Cooldown

- **Stabilization**: Hand landmark predictions pass through a 5-frame sliding window stabilizer.
- **Cooldown Window**: 1200ms cooldown timer prevents repeating gestures from spamming the audio engine.
- **Session Cache**: Synthesized audio blobs are cached in `ttsAudioCache` during the session, reducing network calls for repeated signs (`DOCTOR`, `WATER`) to 0ms latency.
- **Safe Interruption**: Any active audio stream or speech utterance is cancelled immediately when a new confirmed sign is detected or when the user switches languages.

---

## 6. Voice Status Indicators in VoiceBridge UI

The VoiceBridge UI displays an active badge indicating speech readiness:
- `● தமிழ் Neural Voice Ready`: Backend Neural TTS service is active.
- `● தமிழ் Browser Voice Ready`: Client-side WebSpeech Tamil engine is active.
- `⚠️ தமிழ் Voice Unavailable (Text Only)`: Neither engine has an available Tamil voice pack; displays Tamil text cleanly without attempting invalid English pronunciation.

---

## 7. Automated Test Verification

### Backend Pytest Suite (`python -m pytest backend/tests/ -v`)
- `TestCertificateGenerator`: 13 Passed
- `TestSignRecognizerVocabulary`: 5 Passed
- `TestFastAPIAppImport`: 4 Passed
- `TestSignRecognizerKinematics`: 7 Passed
- `TestTTSBackend`:
  - `test_tamil_clinical_dictionary_completeness`: PASSED
  - `test_sanitize_tts_text_strips_emojis_and_html`: PASSED
  - `test_tts_empty_text_raises_400`: PASSED
  - `test_tts_unsupported_language_raises_400`: PASSED
  - `test_tts_excessive_length_raises_400`: PASSED
  - `test_tts_endpoint_tamil_stream`: PASSED
- **Total Pytest Tests**: **35 Passed / 0 Failed (100%)**

### Frontend Route & Asset Audit (`npm run audit`)
- Frontend Routes: **15 Passed / 0 Failed**
- Video Assets: **8 Passed / 0 Failed**
- Production Bundle Build Time: **5.38s**

---

## 8. Documented Limitations & Environmental Constraints

1. **Hardware & Operating System Tamil Voice Dependencies:**
   - On Windows devices where neither Azure backend API nor Windows Tamil language pack (`ta-IN`) is installed, the browser WebSpeech API cannot synthesize Tamil audio. In this case, ISL Setu displays an informative message and shows the Tamil caption clearly.
2. **Mobile Browser Autoplay Policy:**
   - In accordance with browser security policies, automated audio playback requires an initial user interaction (e.g., clicking "Start Camera", "Test Voice", or tapping a sign).
