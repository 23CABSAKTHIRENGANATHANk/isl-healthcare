# AI Architecture Audit: ISL Setu

**Date:** August 2026  
**Auditor:** Senior AI/ML + Full-Stack Engineer  
**Project:** ISL Setu — Indian Sign Language Healthcare Learning & Communication Platform  

---

## 1. Executive Summary

This architecture audit evaluates the entire AI, Frontend, Backend, and Dataset stack for **ISL Setu**. The goal is to build an end-to-end, scientifically sound, and production-ready Indian Sign Language (ISL) recognition pipeline:

$$\text{Camera Frame} \longrightarrow \text{MediaPipe 3D Landmarks} \longrightarrow \text{Trained Landmark Model} \longrightarrow \text{Predicted Sign} \longrightarrow \text{Confidence Score} \longrightarrow \text{Speech Synthesis (Voice)}$$

---

## 2. Current Architecture Overview

### Frontend
- **Framework:** React 19 + TypeScript + Vite + TanStack Start.
- **Styling:** Tailwind CSS (v4) + shadcn/ui + Framer Motion animations.
- **Routing:** TanStack File-Based Router with protected route guards (`/learn`, `/practice`, `/voicebridge`, `/assessment`, `/certification`, `/hospital`, `/admin`).
- **State & Data Fetching:** TanStack React Query.
- **Audio Output:** Web Speech API (`SpeechSynthesis`) with `en-IN` voice synthesis.

### Database & Auth
- **Platform:** Supabase PostgreSQL + Supabase Auth.
- **Tables:** `profiles`, `lessons`, `signs`, `lesson_progress`, `assessments`, `assessment_questions`, `assessment_results`, `certificates`, `achievements`, `user_achievements`, `hospitals`, `hospital_staff`.
- **Security:** Row Level Security (RLS) enabled across all tables with `handle_new_user()` trigger.

### AI & Backend Pipeline
- **Backend Framework:** Python 3.10+ FastAPI on port 8000 with CORS middleware.
- **Vision Pipeline:** MediaPipe Hands (21 3D hand keypoints per hand) + OpenCV frame processing.
- **Datasets in Workspace:**
  1. `sign dataset/`: Sign Language MNIST CSV dataset (28x28 grayscale, 24 ASL letters).
  2. `dataset viedo/`: 61 categories of Indian Sign Language MP4 video files.

---

## 3. Existing AI Functionality & Evaluation

| Component | Current State | Audit Finding / Problem | Recommended Action |
| :--- | :--- | :--- | :--- |
| `src/services/ai.service.ts` | Dispatches frame to backend; falls back to simulation | Works well; needs explicit `AI MODE` vs `DEMO MODE` state separation and `VITE_AI_API_URL` env variable. | Update to pass live frame with abort controller, confidence thresholds, and clear mode toggling. |
| `src/routes/practice.tsx` | Captures camera feed via `useCamera` and calls `predictSign` | Camera viewfinder works; needs clear UI indicator for real AI model predictions vs demo mode, and low-confidence guidance. | Add AI/Demo mode toggle, landmark confidence badge, and logging of attempts. |
| `src/routes/voicebridge.tsx` | Accumulates signs and triggers `speak()` | Sentence construction is basic; needs controlled healthcare phrase mapping. | Connect with real FastAPI prediction stream and controlled vocabulary dictionary. |
| `backend/main.py` | FastAPI server with `/api/predict-sign` and `/api/voicebridge` | Relied partly on Sign MNIST which is ASL, not ISL. | Refactor to use a dedicated MediaPipe landmark feature classifier trained strictly on the validated ISL video dataset. |

---

## 4. Dataset Audit & Class Selection

### Dataset Mismatch Identification:
- **`sign dataset/` (Sign MNIST):** Contains 27,455 training and 7,172 test 28x28 images of American Sign Language (ASL) fingerspelling (A-Y except J and Z).
  > **CRITICAL RULE:** Sign MNIST is **ASL**, not Indian Sign Language (ISL). It must **NOT** be used as a production ISL training dataset.
- **`dataset viedo/` (ISL Video Dataset):** Contains 61 gesture categories recorded in MP4 video format (approx. 60 videos per class, 3,600+ total video clips).

### Selected Initial Healthcare ISL MVP Classes (10 Classes):
1. `Fever` $\rightarrow$ **FEVER** (Clinical temperature evaluation)
2. `Injury` $\rightarrow$ **PAIN** (Trauma / physical distress)
3. `Drink` $\rightarrow$ **WATER** (Basic hydration request)
4. `Hello` $\rightarrow$ **HELLO** (Hospital reception greeting)
5. `Thank you` $\rightarrow$ **THANK YOU** (Polite patient interaction)
6. `Good Morning` $\rightarrow$ **GOOD MORNING** (Ward morning greeting)
7. `Give` $\rightarrow$ **MEDICINE** (Medication hand-off)
8. `Tea` $\rightarrow$ **FOOD** (Nutrition & breakfast need)
9. `Close` $\rightarrow$ **STOP** (Instruction to pause/halt)
10. `Come` $\rightarrow$ **COME** (Direction to enter consultation room/OPD)

---

## 5. Data Leakage Prevention Strategy

Many video clips in the dataset are spatial augmentations (`_left_tilt`, `_right_tilt`, `_Trim_cropped`) of the same original recording session (`WIN_20230901_*` and `WIN_20230926_*`).

### Split Protocol:
- **Base Video Grouping:** All augmented variations derived from the same base video MUST stay in the same split.
- **Session / Signer Split:**
  - **Training Set (70%):** Primary recording sessions from `WIN_20230901_*`.
  - **Validation Set (15%):** Held-out videos from `WIN_20230901_*`.
  - **Test Set (15%):** Completely independent session `WIN_20230926_*` for unbiased signer-independent evaluation.

---

## 6. Preprocessing & Model Architecture

### Landmark Extraction Pipeline:
1. Video / Frame Input $\rightarrow$ OpenCV RGB conversion.
2. MediaPipe Hands detection $\rightarrow$ 21 landmarks $(x_i, y_i, z_i)$ per hand (42 features per hand, 84 features for two hands).
3. Coordinate normalization:
   $$\hat{x}_i = \frac{x_i - x_{\text{wrist}}}{s}, \quad \hat{y}_i = \frac{y_i - y_{\text{wrist}}}{s}, \quad \hat{z}_i = \frac{z_i - z_{\text{wrist}}}{s}$$
   where $s = \|\text{MCP}_{\text{middle}} - \text{Wrist}\|$ provides scale and position invariance.
4. Feature caching to reproducible NumPy binary format (`backend/data/isl_landmarks_train.npz`).

### Model Selection:
- **Architecture:** Multi-Layer Perceptron (MLP) / Gradient Boosting / Random Forest on normalized MediaPipe 3D geometric landmarks.
- **Why Landmark-Based MLP over Raw Video 3D-CNN:**
  - Reduces background, lighting, and skin-tone bias.
  - Model footprint is $<5 \text{ MB}$, enabling sub-15ms real-time CPU inference on standard laptops.
  - High accuracy on canonical hand configurations without requiring GPUs.

---

## 7. Files to Modify vs Untouched

### Files to Modify:
- `backend/main.py`: Refactor to load standalone landmark recognizer service.
- `backend/services/sign_recognizer.py`: Standalone inference service with confidence thresholding ($\ge 0.70$).
- `backend/training/preprocess_videos.py`: MediaPipe video landmark feature extractor with session-aware splitting.
- `backend/training/train_landmark_model.py`: Model training, metrics computation, and export.
- `backend/training/evaluate.py`: Test set evaluation generating confusion matrix, per-class precision, recall, and F1.
- `src/services/ai.service.ts`: Updated frontend service with environment configuration and timeout handling.
- `src/routes/practice.tsx`: AI Mode / Demo Mode toggle and attempt recording.
- `src/routes/voicebridge.tsx`: Controlled vocabulary mapping with audio synthesis.
- `src/features/assessment/CameraTaskQuestion.tsx`: Real AI validation with passing threshold.

### Files to Remain Untouched:
- `src/components/layout/*` (Navbar, Footer, AppLayout)
- `src/components/brand/Logo.tsx`
- `src/styles.css` (Tailwind styles)
- `src/routes/learn.index.tsx` & `src/routes/learn.$lesson.tsx` (UI layout preserved)
- `src/routes/dashboard.tsx` & `src/routes/hospital.tsx`
- `src/routes/certification.tsx`
