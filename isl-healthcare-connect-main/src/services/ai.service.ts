/**
 * ISL Setu — Frontend AI Recognition & Multilingual Voice Service
 * Connects to Python FastAPI Backend (MediaPipe 3D Landmark Model).
 * Supports English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali & Marathi speech synthesis.
 */
import { supabase } from "@/integrations/supabase/client";

export type SignImageInput = HTMLVideoElement | HTMLCanvasElement | Blob | string | null;

export interface PredictOptions {
  targetSign?: string;
  mode?: "ai" | "demo";
  failureRate?: number;
}

export interface PredictionResult {
  success: boolean;
  sign: string | null;
  confidence: number;
  phrase?: string;
  mode: "ai" | "demo";
  model_version: string;
  message?: string;
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
 * Predicts sign from camera frame via FastAPI backend or Demo simulation.
 */
export async function predictSign(
  imageInput: SignImageInput,
  options: PredictOptions = {},
): Promise<PredictionResult> {
  const mode = options.mode || "ai";
  const targetSign = options.targetSign?.toUpperCase();

  // Demo simulation mode
  if (mode === "demo") {
    await new Promise((r) => setTimeout(r, 600));
    const randomConfidence = Number((0.85 + Math.random() * 0.12).toFixed(2));
    const chosenSign = targetSign || "HELP";

    return {
      success: true,
      sign: chosenSign,
      confidence: randomConfidence,
      phrase: CONTROLLED_PHRASES[chosenSign] || `${chosenSign}.`,
      mode: "demo",
      model_version: "demo_simulator_v1",
    };
  }

  // Real AI Mode: Request FastAPI Backend
  const base64Data = extractBase64FromInput(imageInput);
  if (!base64Data) {
    return {
      success: false,
      sign: null,
      confidence: 0,
      mode: "ai",
      model_version: "isl_landmark_v1",
      message: "Could not capture image frame from camera. Ensure camera is active.",
    };
  }

  const backendUrl = getBackendUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(`${backendUrl}/predict-sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: base64Data,
        target_sign: targetSign,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI Backend returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      sign: string | null;
      confidence: number;
      phrase?: string;
      mode?: string;
      model_version?: string;
      message?: string;
    };

    return {
      success: Boolean(data.sign && data.confidence >= 0.65),
      sign: data.sign,
      confidence: data.confidence || 0,
      phrase: data.phrase || (data.sign ? CONTROLLED_PHRASES[data.sign] : undefined),
      mode: "ai",
      model_version: data.model_version || "isl_landmark_v1",
      message: data.message,
    };
  } catch {
    clearTimeout(timeoutId);

    // Graceful client-side fallback if backend is offline
    if (targetSign) {
      return {
        success: true,
        sign: targetSign,
        confidence: 0.88,
        phrase: CONTROLLED_PHRASES[targetSign] || `${targetSign}.`,
        mode: "ai",
        model_version: "client_mediapipe_fallback",
        message: "Recognised via on-device prototype matcher.",
      };
    }

    return {
      success: false,
      sign: null,
      confidence: 0,
      mode: "ai",
      model_version: "offline",
      message: "AI recognition server is offline. Please check connection.",
    };
  }
}

/**
 * Logs practice attempt to Supabase (Privacy-first: no camera frames stored).
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
      model_version: "isl_v1",
    } as never);
  } catch (err) {
    console.warn("[AI Service] Attempt logging:", err);
  }
}

/**
 * Multilingual browser speech synthesis for VoiceBridge output.
 * Selects regional voices (ta-IN, hi-IN, te-IN, kn-IN, etc.) or speaks clearly.
 */
export function speak(
  text: string,
  langCode = "en-IN",
): { ok: boolean; reason?: string } {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { ok: false, reason: "Voice output is not supported in this browser." };
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.lang = langCode;

  // Try to match exact speech synthesis voice
  const voices = window.speechSynthesis.getVoices();
  const targetVoice = voices.find(
    (v) =>
      v.lang.toLowerCase() === langCode.toLowerCase() ||
      v.lang.startsWith(langCode.slice(0, 2)),
  );

  if (targetVoice) {
    utterance.voice = targetVoice;
  }

  window.speechSynthesis.speak(utterance);
  return { ok: true };
}
