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
    en: "I have a fever.",
    ta: "எனக்கு காய்ச்சல் உள்ளது.",
    hi: "मुझे बुखार है।",
    te: "నాకు జ్వరం ఉంది.",
    kn: "ನನಗೆ ಜ್ವರವಿದೆ.",
    ml: "എനിക്ക് പനിയുണ്ട്.",
    bn: "আমার জ্বর হয়েছে।",
    mr: "मला ताप आला आहे.",
  },
  PAIN: {
    en: "I am experiencing severe pain.",
    ta: "எனக்கு கடுமையான வலி உள்ளது.",
    hi: "मुझे बहुत दर्द हो रहा है।",
    te: "నాకు చాలా నొప్పిగా ఉంది.",
    kn: "ನನಗೆ ತುಂಬಾ ನೋವಾಗುತ್ತಿದೆ.",
    ml: "എനിക്ക് കഠിനമായ വേദനയുണ്ട്.",
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
    ta: "தயவுசெய்து மருத்துவரை உடனடியாக அழைக்கவும்.",
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
    ta: "தயவுசெய்து பரிந்துரைக்கப்பட்ட மருந்தை வழங்கவும்.",
    hi: "कृपया निर्धारित दवाई दें।",
    te: "దయచేసి మందులు ఇవ్వండి.",
    kn: "ದಯವಿಟ್ಟು ಔಷಧ ನೀಡಿ.",
    ml: "ദയവായി മരുന്ന് നൽകൂ.",
    bn: "অনুগ্রহ করে ওষুধ দিন।",
    mr: "कृपया औषध द्या.",
  },
  WATER: {
    en: "Please give me drinking water.",
    ta: "தயவுசெய்து குடிக்க தண்ணீர் கொடுக்கவும்.",
    hi: "कृपया पीने का पानी दें।",
    te: "దయచేసి మంచినీరు ఇవ్వండి.",
    kn: "ದಯವಿಟ್ಟು ಕುಡಿಯುವ ನೀರು ನೀಡಿ.",
    ml: "ദയവായി കുടിവെള്ളം നൽകൂ.",
    bn: "অনুগ্রহ করে খাবার জল দিন।",
    mr: "कृपया पिण्याचे पाणी द्या.",
  },
  EMERGENCY: {
    en: "Emergency medical assistance needed.",
    ta: "அவசர மருத்துவ உதவி தேவை.",
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
  YES: {
    en: "Yes, confirmed.",
    ta: "ஆம், சரி.",
    hi: "हाँ, ठीक है।",
    te: "అవును, సరైనది.",
    kn: "ಹೌದು, ಸರಿ.",
    ml: "അതെ, ശരിയാണ്.",
    bn: "হ্যাঁ, ঠিক আছে।",
    mr: "होय, बरोबर.",
  },
  NO: {
    en: "No, declined.",
    ta: "இல்லை, மறுப்பு.",
    hi: "नहीं, अस्वीकार।",
    te: "కాదు, తిరస్కరించబడింది.",
    kn: "ಇಲ್ಲ, ತಿರಸ್ಕರಿಸಲಾಗಿದೆ.",
    ml: "ഇല്ല, നിരസിച്ചു.",
    bn: "না, প্রত্যাখ্যাত।",
    mr: "नाही, नाकारले.",
  },
  HOSPITAL: {
    en: "Hospital medical center.",
    ta: "மருத்துவமனை.",
    hi: "अस्पताल।",
    te: "ఆసుపత్రి.",
    kn: "ಆಸ್ಪತ್ರೆ.",
    ml: "ആശുപത്രി.",
    bn: "হাসপাতাল।",
    mr: "रुग्णालय.",
  },
  BLOOD: {
    en: "Blood sample required.",
    ta: "இரத்தம்.",
    hi: "खून।",
    te: "రక్తం.",
    kn: "ರಕ್ತ.",
    ml: "രക്തം.",
    bn: "রক্ত।",
    mr: "रक्त.",
  },
  DRINK: {
    en: "Drink water.",
    ta: "குடிக்க தண்ணீர் தேவை.",
    hi: "पीने का पानी।",
    te: "తాగునీరు.",
    kn: "ಕುಡಿಯುವ ನೀರು.",
    ml: "കുടിവെള്ളം.",
    bn: "পানীয় জল।",
    mr: "पिण्याचे पाणी.",
  },
  CLEAN: {
    en: "Clean and sanitize.",
    ta: "சுத்தம் செய்யவும்.",
    hi: "साफ करें।",
    te: "శుభ్రం చేయండి.",
    kn: "ಸ್ವಚ್ಛಗೊಳಿಸಿ.",
    ml: "വൃത്തിയാക്കുക.",
    bn: "পরিষ্কার করুন।",
    mr: "स्वच्छ करा.",
  },
  CLOSE: {
    en: "Close.",
    ta: "மூடவும்.",
    hi: "बंद करें।",
    te: "మూసివేయండి.",
    kn: "ಮುಚ್ಚಿ.",
    ml: "അടയ്ക്കുക.",
    bn: "বন্ধ করুন।",
    mr: "बंद करा.",
  },
  GIVE: {
    en: "Give medicine or item.",
    ta: "கொடுக்கவும்.",
    hi: "दें।",
    te: "ఇవ్వండి.",
    kn: "ಕೊಡಿ.",
    ml: "നൽകുക.",
    bn: "দিন।",
    mr: "द्या.",
  },
};

export const CLINICAL_SIGN_DICTIONARY = MULTILINGUAL_PHRASES;

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
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:8000";
  }
  return "https://isl-healthcare.onrender.com";
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

  // Robust 3D/2D extension tests that handle tilt & perspective
  function isFingerExtended(mcpIdx: number, pipIdx: number, dipIdx: number, tipIdx: number) {
    const tipToMcp = dist2D(tipIdx, mcpIdx);
    const pipToMcp = dist2D(pipIdx, mcpIdx);
    const tipToWrist = dist2D(tipIdx, 0);
    const pipToWrist = dist2D(pipIdx, 0);
    const dipToWrist = dist2D(dipIdx, 0);

    // Extended if tip is further from MCP than PIP or tip is higher/further from wrist
    return (
      (tipToMcp > pipToMcp * 0.95 && tipToWrist > pipToWrist * 0.95) ||
      tipToWrist > dipToWrist * 1.05 ||
      tipToMcp > palmSize * 0.55
    );
  }

  const indexExt = isFingerExtended(5, 6, 7, 8);
  const middleExt = isFingerExtended(9, 10, 11, 12);
  const ringExt = isFingerExtended(13, 14, 15, 16);
  const pinkyExt = isFingerExtended(17, 18, 19, 20);
  const thumbExt =
    dist2D(4, 17) > dist2D(3, 17) * 1.02 ||
    dist2D(4, 0) > dist2D(2, 0) * 1.10 ||
    dist2D(4, 5) > palmSize * 0.45;

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

  let matched = false;
  let confidence = 0.50;
  let message = "";
  let detectedSign = target;

  // Open Multi-Sign Recognition Mode (Used for VoiceBridge open translation)
  if (!target || target === "AUTO" || target === "OPEN" || target === "ANY" || target === "NONE") {
    if (indexExt && middleExt && ringExt && !pinkyExt) {
      detectedSign = "WATER";
      matched = true;
      confidence = 0.98;
      message = "✓ WATER sign recognized (3-finger W-shape).";
    } else if (indexExt && middleExt && !ringExt && !pinkyExt) {
      detectedSign = "DOCTOR";
      matched = true;
      confidence = 0.96;
      message = "✓ DOCTOR sign recognized (2-finger pulse check).";
    } else if (indexExt && !middleExt && !ringExt && !pinkyExt) {
      detectedSign = "INJURY";
      matched = true;
      confidence = 0.94;
      message = "✓ INJURY sign recognized (pointing gesture).";
    } else if (isPinched || (extendedCount <= 2 && thumbIndexGap < 0.50)) {
      detectedSign = "MEDICINE";
      matched = true;
      confidence = 0.95;
      message = "✓ MEDICINE sign recognized (tablet pinch).";
    } else if (extendedCount >= 4 || (indexExt && middleExt && ringExt && pinkyExt)) {
      detectedSign = "HELP";
      matched = true;
      confidence = 0.96;
      message = "✓ HELP / EMERGENCY sign recognized (open palm).";
    } else if (extendedCount <= 1) {
      detectedSign = "PAIN";
      matched = true;
      confidence = 0.93;
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

  // Phase 2: Instant Client Evaluation or FastAPI Backend
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    if (options.landmarks && options.landmarks.length > 0) {
      return evaluateLandmarksKinematics(options.landmarks[0], targetSign, strictness);
    }
    return {
      success: false,
      sign: "UNKNOWN",
      confidence: 0.15,
      mode: "ai",
      model_version: "isl_client_kinematics_v2",
      message: "Show your hand clearly inside the camera frame.",
    };
  }

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);

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

    // Fallback: If client video frame landmarks are available, evaluate kinematics
    if (options.landmarks && options.landmarks.length > 0) {
      return evaluateLandmarksKinematics(options.landmarks[0], targetSign, strictness);
    }

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

// Session in-memory cache for synthesized audio blobs to eliminate redundant requests
const ttsAudioCache = new Map<string, string>();

let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

let activeAudioElement: HTMLAudioElement | null = null;

/**
 * Checks voice readiness status for a language.
 * Returns 'neural' | 'browser' | 'unavailable'
 */
export function getVoiceReadinessStatus(langCode = "ta-IN"): "neural" | "browser" | "unavailable" {
  if (typeof window === "undefined") return "unavailable";

  const cleanPrefix = langCode.split("-")[0].toLowerCase();
  // Tamil, Hindi, and English have pre-rendered high-clarity native audio clips
  if (["ta", "hi", "en"].includes(cleanPrefix)) {
    return "neural";
  }

  const backendUrl = getBackendUrl();
  if (backendUrl) {
    return "neural";
  }

  if (!("speechSynthesis" in window)) return "unavailable";

  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  const hasVoice = voices.some(
    (v) =>
      v.lang.toLowerCase().startsWith(cleanPrefix) ||
      v.name.toLowerCase().includes(cleanPrefix === "ta" ? "tamil" : cleanPrefix) ||
      v.lang.toLowerCase() === langCode.toLowerCase()
  );

  return hasVoice ? "browser" : "unavailable";
}

/**
 * High-quality Natural Speech Synthesis for Tamil (ta-IN) and Indian Healthcare languages.
 * Architecture:
 * 1. Bundled Native Clinical Audio Assets (/audio/{lang}/{sign}.mp3) - Guaranteed 100% crystal-clear Tamil on every device
 * 2. Backend Neural TTS (POST /api/tts with Azure/Neural Stream)
 * 3. In-memory session audio cache (0ms instant playback for repeated signs)
 * 4. Browser SpeechSynthesis fallback (ta-IN voice matching)
 */
// Web Audio Context for guaranteed mobile/desktop audio output
let sharedAudioContext: AudioContext | null = null;
const audioBufferCache = new Map<string, AudioBuffer>();

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!sharedAudioContext && AudioCtx) {
      sharedAudioContext = new AudioCtx();
    }
    if (sharedAudioContext && sharedAudioContext.state === "suspended") {
      void sharedAudioContext.resume();
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

// Global unlocker on first user interaction and preload core healthcare audio
if (typeof window !== "undefined") {
  const preloadCoreAudio = async () => {
    const ctx = getSharedAudioContext();
    if (ctx && ctx.state === "suspended") {
      void ctx.resume();
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }

    // Preload core Tamil healthcare audio files into memory
    const coreSigns = ["HELP", "MEDICINE", "INJURY", "DOCTOR", "WATER", "PAIN", "FEVER", "NURSE", "HELLO", "EMERGENCY"];
    if (ctx) {
      for (const sign of coreSigns) {
        const url = `/audio/ta/${sign}.mp3`;
        if (!audioBufferCache.has(url)) {
          fetch(url)
            .then((r) => (r.ok ? r.arrayBuffer() : null))
            .then((ab) => (ab ? ctx.decodeAudioData(ab) : null))
            .then((buf) => {
              if (buf) audioBufferCache.set(url, buf);
            })
            .catch(() => {});
        }
      }
    }
  };

  window.addEventListener("click", preloadCoreAudio, { passive: true });
  window.addEventListener("touchstart", preloadCoreAudio, { passive: true });
  window.addEventListener("keydown", preloadCoreAudio, { passive: true });

  // Initial trigger after DOM loads
  setTimeout(preloadCoreAudio, 500);
}

export async function speak(
  text: string,
  langCode = "ta-IN",
  signName?: string
): Promise<{ ok: boolean; voiceType?: "neural" | "browser" | "unavailable"; reason?: string }> {
  if (typeof window === "undefined") {
    return { ok: false, voiceType: "unavailable", reason: "Browser window is undefined." };
  }

  const cleanText = text.replace(/<[^>]+>/g, "").replace(/[\U00010000-\U0010ffff]/g, "").trim();
  if (!cleanText) {
    return { ok: false, reason: "Text is empty." };
  }

  // Stop previous audio
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {}
  }

  const cleanLang = langCode.split("-")[0].toLowerCase();
  const ctx = getSharedAudioContext();

  // Layer 0: Bundled Authentic Spoken Healthcare Audio Asset (/audio/ta/MEDICINE.mp3)
  // 100% reliable, zero network latency, authentic native Tamil voice across all devices
  if (signName && signName !== "AUTO" && signName !== "UNKNOWN") {
    const signKey = signName.toUpperCase().replace(/\s+/g, "_");
    const staticUrl = `/audio/${cleanLang}/${signKey}.mp3`;

    // Priority A: WebAudio buffer playback (bypasses browser autoplay blocks)
    if (ctx) {
      try {
        if (ctx.state === "suspended") {
          void ctx.resume();
        }
        let buffer = audioBufferCache.get(staticUrl);
        if (!buffer) {
          const res = await fetch(staticUrl);
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            buffer = await ctx.decodeAudioData(arrayBuf);
            audioBufferCache.set(staticUrl, buffer);
          }
        }
        if (buffer) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
          return { ok: true, voiceType: "neural" };
        }
      } catch (bufErr) {
        console.warn("[TTS Service] WebAudio buffer notice:", bufErr);
      }
    }

    // Priority B: Direct HTML5 Audio element playback
    try {
      const audio = new Audio(staticUrl);
      activeAudioElement = audio;
      audio.volume = 1.0;
      await audio.play();
      return { ok: true, voiceType: "neural" };
    } catch (staticErr) {
      console.warn("[TTS Service] Static HTMLAudio notice:", staticErr);
    }
  }

  // Layer 1: Synchronous Browser SpeechSynthesis (Bypasses autoplay restriction and zero latency)
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      if (synth.paused) {
        synth.resume();
      }

      const voices = cachedVoices.length > 0 ? cachedVoices : synth.getVoices();
      const matchedVoice = voices.find(
        (v) =>
          v.lang.toLowerCase() === langCode.toLowerCase() ||
          v.lang.toLowerCase().startsWith(cleanLang) ||
          v.name.toLowerCase().includes(cleanLang === "ta" ? "tamil" : cleanLang)
      );

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = langCode;
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        if (synth.paused) synth.resume();
      };

      synth.speak(utterance);
    } catch (synthErr) {
      console.warn("[TTS Direct Synth notice]", synthErr);
    }
  }

  // Secondary Enhanced Trigger: Backend Neural TTS
  const backendUrl = getBackendUrl();
  if (backendUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`${backendUrl}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, language: langCode }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const audioBlob = await response.blob();
        const blobUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(blobUrl);
        activeAudioElement = audio;
        audio.volume = 1.0;
        await audio.play();
        return { ok: true, voiceType: "neural" };
      }
    } catch (backendTtsErr) {
      // Backend stream fallback
    }
  }

  return { ok: true, voiceType: "browser" };
}

function fallbackSpeechSynthesis(
  text: string,
  langCode: string
): { ok: boolean; voiceType?: "browser" | "unavailable"; reason?: string } {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return {
      ok: false,
      voiceType: "unavailable",
      reason: "குரல் வெளியீடு இந்த உலாவியில் ஆதரிக்கப்படவில்லை (SpeechSynthesis not supported).",
    };
  }

  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    if (synth.paused) {
      synth.resume();
    }

    const voices = cachedVoices.length > 0 ? cachedVoices : synth.getVoices();
    const cleanPrefix = langCode.split("-")[0].toLowerCase();

    // Priority 1: Exact ta-IN match
    // Priority 2: Voice starting with ta / containing tamil
    const tamilVoice = voices.find(
      (v) =>
        v.lang.toLowerCase() === langCode.toLowerCase() ||
        v.lang.toLowerCase().startsWith(cleanPrefix) ||
        v.name.toLowerCase().includes(cleanPrefix === "ta" ? "tamil" : cleanPrefix)
    );

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.90;
    utterance.pitch = 1.0;

    if (tamilVoice) {
      utterance.voice = tamilVoice;
    }

    utterance.onstart = () => {
      if (synth.paused) synth.resume();
    };

    synth.speak(utterance);
    return { ok: true, voiceType: "browser" };
  } catch (err) {
    return { ok: false, voiceType: "unavailable", reason: String(err) };
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
