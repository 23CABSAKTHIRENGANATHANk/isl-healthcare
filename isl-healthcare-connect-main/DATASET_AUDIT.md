# Dataset Audit Report: ISL Setu

**Date:** August 2026  
**Auditor:** Senior AI/ML Engineer  
**Scope:** `dataset viedo/` and `sign dataset/`

---

## 1. Summary of Evaluated Datasets

| Dataset | Location | Format | Classes | Size | Suitability for ISL Setu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sign Language MNIST** | `sign dataset/` | CSV (28x28 pixel tables) | 24 (A-Y except J/Z) | ~105 MB | ❌ **NOT ISL (American Sign Language / ASL Fingerspelling)**. Disqualified from ISL production model. |
| **ISL Video Dataset** | `dataset viedo/Video_Dataset/Video_Dataset/` | MP4 Video clips | 61 Gesture Categories | ~1.4 GB | ✅ **Indian Sign Language (ISL)** dynamic & static gesture recordings across multiple sessions. |

---

## 2. Deep Dive: `sign dataset/` (Sign MNIST)

- **Dataset Type:** Static 28x28 grayscale image tables in CSV format (`sign_mnist_train.csv`: 27,455 samples, `sign_mnist_test.csv`: 7,172 samples).
- **Labels:** 0–24 representing standard single-handed fingerspelling alphabets A through Y (excluding motion letters J and Z).
- **Crucial Finding:** Sign MNIST is derived from the **American Sign Language (ASL)** fingerspelling alphabet. Indian Sign Language (ISL) uses distinct two-handed and localized fingerspelling and entirely different lexical gestures.
- **Decision:** **Disqualified from ISL production training.** It will not be claimed or presented as ISL data to judges or healthcare workers.

---

## 3. Deep Dive: `dataset viedo/` (ISL Video Dataset)

- **Root Directory:** `dataset viedo/Video_Dataset/Video_Dataset/`
- **Total Categories:** 61 distinct gesture folders.
- **Total Video Files:** ~3,660 MP4 clips (~60 clips per category).
- **Video Specifications:**
  - **Container / Codec:** MP4 (H.264 / AVC)
  - **Resolution:** 1920x1080 (1080p Full HD) and 1280x720 (720p HD)
  - **Framerate:** ~30.0 FPS
  - **Duration:** 1.5s to 4.5s per gesture clip
  - **Lighting & Background:** Indoor room background with multiple lighting conditions and spatial variations (`_left_tilt`, `_right_tilt`, `_Trim_cropped`).

### Recording Sessions & Signer Metadata:
- **Session 1 Prefix (`WIN_20230901_*`):** Recorded on September 01, 2023 (~50 files per class including augmentations).
- **Session 2 Prefix (`WIN_20230926_*`):** Recorded on September 26, 2023 (~10 files per class with cropped variations).

---

## 4. Class Selection for Healthcare MVP (10 Validated Classes)

To ensure high technical credibility, low latency, and zero false claims, we select **10 healthcare and front-desk relevant classes** from the verified video dataset:

| # | Dataset Folder Name | ISL Setu Standard Gloss | Clinical / Hospital Context | VoiceBridge Spoken Sentence |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `Fever` | **FEVER** | High body temperature assessment | "I have a high fever." |
| 2 | `Injury` | **PAIN** | Trauma, wound, or physical discomfort | "I am experiencing pain or injury." |
| 3 | `Drink` | **WATER** | Patient hydration need | "Please give me drinking water." |
| 4 | `Hello` | **HELLO** | Reception welcoming & triage | "Hello, welcome to the hospital." |
| 5 | `Thank you` | **THANK YOU** | Polite communication | "Thank you for your assistance." |
| 6 | `Good Morning` | **GOOD MORNING** | Ward morning round | "Good morning, doctor/nurse." |
| 7 | `Give` | **MEDICINE** | Prescription / medication hand-off | "Please give me the prescribed medicine." |
| 8 | `Tea` | **FOOD** | Nutrition / meal requirement | "I need food or tea." |
| 9 | `Close` | **STOP** | Instruction to pause or stop motion | "Please stop or pause." |
| 10 | `Come` | **COME** | Patient navigation to consultation room | "Please come inside the room." |

---

## 5. Data Leakage Prevention Strategy

To ensure genuine generalization:
1. **Never split frames across train and test:** Each video is processed as a unified temporal sample.
2. **Session / Signer Separation:**
   - **Training Set (70%):** Original un-tilted and tilted clips from `WIN_20230901_*`.
   - **Validation Set (15%):** Remaining base clips from `WIN_20230901_*`.
   - **Test Set (15%):** Strictly held-out session `WIN_20230926_*` to measure true out-of-session generalization.
