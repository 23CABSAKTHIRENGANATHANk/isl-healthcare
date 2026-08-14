# 🚀 ISL Setu — Vercel & Render Production Deployment Guide

This guide gives you the exact, step-by-step instructions to deploy **ISL Setu**:
- **Frontend** on **Vercel** (Free Tier / Global Edge CDN)
- **Backend AI Engine** on **Render** (Free Web Service / Dockerized Python 3.11 with MediaPipe)
- **Database & Auth** on **Supabase Cloud** (Managed PostgreSQL)

---

## 📋 Pre-Requisites

Make sure your code is pushed to your GitHub repository.

---

## Part 1: Deploy Backend to Render (Do this first to get your API URL)

### Step 1: Create a Web Service on Render
1. Open [render.com](https://render.com) and log in.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `isl-healthcare-connect-main`.

### Step 2: Configure Render Settings
| Setting | Value |
|---|---|
| **Name** | `isl-setu-backend` |
| **Region** | `Oregon (US West)` or nearest |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | **Docker** *(Render will automatically detect `backend/Dockerfile`)* |
| **Instance Type** | **Free** |

### Step 3: Add Environment Variables in Render
In the **Environment Variables** section on Render, add:

| Key | Value | Notes |
|---|---|---|
| `PORT` | `10000` | Render default port |
| `ALLOWED_ORIGINS` | `*` *(or update to your Vercel URL later)* | Allows frontend requests |
| `SUPABASE_URL` | `https://nndjafynozneorhvpxvg.supabase.co` | Your Supabase project URL |

### Step 4: Click "Deploy Web Service"
- Render will build the Docker container with OpenCV, MediaPipe, and FastAPI.
- Once finished, copy your Render URL:  
  👉 **`https://isl-setu-backend.onrender.com`**

### Step 5: Test Render Health Check
Open in your browser:
`https://isl-setu-backend.onrender.com/health`
You should see:
```json
{
  "status": "healthy",
  "service": "isl-setu-ai-backend",
  "version": "1.0.0",
  "mediapipe_available": true
}
```

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Import Project into Vercel
1. Open [vercel.com](https://vercel.com) and log in.
2. Click **Add New…** → **Project**.
3. Import your GitHub repository: `isl-healthcare-connect-main`.

### Step 2: Configure Build & Output Settings
Vercel will detect the `vercel.json` file in the root:
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist/client`

### Step 3: Add Environment Variables in Vercel
In the **Environment Variables** section, add:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://nndjafynozneorhvpxvg.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZGphZnlub3puZW9yaHZweHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MzgzMjMsImV4cCI6MjEwMjIxNDMyM30.MFA0pG6wXkAckMYHQb_ALOAjyuKkNfegTtsLwtnzaW8` |
| `VITE_BACKEND_URL` | `https://isl-setu-backend.onrender.com` *(Use your Render URL from Part 1)* |

### Step 4: Click "Deploy"
- Vercel will build the React 19 app and deploy it across the global edge network in ~45 seconds.
- Copy your live Vercel URL (e.g. `https://isl-setu.vercel.app`).

---

## Part 3: Final Security & CORS Lockdown (Optional Polish)

Once you have your live Vercel domain:
1. Go back to [Render Dashboard](https://dashboard.render.com) → `isl-setu-backend` → **Environment**.
2. Update `ALLOWED_ORIGINS`:
   ```
   https://isl-setu.vercel.app,https://*.vercel.app
   ```
3. Render will auto-redeploy with tight CORS restrictions.

---

## 🎯 Verification Checklist

After deployment, verify the full flow:
1. **Landing Page**: Navigate to your Vercel URL.
2. **Auth & Profile**: Sign in or use demo mode.
3. **Practice & Camera**: Open `/practice` → Test webcam sign recognition with Render AI engine.
4. **VoiceBridge**: Open `/voicebridge` → Test sign to audio speech output.
5. **Certificate PDF**: Open `/certification` → Click "Download PDF" to test the Render serverless PDF generator.
