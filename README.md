# ISL Setu — Indian Sign Language Healthcare Learning & Communication Platform

> **Tagline:** Learn ISL. Practice with AI. Communicate without barriers.

ISL Setu is a comprehensive healthcare-focused competency platform that empowers healthcare workers to learn Indian Sign Language (ISL), practice signs using an AI-assisted camera, communicate basic patient needs through VoiceBridge (Sign ➔ Text ➔ Voice), complete clinical assessments, earn verifiable credentials, and achieve hospital-wide ISL readiness.

---

## 🏗️ Architecture & Technology Stack

```
                     ┌────────────────────────────────┐
                     │            USER                │
                     │  Doctor / Nurse / ASHA Worker  │
                     └───────────────┬────────────────┘
                                     │
                                     ▼
                     ┌────────────────────────────────┐
                     │     ISL SETU FRONTEND (PWA)    │
                     │  React 19 + TypeScript + Vite  │
                     │  Tailwind CSS + Framer Motion  │
                     └───────┬──────────────┬─────────┘
                             │              │
              ┌──────────────┘              └──────────────┐
              ▼                                            ▼
   ┌───────────────────────┐                    ┌───────────────────────┐
   │   SUPABASE BACKEND    │                    │   PYTHON AI BACKEND   │
   │  PostgreSQL Database  │                    │   FastAPI + OpenCV    │
   │  Authentication & RLS │                    │   MediaPipe Hands     │
   │  Storage & Triggers   │                    │   Sign Classification │
   └───────────────────────┘                    └───────────────────────┘
```

---

## 📦 9 Complete Modules

1. **Module 1 — Authentication & Roles**: Email login, signup with 7 healthcare roles (*Nurse, Doctor, Pharmacist, ASHA/ANM, Receptionist, Security, Counsellor*).
2. **Module 2 — ISL Learning**: 4 categories (*Basic, Clinical, Navigation, Needs*), 7 lessons, captions, video demonstrations, step breakdowns, streak tracking.
3. **Module 3 — AI Practice**: Live camera viewfinder, MediaPipe hand landmark extraction, confidence scoring (e.g. 94%), instant feedback.
4. **Module 4 — VoiceBridge**: Real-time **Sign ➔ Text ➔ Voice** communication bridge with Web Speech API audio playback.
5. **Module 5 — Timed Assessment**: Timed 15-minute clinical quiz with multiple-choice questions, pass/fail evaluation (75% pass mark), and database result recording.
6. **Module 6 — Certification**: Automatic unique credential issuance (`ISL-BRONZE-XXXX`), Bronze/Silver/Gold tier tracking, and one-click **PDF Download / Print**.
7. **Module 7 — Hospital Dashboard**: "ISL-Ready" readiness metrics, department coverage tracking, and certified staff roster.
8. **Module 8 — Admin & Trainer Portal**: Full CRUD management for lessons, signs, assessment questions, and staff.
9. **Module 9 — Accessibility & Rural PWA**: Mobile PWA installation (`manifest.json`), high contrast UI, regional variation notes, and offline learning support.

---

## 🚀 Quick Start Guide

### 1. Database Setup (Supabase)
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor**, copy the contents of `isl-healthcare-connect-main/supabase/schema.sql`, and click **Run**.
3. Under **Authentication ➔ Providers ➔ Email**, disable *Confirm Email* for instant local development logins.

### 2. Run Frontend
```bash
cd isl-healthcare-connect-main
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 3. (Optional) Run Python AI Backend
```bash
cd isl-healthcare-connect-main/backend
pip install -r requirements.txt
python main.py
```
*The FastAPI AI backend will start on `http://localhost:8000`. If offline, the frontend seamlessly uses client-side simulated computer vision.*
