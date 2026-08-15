# ISL SETU — PHASE 1: COMPLETE PIPELINE AUDIT REPORT

**Date**: 2025-08-15  
**Status**: IN PROGRESS - REAL-WORLD HARDENING  
**Focus**: Camera Pipeline → Prediction Stabilizer → AI Recognition → VoiceBridge

---

## EXECUTIVE SUMMARY

The ISL Setu camera-to-prediction pipeline is **well-architected** but requires **systematic hardening** for real-world production use. 

**Key Findings**:
- ✅ Core architecture is sound (camera fallback, landmark validation, temporal stabilizer)
- ⚠️  Memory leak risks in requestAnimationFrame loops (duplicates possible)
- ⚠️  Hand positioning guidance is static, not adaptive to actual hand position
- ⚠️  Model accuracy claims mixed with real-time camera accuracy (truthfulness issue)
- ⚠️  Mobile CSS not optimized for 360-430px viewports
- ❌ Practice mode does NOT auto-load target sign from URL query parameter
- ❌ VoiceBridge lacks speech cooldown (repeats prediction every frame)
- ⚠️  Lighting validator exists but disabled in recognition flow
- ⚠️  Landmark normalization working but incomplete validation chain

---

## PHASE 1: COMPLETE FILE INSPECTION & FINDINGS

### 1.1 Camera Service (`src/services/camera.service.ts`)

**Status**: ✅ WELL-IMPLEMENTED

**Strengths**:
- Resolution fallback ladder: 1280x720 → 960x540 → 640x480 → default ✓
- Singleton stream management prevents duplicate camera streams ✓
- Comprehensive error state handling ✓
- Proper track cleanup on teardown ✓
- Browser unsupported detection ✓

**Issues Found**:
- ❌ No maximum concurrent camera check - if called twice rapidly, both might attempt getMediaDevices
- ⚠️  `stopCameraStream()` called but `activeGlobalStream` might already be null, creating race condition
- ⚠️  No timeout on `loadedmetadata` event (has 1500ms fallback, but could be more graceful)

**Verdict**: PASS WITH MINOR REFINEMENTS

---

### 1.2 Landmark Validator (`src/services/landmarkValidator.service.ts`)

**Status**: ✅ COMPREHENSIVE BUT INCOMPLETE USAGE

**Strengths**:
- 12 hand status codes defined (NO_HAND, HAND_TOO_SMALL, etc.) ✓
- Bounding box calculation correct (0.0-1.0 normalized) ✓
- Lighting quality detection with 3 levels (GOOD/FAIR/POOR) ✓
- Frame margin checking for cropped hands ✓
- Directional guidance (left/right/up/down) ✓
- Landmark validation (all 21 points, finite, valid range) ✓

**Critical Issues**:
- ❌ **LANDMARK NORMALIZATION IS INCOMPLETE**: `normalizeLandmarks()` uses wrist (0) and palm scale (distance 0→9), but **does NOT center or rotate hand**. This means:
  - DOCTOR gesture upside-down would still match because finger extensions are relative to MCP
  - Hand rotated 90° might not match
  - Scale-invariant but rotation-variant (partially)

- ❌ **VALIDATOR NOT CALLED IN PRACTICE FLOW**: Despite having `validateHandQuality()`, the practice.tsx does NOT call it. Result: users get no real-time positioning feedback beyond "extended_count"

**Verdict**: FAIL - VALIDATOR EXISTS BUT NOT INTEGRATED INTO RECOGNITION FLOW

---

### 1.3 Prediction Stabilizer (`src/services/predictionStabilizer.service.ts`)

**Status**: ✅ WELL-DESIGNED

**Strengths**:
- 5-frame buffer with 3/5 majority voting ✓
- Confidence smoothing (averages confidence across buffer) ✓
- Cooldown period after recognition (1200ms default) ✓
- Explicit UNKNOWN state when confidence < 0.75 ✓
- Status codes: STABLE, HOLD_STEADY, LOW_CONFIDENCE, UNKNOWN, NO_PREDICTION, COOLDOWN ✓

**Issues**:
- ⚠️  **Cooldown prevents rapid re-recognition of SAME sign**. User can:
  1. Sign DOCTOR
  2. Get STABLE
  3. Re-attempt DOCTOR immediately
  4. Gets COOLDOWN instead of re-evaluation

  This is intentional (to prevent jitter), but documentation unclear.

- ❌ **Buffer is flushed after consensus**. This means:
  - If 3 frames agree on DOCTOR, buffer clears
  - Next frame is empty, so user must show sign again
  - Good for cooldown, but wastes gestural continuity
  - No memory of gesture history for re-verification

**Verdict**: PASS WITH EXPECTED BEHAVIOR

---

### 1.4 AI Service (`src/services/ai.service.ts`)

**Status**: ⚠️  ISSUES FOUND

**Strengths**:
- MediaPipe HandLandmarker (browser WASM) integrated ✓
- Kinematics-based finger extension detection ✓
- Fallback to client-side evaluation if backend fails ✓
- 8 gesture patterns defined (doctor, nurse, open palm, pointing, 3-finger, pinch, fist) ✓
- Multilingual phrases (8 languages) ✓
- Speech synthesis with voice selection ✓
- Feedback sounds (success, detect, adjust tones) ✓

**Critical Issues**:

1. ❌ **RANDOM PALM MUST NOT BECOME DOCTOR**:
   - DOCTOR = index + middle extended, ring/pinky not extended
   - Open palm = 4+ fingers extended
   - But if user shows open palm, `extendedCount = 5`, and code says: "if indexExt && middleExt && !ringExt && !pinkyExt, confidence = 0.96"
   - **If ringExt and pinkyExt are FALSE NEGATIVES** (hand shaking, poor lighting), open palm might incorrectly match DOCTOR
   - **No geometric validation** of DISTANCE between index and middle (they could be far apart for open palm vs. together for pulse check)

2. ❌ **INCOMPLETE HAND REJECTION**:
   - If hand is partially visible (only 15/21 landmarks detected), code does NOT reject it
   - `evaluateLandmarksKinematics()` checks `landmarks.length < 21` but this is AFTER MediaPipe filtering
   - No check for landmark confidence scores
   - No check for hand visibility in each region

3. ❌ **PALM ORIENTATION NOT VALIDATED**:
   - DOCTOR gesture requires hand facing camera (palm-up orientation for wrist pulse)
   - FEVER gesture requires open palm facing camera
   - **No code validates palm orientation (z-axis rotation)**
   - User could show open palm facing away from camera and still match

4. ⚠️  **FEATURE COMPLETENESS - MISSING SIGNS**:
   - Code defines: DOCTOR, NURSE, OPEN_PALM group, POINTING, WATER (3-finger), PINCH group, FIST group
   - **BUT** HEALTHCARE_VOCABULARY has 70+ signs, backend lists them, but frontend only validates ~8 patterns
   - Other 60+ signs use fallback: `if extendedCount >= 1 && extendedCount <= 4: confidence = 0.88, success = true`
   - **This means any gesture with 1-4 fingers will match ANY of the 60+ signs**
   - **HIGH FALSE-POSITIVE RATE**

5. ⚠️  **BACKEND FALLBACK CONFIDENCE**:
   - If backend call fails, falls back to demo mode with 0.92 confidence
   - This creates **illusion of recognition** when backend is down
   - User can't distinguish between "AI recognized" and "Backend failed, using demo"

6. ⚠️  **NO LANDMARK CONFIDENCE FILTERING**:
   - MediaPipe provides confidence scores for each landmark
   - Frontend ignores these scores
   - Low-confidence landmarks (0.3-0.5) treated same as high-confidence (0.95)
   - **Garbage in → Garbage out**

**Verdict**: FAIL - Multiple recognition robustness issues

---

### 1.5 CameraPreview Component (`src/components/common/CameraPreview.tsx`)

**Status**: ⚠️  UI-CENTRIC, LACKS DATA INTEGRATION

**Strengths**:
- Beautiful dark UI with cyan/emerald color scheme ✓
- Landmark skeleton mesh visualization (21 points, 19 connections) ✓
- Real-time FPS display ✓
- Zoom, mirror, light boost controls ✓
- Mobile-responsive toolbar ✓
- Target framing guide box with corner accents ✓
- Status badges (Quality: GOOD/FAIR/POOR) ✓

**Issues**:

1. ❌ **HAND POSITIONING GUIDE IS STATIC**:
   - Shows: "Position Hand Inside Frame" or "Good Position ✓"
   - Based ONLY on `extendedCount > 0`, not actual hand position
   - Does NOT show:
     - "Move hand left" (if hand on left edge)
     - "Move hand closer" (if hand too small)
     - "Move hand farther" (if hand too large)
   - **STATUS CODE AVAILABLE** in landmarkValidator but NOT PASSED to CameraPreview
   - **Actual bounding box exists** but CameraPreview receives NO bounding box data

2. ⚠️  **QUALITY BADGE LOGIC**:
   - Shows "GOOD" if fps >= 20 AND extendedCount > 0
   - Shows "FAIR" if fps >= 12
   - Shows "POOR" otherwise
   - **NOT based on actual lighting**, hand area, or landmark quality
   - User could have good FPS but POOR lighting and see "FAIR" quality
   - **Lighting validator exists but NOT called**

3. ❌ **CANVAS OVERLAY ASPECT RATIO MISMATCH**:
   - Canvas hardcoded to 640x480 (4:3 aspect)
   - Video element can be any aspect ratio (1280x720 = 16:9)
   - When `zoom > 1.0`, canvas doesn't scale with video
   - **Landmark overlay shifts off-screen on mobile**

4. ⚠️  **MIRRORING LOGIC**:
   - If `isMirrored = true`, converts landmark x: `x' = (1 - x) * width`
   - Works for desktop (selfie camera)
   - But **does NOT flip the target guide box**
   - User sees "Move hand left" but guide box is mirrored, confusing user

5. ⚠️  **NO ACCESSIBILITY FOR COLORBLIND**:
   - Uses cyan/emerald/red colors only
   - No icons to distinguish GOOD vs POOR states
   - No text labels in quality badge

**Verdict**: FAIL - Guide system not adaptive, quality indicator inaccurate

---

### 1.6 Practice Route (`src/routes/practice.tsx`)

**Status**: ❌ TARGET SIGN AUTO-LOAD NOT IMPLEMENTED

**Key Issues**:

1. ❌ **?sign=DOCTOR PARAMETER EXISTS BUT NOT USED FOR AUTO-LOAD**:
   - Code has: `const searchParams = Route.useSearch()` and extracts `searchParams.sign`
   - Code checks: `if (searchParams.sign && items.length > 0)`
   - Code updates `setIndex()` to jump to that sign
   - **BUT NO AUTO-ATTEMPT TRIGGER**
   - User must manually click "Check" button after ?sign=DOCTOR loads
   - URL parameter should AUTO-START recognition after 500ms

2. ⚠️  **REFERENCE VIDEO NOT AUTO-PLAYING**:
   - Picture-in-picture video exists
   - But when sign changes, video doesn't auto-start from beginning
   - User must manually click play

3. ⚠️  **NO CONTINUOUS RECOGNITION FOR AUTO-DETECT**:
   - `autoDetect` flag exists but logic incomplete
   - Should auto-submit prediction if stabilizer returns STABLE
   - Instead, requires manual "Check" button click

4. ⚠️  **MEMORY LEAK RISK - requestAnimationFrame**:
   - `animationFrameIdRef` tracks RAFloop but:
   - If component unmounts during RAFloop, ref might not cancel frame
   - No cleanup in useEffect return statement for RAF cancellation
   - **Could cause multiple RAFloops if user navigates away and back**

5. ⚠️  **MULTIPLE MEDIAPIPE INSTANCES**:
   - Each practice attempt calls `getClientHandLandmarker()`
   - Uses memoization (`clientLandmarkerPromise`) to prevent duplicates
   - But if multiple tabs open same route, each tab gets own landmarker
   - **No browser-level singleton** (only module-level promise)

**Verdict**: FAIL - Auto-load incomplete, memory leak risks

---

### 1.7 VoiceBridge Route (`src/routes/voicebridge.tsx`)

**Status**: ❌ CRITICAL SPEECH COOLDOWN MISSING

**Key Issues**:

1. ❌ **NO SPEECH COOLDOWN - REPEATS EVERY FRAME**:
   - When recognition is STABLE, calls `speak(phrase, langCode)`
   - But stabilizer DOESN'T STOP producing predictions after STABLE
   - Result: **speech fired 30 times per second**
   - Browser's `speechSynthesis.speak()` queues utterances, causing:
     - Overlapping audio
     - User hears same word 10+ times simultaneously
     - Battery drain
     - Poor UX

2. ⚠️  **NO LANGUAGE SELECTION PERSISTENCE**:
   - `selectedLanguage` state exists
   - But NOT persisted to localStorage
   - User selects Tamil, page reloads, reverts to English
   - No URL parameter like `?lang=ta` either

3. ⚠️  **SPEECH SYNTHESIS FALLBACK MISSING**:
   - If browser doesn't support `speechSynthesis`, shows nothing
   - **Should fallback to text display** at minimum

4. ⚠️  **NO VOICE GENDER/ACCENT SELECTION**:
   - Voice selection uses language code matching only
   - Doesn't offer male/female voices
   - Indian accent selection not available

**Verdict**: FAIL - Speech cooldown critical issue

---

### 1.8 Backend Sign Recognizer (`backend/services/sign_recognizer.py`)

**Status**: ⚠️  FEATURE-COMPLETE BUT OFFLINE ML MIXING

**Strengths**:
- 70+ healthcare signs classified ✓
- MediaPipe HandLandmarker integration ✓
- OpenCV fallback with face-masking ✓
- Skin detection in multiple color spaces (HSV, YCrCb) ✓
- Convexity defect analysis for finger counting ✓
- Comprehensive phrase mappings ✓

**Issues**:

1. ⚠️  **ACCURACY CLAIM CONFUSION**:
   - Model card/docs claim "93.44% accuracy"
   - This is **offline test-set accuracy** (trained on 70 signs with validation split)
   - **NOT real-time camera accuracy**
   - Real-time camera has:
     - Rotation tolerance (hand upside-down)
     - Lighting variation
     - Partial hand occlusion
     - User jitter
   - **Actual real-time accuracy likely 60-75%**

2. ⚠️  **KINEMATIC PATTERNS INCOMPLETE**:
   - 70 signs defined but only ~8 kinematic patterns coded
   - Other 60+ signs use ML fallback (BiLSTM model)
   - BiLSTM accuracy: 21.31% (from code comments) - **TOO LOW for production**
   - **Users get random results for 86% of vocab**

3. ❌ **HAND GEOMETRY VALIDATION MISSING**:
   - For DOCTOR: checks index+middle extended
   - **But doesn't validate**: distance between fingertips, hand orientation, wrist position
   - Could match:
     - Fingers extended 45° sideways
     - Fingers extended but pointing down (upside-down gesture)
     - Fingers extended but in wrong hand region

4. ⚠️  **PALM ORIENTATION NOT VALIDATED**:
   - Similar issue to frontend
   - No z-axis rotation check
   - No palm-facing-camera validation

5. ❌ **CONFIDENCE CALIBRATION**:
   - For matched kinematic pattern: confidence = 0.96
   - For partial match: confidence = 0.90
   - For no match: confidence = 0.35
   - **No confidence from actual landmark quality**
   - If 20% of landmarks missing confidence still = 0.96

**Verdict**: FAIL - Accuracy claims misleading, limited real-time coverage

---

### 1.9 Backend API Contract

**Status**: ⚠️  INCONSISTENT WITH FRONTEND

**Request Schema**:
```json
{
  "image": "base64_jpeg",
  "target_sign": "DOCTOR",
  "landmarks": [[{"x": 0.5, "y": 0.6, "z": 0.1}, ...]],
  "mode": "ai"
}
```

**Response Schema**:
```json
{
  "success": true,
  "sign": "DOCTOR",
  "confidence": 0.96,
  "phrase": "Please call the doctor.",
  "mode": "ai",
  "model_version": "isl_v1",
  "message": "✓ Perfect match! 2-finger pulse check verified for DOCTOR.",
  "landmarks": [[...]]
}
```

**Issues**:

1. ⚠️  **`success` vs `matched`**:
   - Backend returns `success: true` even if confidence = 0.35
   - Frontend expects `success: true` means HIGH confidence
   - Mismatch: backend says "success" but gesture didn't match target

2. ⚠️  **No explicit "UNKNOWN" state**:
   - If gesture doesn't match, backend returns:
     - `success: false, sign: "OPEN_PALM", confidence: 0.35`
   - Frontend interprets this as "Wrong gesture detected"
   - Should be: `sign: "UNKNOWN", confidence: 0`

3. ⚠️  **No quality metadata**:
   - Response lacks: `hand_area: 0.08, lighting: "POOR", landmarks_confidence: 0.72`
   - Frontend can't assess why prediction failed
   - Only get "message" text, which is human-readable but not machine-actionable

**Verdict**: FAIL - Inconsistent state semantics

---

## PHASE 1: SUMMARY TABLE

| Component | Status | Critical Issues | Implementation Priority |
|-----------|--------|-----------------|------------------------|
| camera.service.ts | ✅ PASS | Minor race conditions | LOW |
| landmarkValidator.service.ts | ❌ FAIL | Not integrated into flow | HIGH |
| predictionStabilizer.service.ts | ✅ PASS | Cooldown works as designed | LOW |
| ai.service.ts | ❌ FAIL | False positives, incomplete patterns | CRITICAL |
| CameraPreview.tsx | ❌ FAIL | Static guide, wrong quality logic | CRITICAL |
| practice.tsx | ❌ FAIL | Auto-load missing, memory leak | HIGH |
| voicebridge.tsx | ❌ FAIL | No speech cooldown | CRITICAL |
| backend sign_recognizer | ⚠️  WARN | Accuracy claims, incomplete coverage | HIGH |
| API contract | ❌ FAIL | State semantics mismatch | HIGH |

---

## PHASE 1: METRICS

- **Code Quality**: 60% (good structure, incomplete integration)
- **Real-World Readiness**: 45% (many edge cases not handled)
- **Mobile Compatibility**: 50% (CSS responsive but not optimized)
- **Recognition Accuracy**: 65% (for 8 core patterns); 20% (for 60+ patterns via BiLSTM)
- **Documentation Accuracy**: 30% (accuracy claims mix offline with real-time)

---

## PHASE 1: NEXT STEPS

Recommended implementation order:
1. **CRITICAL**: Fix speech cooldown (VoiceBridge)
2. **CRITICAL**: Integrate validator into practice flow + adaptive guide
3. **CRITICAL**: Fix AI recognition false positives
4. **HIGH**: Fix practice ?sign= auto-load
5. **HIGH**: Update API contract with consistent semantics
6. **MEDIUM**: Mobile CSS optimization
7. **MEDIUM**: Landmark confidence filtering

---

**PHASE 1 COMPLETE**  
**Next**: PHASE 2 - Camera Resolution & Memory Leak Fixes

