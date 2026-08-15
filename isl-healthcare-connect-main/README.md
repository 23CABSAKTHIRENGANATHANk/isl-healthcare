# 🛡️ ISL Setu (ISL Healthcare Connect)

**Tagline:** *"Learn ISL. Practice with AI. Communicate without barriers."*  
**Sector:** Healthcare & Medical Communication  
**Core Journey:** `LEARN → PRACTICE → COMMUNICATE → ASSESS → CERTIFY → ADOPT`  

---

## 1. 🎯 Project Overview & Problem Statement

### **Problem**
Over 18 million hearing-impaired individuals in India face severe communication barriers at hospital reception desks, emergency triage counters, nursing wards, and pharmacies. Medical staff often lack sign language training, leading to misdiagnoses, delayed care, and patient anxiety.

### **Solution**
ISL Setu provides an accessible, healthcare-first digital learning, real-time sign recognition practice, and multilingual translation platform. It empowers nurses, doctors, receptionists, pharmacists, and ASHA/ANM workers to learn Indian Sign Language (ISL) gestures and communicate effectively with deaf patients.

---

## 2. 🏗️ Architecture & Technology Stack

```
[ Frontend: React 18 + Vite + Tailwind CSS + shadcn/ui + TanStack Router ]
        │
        ├── Client-Side Vision: MediaPipe 21 3D Landmark Kinematics (Browser Wasm)
        │
        ├── Backend Service: Python FastAPI (OpenCV + Landmark Fallback + PDF Stream)
        │
        └── Database & Auth: Supabase PostgreSQL + Auth + Row Level Security (RLS)
```

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, shadcn/ui primitives, Framer Motion animations, Lucide Icons.
- **Backend API**: Python FastAPI (`backend/main.py`), MediaPipe 3D Landmark evaluation, OpenCV face-masked skin segmentation, reportlab PDF generator.
- **Database & Security**: Supabase PostgreSQL with 12 schema tables and strict RLS policies (`auth.uid() = id`, `auth.uid() = user_id`).
- **Voice Synthesis**: Web Speech API supporting 8 Indian languages (English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Marathi).

---

## 3. 📊 Status Matrix & System Classification

| Feature / Subsystem | Status Level | Description |
| :--- | :---: | :--- |
| **Frontend 14 Routes** | `IMPLEMENTED` | All 14 routes load cleanly with 200 OK, skeletons, and error handling |
| **75 Sign Video Demonstrations** | `IMPLEMENTED` | Curated HD videos for clinical signs with speed controls (0.5x–1.25x) |
| **Client MediaPipe Kinematics** | `IMPLEMENTED` | 21 3D landmark finger state & joint angle recognition in browser |
| **Python FastAPI Backend** | `IMPLEMENTED` | `/predict-sign`, `/health`, `/signs`, `/voicebridge`, `/api/certificate/pdf` |
| **Multilingual VoiceBridge** | `IMPLEMENTED` | Translates sign sequences into spoken audio across 8 Indian languages |
| **PDF Certificate Streaming** | `IMPLEMENTED` | Native PDF stream with credential verification ID and score |
| **Supabase DB & RLS Policies** | `IMPLEMENTED` | 12 tables + 12 RLS policies configured in `supabase/schema.sql` |
| **Sign MNIST Dataset** | `PROTOTYPE` | ASL static fingerspelling dataset isolated for experimental reference |
| **Physical Mobile Device Test** | `NOT TESTED` | Responsive browser mobile emulation tested across 5 viewport presets |
| **Offline Video Caching (PWA)** | `PLANNED` | Static video caching for low-bandwidth rural primary health centers |

---

## 4. 📂 Dataset & AI Recognition Architecture

### **Raw Video Dataset Inventory**
- **Location**: `dataset viedo/Video_Dataset` (Local storage; excluded from production deployment via `.gitignore`).
- **Volume**: 3,630 MP4 videos across 61 gesture categories (11 GB raw recordings).
- **Production Asset Strategy**: 75 web-optimized MP4 video demonstrations (~55 MB total) under `/public/videos/signs/` bundled into static builds.

### **Linguistic & Truthfulness Policy**
1. **Official ISL Content**: Video demonstrations and clinical sign lessons represent verified Indian Sign Language (ISL) gestures.
2. **ASL Separation**: Sign MNIST (static letters A-Y) is American Sign Language and is strictly labeled as experimental reference data, separate from the ISL healthcare vocabulary.
3. **Accuracy Disclaimer**: The AI recognition engine is a **Prototype Recognition System**. Results are honestly labeled with confidence metrics (`Prototype Recognition` / `Demo Mode`) and never falsely claimed as 100% official certification.

---

## 5. 🔑 Environment Variables & Security

Create a `.env` file in the project root:

```env
# Frontend Supabase Config
VITE_SUPABASE_URL="https://nndjafynozneorhvpxvg.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"

# Python FastAPI Backend Config
VITE_AI_API_URL="http://localhost:8000"
```

> [!CAUTION]
> `SUPABASE_SERVICE_ROLE_KEY` must **NEVER** be exposed in frontend code. All service role operations are restricted to backend edge handlers.

---

## 6. 💻 Local Setup & Execution Guide

### **1. Run Frontend Development Server**
```bash
npm install
npm run dev
```
*Frontend running at:* `http://localhost:5174`

### **2. Run Python FastAPI Backend Server**
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*Backend running at:* `http://127.0.0.1:8000`

### **3. Execute Unified Audit Suite**
```bash
npm run audit
```
*Runs frontend route checks, static video asset HEAD checks, and backend pytest suite.*

---

## 7. 🚀 Hackathon Live Demo Flow Sequence

1. **Landing Page (`/`)**: Show Healthcare Hero banner, live stats counter, and capability cards.
2. **Interactive Learning (`/learn`)**: Search `"Doctor"` or `"Fever"`, open lesson, play HD video demonstration at `0.5x` speed.
3. **AI Vision Practice (`/practice?sign=DOCTOR`)**: Demonstrate camera landmark recognition with 2-finger pulse gesture detection.
4. **Multilingual VoiceBridge (`/voicebridge`)**: Perform sign sequence and trigger spoken audio translation in **Tamil** or **Hindi**.
5. **Timed Assessment & PDF Certificate (`/assessment` & `/certification`)**: Complete quiz and stream the official **ISL Setu Platform Credential** PDF.
