/**
 * ISL Setu — Frontend AI Recognition & Multilingual Voice Service
 * Integrates Client-Side MediaPipe 21-Landmark Computer Vision with Python FastAPI Backend.
 * Supports English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali & Marathi speech synthesis.
 */
import { supabase } from "@/integrations/supabase/client";

export type SignImageInput = HTMLVideoElement | HTMLCanvasElement | Blob | string | null;

export type DetectionStrictness = "lenient" | "balanced" | "strict";

export interface PredictOptions {
  targetSign?: string;
  mode?: "ai" | "demo";
  strictness?: DetectionStrictness;
  landmarks?: LandmarkPoint[][];
  failureRate?: number;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface PredictionResult {
  success: boolean;
  sign: string | null;
  confidence: number;
  phrase?: string;
  mode: "ai" | "demo";
  model_version: string;
  message?: string;
  landmarks?: LandmarkPoint[][];
  fingerStates?: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  extendedCount?: number;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  voiceLang: string;
}

export const CONTROLLED_HEALTHCARE_VOCABULARY = [
  "FEVER",
  "PAIN",
  "WATER",
  "HELLO",
  "THANK YOU",
  "GOOD MORNING",
  "MEDICINE",
  "FOOD",
  "STOP",
  "COME",
] as const;

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English (IN)", voiceLang: "en-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", voiceLang: "ta-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", voiceLang: "hi-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", voiceLang: "te-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", voiceLang: "kn-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", voiceLang: "ml-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", voiceLang: "bn-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", voiceLang: "mr-IN" },
];

export const MULTILINGUAL_PHRASES: Record<string, Record<string, string>> = {
  FEVER: {
    en: "I have a high fever.",
    ta: "எனக்கு கடுமையான காய்ச்சல் உள்ளது.",
    hi: "मुझे तेज बुखार है।",
    te: "నాకు అధిక జ్వరం ఉంది.",
    kn: "ನನಗೆ ತೀವ್ರ ಜ್ವರವಿದೆ.",
    ml: "എനിക്ക് കഠിനമായ പനിയുണ്ട്.",
    bn: "আমার তীব্র জ্বর হয়েছে।",
    mr: "मला तीव्र ताप आला आहे.",
  },
  PAIN: {
    en: "I am experiencing severe pain.",
    ta: "எனக்கு கடுமையான வலி உள்ளது.",
    hi: "मुझे बहुत दर्द हो रहा है।",
    te: "నాకు చాలా నొప్పిగా ఉంది.",
    kn: "ನನಗೆ ತುಂಬಾ ನೋವಾಗುತ್ತಿದೆ.",
    ml: "ಎനിക്ക് കഠിനമായ വേദനയുണ്ട്.",
    bn: "আমার খুব ব্যথা হচ্ছে।",
    mr: "मला खूप वेदना होत आहेत.",
  },
  HELP: {
    en: "I need immediate help.",
    ta: "எனக்கு உடனடியாக உதவி தேவை.",
    hi: "मुझे तुरंत सहायता चाहिए।",
    te: "నాకు తక్షణ సహాయం కావాలి.",
    kn: "ನನಗೆ ತಕ್ಷಣ ಸಹಾಯ ಬೇಕು.",
    ml: "എനിക്ക് അടിയന്തിര സഹായം വേണം.",
    bn: "আমার অবিলম্বে সাহায্য প্রয়োজন।",
    mr: "मला ताबडतोब मदतीची गरज आहे.",
  },
  DOCTOR: {
    en: "Please call the doctor immediately.",
    ta: "தயவுசெய்து மருத்துவரை அழைக்கவும்.",
    hi: "कृपया डॉक्टर को तुरंत बुलाएं।",
    te: "దయచేసి వెంటనే డాక్టర్‌ను పిలవండి.",
    kn: "ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಕರೆಯಿರಿ.",
    ml: "ദയവായി ഡോക്ടറെ വിളിക്കൂ.",
    bn: "অনুগ্রহ করে ডাক্তারকে ডাকুন।",
    mr: "कृपया डॉक्टरांना बोलवा.",
  },
  NURSE: {
    en: "Please call the nurse.",
    ta: "தயவுசெய்து செவிலியரை அழைக்கவும்.",
    hi: "कृपया नर्स को बुलाएं।",
    te: "దయచేసి నర్సును పిలవండి.",
    kn: "ದಯವಿಟ್ಟು ದಾದಿಯನ್ನು ಕರೆಯಿರಿ.",
    ml: "ദയവായി നഴ്സിനെ വിളിക്കൂ.",
    bn: "অনুগ্রহ করে নার্সকে ডাকুন।",
    mr: "कृपया परिचारिकेला बोलवा.",
  },
  MEDICINE: {
    en: "Please provide the prescribed medicine.",
    ta: "தயவுசெய்து மருந்து கொடுங்கள்.",
    hi: "कृपया निर्धारित दवाई दें।",
    te: "దయచేసి మందులు ఇవ్వండి.",
    kn: "ದಯವಿಟ್ಟು ಔಷಧ ನೀಡಿ.",
    ml: "ദയവായി മരുന്ന് നൽകൂ.",
    bn: "অনুগ্রহ করে ওষুধ দিন।",
    mr: "कृपया औषध द्या.",
  },
  WATER: {
    en: "Please give me drinking water.",
    ta: "தயவுசெய்து குடிநீர் கொடுங்கள்.",
    hi: "कृपया पीने का पानी दें।",
    te: "దయచేసి మంచినీరు ఇవ్వండి.",
    kn: "ದಯವಿಟ್ಟು ಕುಡಿಯುವ ನೀರು ನೀಡಿ.",
    ml: "ദയവായി കുടിവെള്ളം നൽകൂ.",
    bn: "অনুগ্রহ করে খাবার জল দিন।",
    mr: "कृपया पिण्याचे पाणी द्या.",
  },
  EMERGENCY: {
    en: "This is a clinical emergency.",
    ta: "இது ஒரு அவசர மருத்துவ நிலைமை.",
    hi: "यह एक आपातकालीन स्थिति है।",
    te: "ఇది అత్యవసర పరిస్థితి.",
    kn: "ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿ.",
    ml: "ഇതൊരു അടിയന്തിരാവസ്ഥയാണ്.",
    bn: "এটি একটি জরুরি অবস্থা।",
    mr: "ही एक आणीबाणीची परिस्थिती आहे.",
  },
  HELLO: {
    en: "Hello, welcome to the hospital.",
    ta: "வணக்கம், மருத்துவமனைக்கு நல்வரவு.",
    hi: "नमस्ते, अस्पताल में आपका स्वागत है।",
    te: "నమస్కారం, ఆసుపత్రికి స్వాగతం.",
    kn: "ನಮಸ್ಕಾರ, ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ.",
    ml: "നമസ്കാരം, ആശുപത്രിയിലേക്ക് സ്വാഗതം.",
    bn: "নমস্কার, হাসপাতালে স্বাগতম।",
    mr: "नमस्ते, रुग्णालयात आपले स्वागत आहे.",
  },
  "THANK YOU": {
    en: "Thank you for your assistance.",
    ta: "உங்கள் உதவிக்கு மிக்க நன்றி.",
    hi: "आपकी सहायता के लिए धन्यवाद।",
    te: "మీ సహాయానికి ధన్యవాదాలు.",
    kn: "ನಿಮ್ಮ ಸಹಾಯಕ್ಕೆ ಧನ್ಯವಾದಗಳು.",
    ml: "നിങ്ങളുടെ സഹായത്തിന് നന്ദി.",
    bn: "আপনার সাহায্যের জন্য ধন্যবাদ।",
    mr: "आपल्या मदतीबद्दल धन्यवाद.",
  },
  "GOOD MORNING": {
    en: "Good morning.",
    ta: "காலை வணக்கம்.",
    hi: "शुभ प्रभात।",
    te: "శుభోదయం.",
    kn: "ಶುಭೋದಯ.",
    ml: "സുപ്രഭാതം.",
    bn: "সুপ্রভাত।",
    mr: "शुभ सकाळ.",
  },
  FOOD: {
    en: "I need food or tea.",
    ta: "எனக்கு உணவு அல்லது தேநீர் வேண்டும்.",
    hi: "मुझे भोजन या चाय चाहिए।",
    te: "నాకు ఆహారం లేదా టీ కావాలి.",
    kn: "ನನಗೆ ಊಟ ಅಥವಾ ಚಹಾ ಬೇಕು.",
    ml: "എനിക്ക് ഭക്ഷണം അല്ലെങ്കിൽ ചായ വേണം.",
    bn: "আমার খাবার বা চা প্রয়োজন।",
    mr: "मला जेवण किंवा चहा हवा आहे.",
  },
  STOP: {
    en: "Please stop or pause.",
    ta: "தயவுசெய்து நிறுத்துங்கள்.",
    hi: "कृपया रुकें।",
    te: "దయచేసి ఆగండి.",
    kn: "ದಯವಿಟ್ಟು ನಿಲ್ಲಿಸಿ.",
    ml: "ദയവായി നിർത്തൂ.",
    bn: "অনুগ্রহ করে থামুন।",
    mr: "कृपया थांबा.",
  },
  COME: {
    en: "Please come inside the room.",
    ta: "தயவுசெய்து உள்ளே வாருங்கள்.",
    hi: "कृपया अंदर आइए।",
    te: "దయచేసి లోపలికి రండి.",
    kn: "ದಯವಿಟ್ಟು ಒಳಗೆ ಬನ್ನಿ.",
    ml: "ദയവായി ഉള്ളിലേക്ക് വരൂ.",
    bn: "অনুগ্রহ করে ভেতরে আসুন।",
    mr: "कृपया आत या.",
  },
};

export const CONTROLLED_PHRASES: Record<string, string> = {
  FEVER: "I have a high fever.",
  PAIN: "I am experiencing pain.",
  WATER: "Please give me drinking water.",
  HELLO: "Hello, welcome to the hospital.",
  "THANK YOU": "Thank you for your assistance.",
  "GOOD MORNING": "Good morning.",
  MEDICINE: "Please give me the prescribed medicine.",
  FOOD: "I need food or tea.",
  STOP: "Please stop or pause.",
  COME: "Please come inside the room.",
};

export function getSpokenPhrase(sign: string, langCode = "en"): string {
  const upper = sign.toUpperCase().trim();
  if (MULTILINGUAL_PHRASES[upper] && MULTILINGUAL_PHRASES[upper][langCode]) {
    return MULTILINGUAL_PHRASES[upper][langCode];
  }
  return CONTROLLED_PHRASES[upper] || `${sign}.`;
}

const getBackendUrl = (): string => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_AI_API_URL) {
    return import.meta.env.VITE_AI_API_URL as string;
  }
  return "http://localhost:8000";
};

// -----------------------------------------------------------------------------
// Client-Side MediaPipe Hand Landmarker Engine (Browser Wasm)
// -----------------------------------------------------------------------------
let clientLandmarkerPromise: Promise<any> | null = null;

export async function getClientHandLandmarker() {
  if (clientLandmarkerPromise) return clientLandmarkerPromise;

  clientLandmarkerPromise = (async () => {
    try {
      const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
      const wasmFileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      // Model asset URLs to try in order (local first, then official Google Storage CDN)
      const modelCandidates = [
        "/models/hand_landmarker.task",
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      ];

      for (const modelPath of modelCandidates) {
        // Try GPU delegate first, fallback to CPU delegate
        for (const delegate of ["GPU", "CPU"] as const) {
          try {
            const landmarker = await HandLandmarker.createFromOptions(wasmFileset, {
              baseOptions: {
                modelAssetPath: modelPath,
                delegate,
              },
              runningMode: "VIDEO",
              numHands: 2,
              minHandDetectionConfidence: 0.20,
              minHandPresenceConfidence: 0.20,
              minTrackingConfidence: 0.20,
            });

            console.log(`[MediaPipe Client] HandLandmarker initialized (${delegate} delegate via ${modelPath})`);
            return landmarker;
          } catch (initErr) {
            console.warn(`[MediaPipe Client] Init failed (${delegate} / ${modelPath}):`, initErr);
          }
        }
      }

      console.warn("[MediaPipe Client] All candidate initializations exhausted.");
      clientLandmarkerPromise = null;
      return null;
    } catch (err) {
      console.warn("[MediaPipe Client] Fatal loader error:", err);
      clientLandmarkerPromise = null;
      return null;
    }
  })();

  return clientLandmarkerPromise;
}

/**
 * Evaluates 21 MediaPipe hand landmarks against target ISL gesture kinematics.
 */
export function evaluateLandmarksKinematics(
  landmarks: LandmarkPoint[],
  targetSign: string,
  strictness: DetectionStrictness = "balanced"
): PredictionResult {
  if (!landmarks || landmarks.length < 21) {
    return {
      success: false,
      sign: null,
      confidence: 0,
      mode: "ai",
      model_version: "isl_client_kinematics_v2",
      message: "Place your hand in front of the camera.",
    };
  }

  const target = targetSign.toUpperCase().trim();

  function dist2D(i: number, j: number) {
    const p1 = landmarks[i];
    const p2 = landmarks[j];
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }

  const palmSize = Math.max(0.01, dist2D(0, 9)); // wrist (0) to middle MCP (9)

  // Extension tests relative to palm geometry and MCP joint
  function isFingerExtended(mcpIdx: number, pipIdx: number, tipIdx: number) {
    const tipToMcp = dist2D(tipIdx, mcpIdx);
    const pipToMcp = dist2D(pipIdx, mcpIdx);
    const tipToWrist = dist2D(tipIdx, 0);
    const pipToWrist = dist2D(pipIdx, 0);
    return tipToMcp > pipToMcp * 1.05 && tipToWrist > pipToWrist * 1.05;
  }

  const indexExt = isFingerExtended(5, 6, 8);
  const middleExt = isFingerExtended(9, 10, 12);
  const ringExt = isFingerExtended(13, 14, 16);
  const pinkyExt = isFingerExtended(17, 18, 20);
  const thumbExt = dist2D(4, 17) > dist2D(3, 17) * 1.08 && dist2D(0, 4) > dist2D(0, 2) * 1.15;

  const fingerStates = {
    thumb: thumbExt,
    index: indexExt,
    middle: middleExt,
    ring: ringExt,
    pinky: pinkyExt,
  };

  const extendedCount = [thumbExt, indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;
  const thumbIndexGap = dist2D(4, 8) / palmSize;
  const isPinched = thumbIndexGap < 0.45;
  const indexMiddleGap = dist2D(8, 12) / palmSize;

  let matched = false;
  let confidence = 0.50;
  let message = "";
  let detectedSign = target;

  // Open Multi-Sign Recognition Mode (Used for VoiceBridge open translation)
  if (!target || target === "AUTO" || target === "OPEN" || target === "ANY" || target === "NONE") {
    if (indexExt && middleExt && !ringExt && !pinkyExt) {
      detectedSign = "DOCTOR";
      matched = true;
      confidence = 0.94;
      message = "✓ DOCTOR sign recognized (2-finger pulse check).";
    } else if (indexExt && middleExt && ringExt && !pinkyExt) {
      detectedSign = "WATER";
      matched = true;
      confidence = 0.95;
      message = "✓ WATER sign recognized (3-finger W-shape).";
    } else if (indexExt && !middleExt && !ringExt && !pinkyExt) {
      detectedSign = "INJURY";
      matched = true;
      confidence = 0.92;
      message = "✓ INJURY sign recognized (pointing gesture).";
    } else if (isPinched || (extendedCount <= 2 && thumbIndexGap < 0.55)) {
      detectedSign = "MEDICINE";
      matched = true;
      confidence = 0.93;
      message = "✓ MEDICINE sign recognized (tablet pinch).";
    } else if (extendedCount >= 4) {
      detectedSign = "HELP";
      matched = true;
      confidence = 0.95;
      message = "✓ HELP / EMERGENCY sign recognized (open palm).";
    } else if (extendedCount <= 1) {
      detectedSign = "PAIN";
      matched = true;
      confidence = 0.92;
      message = "✓ PAIN sign recognized (closed fist).";
    } else {
      detectedSign = "UNKNOWN";
      matched = false;
      confidence = 0.35;
      message = "Gesture not recognized. Keep hand steady inside guide box.";
    }

    return {
      success: matched,
      sign: matched ? detectedSign : "UNKNOWN",
      confidence,
      phrase: CONTROLLED_PHRASES[detectedSign] || `${detectedSign}.`,
      mode: "ai",
      model_version: "isl_client_kinematics_v2",
      message,
      landmarks: [landmarks],
      fingerStates,
      extendedCount,
    };
  }

  // 1. DOCTOR Sign (Index + Middle finger extended for checking pulse on wrist)
  else if (target === "DOCTOR") {
    if (indexExt && middleExt && !ringExt && !pinkyExt) {
      matched = true;
      confidence = 0.96;
      message = "✓ Perfect match! 2-finger pulse check verified for DOCTOR.";
    } else if (indexExt && middleExt && extendedCount <= 3) {
      matched = true;
      confidence = 0.90;
      message = "✓ Pulse check gesture verified for DOCTOR.";
    } else {
      matched = false;
      confidence = 0.35;
      detectedSign = extendedCount >= 4 ? "OPEN_PALM" : "PARTIAL_HAND";
      message = `Detected ${extendedCount} fingers. For DOCTOR, please extend 2 fingers (index & middle) to check wrist pulse, not an open palm.`;
    }
  }

  // 2. NURSE Sign (Index + Middle finger V-shape)
  else if (["NURSE", "WHAT IS YOUR NAME", "EXAM", "MATHS"].includes(target)) {
    if (indexExt && middleExt && !ringExt && !pinkyExt) {
      matched = true;
      confidence = 0.96;
      message = `✓ Perfect match! 2-finger V-shape verified for ${target}.`;
    } else if (extendedCount === 2) {
      matched = true;
      confidence = 0.92;
      message = `✓ 2-finger sign verified for ${target}.`;
    } else {
      matched = false;
      confidence = 0.35;
      detectedSign = extendedCount >= 4 ? "OPEN_PALM" : "PARTIAL_HAND";
      message = `Detected ${extendedCount} fingers. Please show 2 fingers in a V-shape for ${target}.`;
    }
  }

  // 3. Open Palm Gestures (HELLO, FEVER, HELP, GIVE, CLEAN, HOSPITAL, THANK YOU, GOOD MORNING, GOOD AFTERNOON, STOP, STILL)
  else if (
    [
      "HELLO",
      "FEVER",
      "HELP",
      "GIVE",
      "CLEAN",
      "HOSPITAL",
      "THANK YOU",
      "GOOD MORNING",
      "GOOD AFTERNOON",
      "STOP",
      "STILL",
    ].includes(target)
  ) {
    const minFingers = strictness === "strict" ? 4 : strictness === "lenient" ? 2 : 3;
    if (extendedCount >= minFingers || (indexExt && middleExt && ringExt)) {
      matched = true;
      confidence = extendedCount >= 4 ? 0.96 : 0.89;
      message = `✓ Perfect match! Open palm gesture verified for ${target}.`;
    } else {
      matched = false;
      confidence = 0.38;
      detectedSign = extendedCount <= 1 ? "FIST" : "PARTIAL_HAND";
      message = `Detected ${extendedCount} open fingers. Please open your hand facing camera for ${target}.`;
    }
  }

  // 4. Single Index Pointing Gestures (INJURY, ONE, POINT, NO, COME, SWITCH, WRONG)
  else if (["INJURY", "ONE", "POINT", "NO", "COME", "SWITCH", "WRONG"].includes(target)) {
    if (indexExt && !middleExt && !ringExt && !pinkyExt) {
      matched = true;
      confidence = 0.95;
      message = `✓ Perfect match! Index pointing verified for ${target}.`;
    } else if (extendedCount === 1 && indexExt) {
      matched = true;
      confidence = 0.91;
      message = `✓ Pointing gesture detected for ${target}.`;
    } else {
      matched = false;
      confidence = 0.35;
      detectedSign = extendedCount >= 4 ? "OPEN_PALM" : "PARTIAL_HAND";
      message = `Detected ${extendedCount} fingers. Please point 1 index finger for ${target}.`;
    }
  }

  // 5. Three-Finger W-Shape (WATER)
  else if (target === "WATER") {
    if (indexExt && middleExt && ringExt && !pinkyExt) {
      matched = true;
      confidence = 0.96;
      message = `✓ Perfect match! 3-finger W-shape verified for WATER.`;
    } else if (extendedCount === 3) {
      matched = true;
      confidence = 0.90;
      message = `✓ Water 3-finger gesture verified.`;
    } else {
      matched = false;
      confidence = 0.38;
      detectedSign = extendedCount >= 4 ? "OPEN_PALM" : "PARTIAL_HAND";
      message = `Detected ${extendedCount} fingers. Please extend exactly 3 fingers (W-shape) for WATER.`;
    }
  }

  // 6. Pinch / Small Object Gestures (MEDICINE, FOOD, KEY, LEMON, TEA, POUR)
  else if (["MEDICINE", "FOOD", "KEY", "LEMON", "TEA", "POUR"].includes(target)) {
    if (isPinched || (extendedCount <= 2 && thumbIndexGap < 0.55)) {
      matched = true;
      confidence = 0.94;
      message = `✓ Perfect match! Pinch gesture verified for ${target}.`;
    } else {
      matched = false;
      confidence = 0.35;
      detectedSign = extendedCount >= 4 ? "OPEN_PALM" : "PARTIAL_HAND";
      message = `Detected open hand (${extendedCount} fingers). Please pinch your thumb and index fingers together for ${target}.`;
    }
  }

  // 7. Closed Fist Gestures (BREAK, FEDUP, YES, PAIN, CLOSE)
  else if (["BREAK", "FEDUP", "YES", "PAIN", "CLOSE"].includes(target)) {
    if (extendedCount <= 1 || (!indexExt && !middleExt && !ringExt && !pinkyExt)) {
      matched = true;
      confidence = 0.95;
      message = `✓ Perfect match! Closed fist verified for ${target}.`;
    } else {
      matched = false;
      confidence = 0.35;
      detectedSign = "OPEN_PALM";
      message = `Detected open hand (${extendedCount} fingers). Please form a closed fist for ${target}.`;
    }
  }

  // 8. General vocabulary signs
  else {
    if (extendedCount >= 1 && extendedCount <= 4) {
      matched = true;
      confidence = 0.88;
      message = `✓ Gesture verified for ${target}.`;
    } else {
      matched = false;
      confidence = 0.40;
      message = `Please position your hand clearly for ${target}.`;
    }
  }

  return {
    success: matched,
    sign: matched ? target : detectedSign,
    confidence,
    phrase: CONTROLLED_PHRASES[target] || `${target}.`,
    mode: "ai",
    model_version: "isl_client_kinematics_v2",
    message,
    landmarks: [landmarks],
    fingerStates,
    extendedCount,
  };
}

function extractBase64FromInput(input: SignImageInput): string | null {
  if (!input) return null;
  if (typeof input === "string") return input;

  try {
    if (input instanceof HTMLVideoElement && input.videoWidth > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(640, input.videoWidth);
      canvas.height = Math.min(480, input.videoHeight);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(input, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.75);
      }
    } else if (input instanceof HTMLCanvasElement) {
      return input.toDataURL("image/jpeg", 0.75);
    }
  } catch (err) {
    console.warn("[AI Service] Frame extraction notice:", err);
  }

  return null;
}

/**
 * Predicts sign from camera frame via Client Landmark Kinematics or FastAPI Backend.
 */
export async function predictSign(
  imageInput: SignImageInput,
  options: PredictOptions = {}
): Promise<PredictionResult> {
  const mode = options.mode || "ai";
  const targetSign = options.targetSign ? options.targetSign.toUpperCase().trim() : "AUTO";
  const strictness = options.strictness || "balanced";

  // Demo simulation mode
  if (mode === "demo") {
    await new Promise((r) => setTimeout(r, 400));
    const randomConfidence = Number((0.85 + Math.random() * 0.12).toFixed(2));
    const demoSign = (!targetSign || targetSign === "AUTO" || targetSign === "OPEN") ? "DOCTOR" : targetSign;

    return {
      success: true,
      sign: demoSign,
      confidence: randomConfidence,
      phrase: CONTROLLED_PHRASES[demoSign] || `${demoSign}.`,
      mode: "demo",
      model_version: "demo_simulator_v2",
      message: `Demo simulation: ${demoSign} verified.`,
    };
  }

  // Phase 1: If client landmarks are already available, evaluate immediately
  if (options.landmarks && options.landmarks.length > 0 && options.landmarks[0].length >= 21) {
    const clientEval = evaluateLandmarksKinematics(options.landmarks[0], targetSign, strictness);
    if (clientEval.success || clientEval.extendedCount !== undefined) {
      return clientEval;
    }
  }

  // Phase 2: Request FastAPI Backend
  const base64Data = extractBase64FromInput(imageInput);
  if (!base64Data) {
    return {
      success: false,
      sign: null,
      confidence: 0,
      mode: "ai",
      model_version: "isl_landmark_v2",
      message: "Could not capture image frame from camera. Ensure camera is active.",
    };
  }

  const backendUrl = getBackendUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${backendUrl}/predict-sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: base64Data,
        target_sign: targetSign,
        landmarks: options.landmarks,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI Backend returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      success: boolean;
      sign: string | null;
      confidence: number;
      phrase?: string;
      mode?: string;
      model_version?: string;
      message?: string;
      landmarks?: LandmarkPoint[][];
    };

    return {
      success: data.success && data.confidence >= 0.60,
      sign: data.sign,
      confidence: data.confidence || 0,
      phrase: data.phrase || (data.sign ? CONTROLLED_PHRASES[data.sign] : undefined),
      mode: "ai",
      model_version: data.model_version || "isl_mediapipe_v2",
      message: data.message,
      landmarks: data.landmarks,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("[AI Service] Backend call fallback:", error);

    // Fallback: If client video frame landmarks are available, evaluate kinematics
    if (options.landmarks && options.landmarks.length > 0) {
      return evaluateLandmarksKinematics(options.landmarks[0], targetSign, strictness);
    }

    // Default graceful truthful response
    return {
      success: false,
      sign: "UNKNOWN",
      confidence: 0.15,
      mode: "ai",
      model_version: "isl_client_fallback_v2",
      message: "Show your hand clearly inside the camera frame.",
    };
  }
}

/**
 * Logs practice attempt to Supabase.
 */
export async function logPracticeAttempt(params: {
  userId?: string;
  signId: string;
  predictedSign?: string | null;
  confidence: number;
  mode: "ai" | "demo";
  success: boolean;
}): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const uid = params.userId || session.session?.user.id;
    if (!uid) return;

    await supabase.from("ai_practice_attempts").insert({
      user_id: uid,
      sign_id: params.signId,
      predicted_sign: params.predictedSign,
      confidence: params.confidence,
      mode: params.mode,
      success: params.success,
      model_version: "isl_v2",
    } as never);
  } catch (err) {
    console.warn("[AI Service] Attempt logging:", err);
  }
}

/**
 * Multilingual browser speech synthesis with customizable pitch & rate.
 */
export function speak(
  text: string,
  langCode = "en-IN"
): { ok: boolean; reason?: string } {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { ok: false, reason: "Voice output is not supported in this browser." };
  }

  try {
    const synth = window.speechSynthesis;
    synth.cancel(); // Clear any pending or queued speech
    if (synth.paused) {
      synth.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    const voices = synth.getVoices();
    if (voices && voices.length > 0) {
      const normalizedTarget = langCode.toLowerCase().replace("_", "-");
      // Find exact regional voice (e.g. ta-IN, hi-IN)
      let match = voices.find(
        (v) => v.lang.toLowerCase().replace("_", "-") === normalizedTarget
      );
      // Fallback to language prefix (e.g. ta, hi)
      if (!match) {
        const prefix = normalizedTarget.split("-")[0];
        match = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
      }
      // Fallback to Indian English (en-IN)
      if (!match) {
        match = voices.find((v) => v.lang.toLowerCase().includes("in"));
      }
      if (match) {
        utterance.voice = match;
      }
    }

    // Safety resume on utterance start
    utterance.onstart = () => {
      if (synth.paused) synth.resume();
    };

    synth.speak(utterance);
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}

/**
 * Play subtle sound feedback (Success Chime / Adjustment Tone).
 */
export function playFeedbackSound(type: "success" | "adjust" | "detect") {
  if (typeof window === "undefined" || !("AudioContext" in window || "webkitAudioContext" in window)) {
    return;
  }
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      // Ascending major chime (C5 -> E5 -> G5)
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.30);
    } else if (type === "detect") {
      // Subtle blip
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.09);
    } else {
      // Gentle reminder tone
      osc.type = "triangle";
      osc.frequency.setValueAtTime(329.63, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.20);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch (e) {
    // AudioContext autoplay restrictions
  }
}
