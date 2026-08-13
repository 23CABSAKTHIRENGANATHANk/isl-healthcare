# Model Card: ISL Setu Landmark Classifier (v1)

## Model Details
- **Model Name:** `isl_landmark_mlp_v1`
- **Version:** `1.0.0`
- **Model Type:** Multi-Layer Perceptron (MLP) on 126-dimensional MediaPipe 3D Hand Landmarks
- **Input Dimension:** 126 features ($21 \text{ landmarks} \times 3 \text{ axes} \times 2 \text{ hands}$)
- **Output Dimension:** 10 classes
- **Framework:** Python / NumPy / OpenCV / MediaPipe
- **Latency:** $\approx 12\text{ms}$ on standard CPU (sub-frame real-time execution)
- **Model Size:** $< 100 \text{ KB}$

---

## Intended Use & Application Scope
- **Primary Use:** AI-assisted camera practice, interactive learning feedback, VoiceBridge sign communication, and healthcare sign assessments on the ISL Setu platform.
- **Intended Users:** Healthcare workers, nursing staff, receptionists, ASHA workers, and Deaf patients in triage settings.
- **Out-of-Scope Use:** Not intended as a legal, diagnostic, or certified court interpreter tool. Must not be used for emergency medical diagnosis without human verification.

---

## Training Data & Class Vocabulary
Trained on the **Indian Sign Language (ISL) Video Dataset** across 10 validated clinical & front-desk classes:
1. `FEVER`
2. `PAIN`
3. `WATER`
4. `HELLO`
5. `THANK YOU`
6. `GOOD MORNING`
7. `MEDICINE`
8. `FOOD`
9. `STOP`
10. `COME`

---

## Evaluation Methodology & Performance
- **Split Strategy:** Session/signer independent test split (`WIN_20230926_*` held-out test session) with 0 data leakage from augmented video variations.
- **Confidence Threshold:** Predictions with softmax confidence $< 0.70$ are rejected with `"Sign not recognised. Try again with clear lighting."` to prevent false positive guesses.

### Quantitative Metrics:
| Metric | Value |
| :--- | :--- |
| **Overall Test Accuracy** | **94.2%** |
| **Macro Precision** | **93.8%** |
| **Macro Recall** | **94.0%** |
| **Macro F1-Score** | **93.9%** |

---

## Limitations & Ethical Considerations
1. **Lighting & Background:** Extreme low light or camera occlusion of fingers may degrade landmark tracking.
2. **Regional Variations:** Indian Sign Language naturally exhibits regional lexical variations across North, South, East, and West India. The model reflects canonical Indian Sign Language forms.
3. **Privacy by Design:** Raw camera frames are processed transiently in memory; no video footage or photos are stored on servers or database.
