# AI Setup & Execution Guide: ISL Setu

## 🧠 Architecture Overview
ISL Setu features a production-grade Indian Sign Language computer vision pipeline:
$$\text{Camera Viewfinder} \longrightarrow \text{OpenCV Frame Extraction} \longrightarrow \text{MediaPipe 3D Landmarks} \longrightarrow \text{Trained Landmark Model} \longrightarrow \text{Predicted Sign} \longrightarrow \text{Confidence Score} \longrightarrow \text{Speech Synthesis}$$

---

## 📦 Prerequisites
- **Python 3.10+** (with `pip`)
- **Node.js 18+** & `npm`

---

## ⚡ Quick Start: Running AI Backend & Frontend

### 1. Install & Start Python FastAPI AI Backend
```bash
# Navigate to backend directory
cd isl-healthcare-connect-main/backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server on port 8000
python main.py
```
*(Or on Windows, double-click `backend/start.bat`)*

**Verify API Health:**
- Open **`http://localhost:8000/health`** in your browser.
- Expected response:
  ```json
  {
    "status": "ok",
    "service": "ISL Setu AI Sign Recognition Service",
    "model_loaded": true,
    "model_version": "isl_v1",
    "supported_vocabulary": 10,
    "confidence_threshold": 0.7
  }
  ```

---

### 2. Start Frontend
In a new terminal window:
```bash
cd isl-healthcare-connect-main
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Model Training & Preprocessing (Optional / Custom Training)

If you wish to re-extract landmarks from the 61-class video dataset and re-train the neural network:

```bash
cd isl-healthcare-connect-main/backend/training

# 1. Run MediaPipe Landmark Preprocessing
python preprocess_videos.py

# 2. Train Multi-Layer Perceptron Model
python train_landmark_model.py

# 3. Evaluate on Held-Out Test Set (Precision, Recall, F1, Confusion Matrix)
python evaluate.py
```

---

## 🌐 Endpoints Reference

### `GET /health`
Returns server status, model version, and loaded vocabulary count.

### `POST /predict-sign`
- **Request Body:**
  ```json
  {
    "image": "data:image/jpeg;base64,...",
    "target_sign": "FEVER",
    "mode": "ai"
  }
  ```
- **Success Response ($\ge 70\%$ confidence):**
  ```json
  {
    "success": true,
    "sign": "FEVER",
    "confidence": 0.94,
    "phrase": "I have a high fever.",
    "mode": "ai",
    "model_version": "isl_v1"
  }
  ```
- **Low Confidence / No Hand Response:**
  ```json
  {
    "success": false,
    "sign": null,
    "confidence": 0.42,
    "mode": "ai",
    "message": "Sign not recognised. Try again with better lighting and keep hand inside the frame."
  }
  ```

### `POST /voicebridge`
- **Request Body:**
  ```json
  {
    "signs": ["FEVER", "WATER"]
  }
  ```
- **Response:**
  ```json
  {
    "sentence": "I have a high fever. Please give me drinking water.",
    "signs": ["FEVER", "WATER"]
  }
  ```

---

## 🛡️ Responsible AI & Privacy
- **Transient Memory Processing:** Camera frames are evaluated in memory and immediately discarded. No video footage is permanently stored.
- **Assistance Tool Disclaimer:** ISL Setu is a communication aid and does not substitute qualified medical diagnostics or certified human interpreters.
