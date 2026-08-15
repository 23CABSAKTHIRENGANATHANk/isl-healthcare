/**
 * ISL Setu — Reverse Speech-to-Sign Engine
 * Transcribes spoken medical language (Tamil, Hindi, English) in real-time
 * and extracts matching clinical ISL sign video assets for deaf patient communication.
 */

import { SIGN_VIDEO_URLS } from "@/config/video-mapping";

export interface SpeechSignMatch {
  keyword: string;
  signGloss: string;
  tamilMeaning: string;
  videoUrl: string;
  category: string;
}

// Clinical Speech-to-Sign Keyword Mapping across Tamil, Hindi, and English
const CLINICAL_KEYWORD_MAP: Record<
  string,
  {
    signGloss: string;
    tamilMeaning: string;
    keywords: string[];
    category: string;
  }
> = {
  FEVER: {
    signGloss: "FEVER",
    tamilMeaning: "காய்ச்சல்",
    keywords: ["காய்ச்சல்", "சூடு", "டெம்பரேச்சர்", "fever", "temperature", "hot", "बुखार"],
    category: "clinical",
  },
  PAIN: {
    signGloss: "PAIN",
    tamilMeaning: "வலி",
    keywords: ["வலி", "வலிக்கிறது", "நோவு", "துடிக்கிறது", "pain", "hurts", "aching", "sore", "दर्द", "तकलीफ"],
    category: "clinical",
  },
  MEDICINE: {
    signGloss: "MEDICINE",
    tamilMeaning: "மருந்து",
    keywords: ["மருந்து", "மாத்திரை", "டேப்லெட்", "டானிக்", "ஊசி", "medicine", "tablet", "pills", "dose", "दवाई", "औषधि"],
    category: "clinical",
  },
  DOCTOR: {
    signGloss: "DOCTOR",
    tamilMeaning: "மருத்துவர்",
    keywords: ["டாக்டர்", "மருத்துவர்", "ஸ்பெஷலிஸ்ட்", "doctor", "physician", "consultant", "डॉक्टर"],
    category: "clinical",
  },
  NURSE: {
    signGloss: "NURSE",
    tamilMeaning: "செவிலியர்",
    keywords: ["நர்ஸ்", "செவிலியர்", "nurse", "sister", "நலப்பணியாளர்", "नर्स"],
    category: "clinical",
  },
  WATER: {
    signGloss: "WATER",
    tamilMeaning: "தண்ணீர்",
    keywords: ["தண்ணி", "தண்ணீர்", "குடிக்க", "தாகம்", "water", "drink", "thirsty", "hydrate", "पानी", "जल"],
    category: "nutrition",
  },
  EMERGENCY: {
    signGloss: "EMERGENCY",
    tamilMeaning: "அவசரம்",
    keywords: ["அவசரம்", "ஆபத்து", "உடனே", "ஐசியூ", "emergency", "urgent", "icu", "critical", "आपातकालीन", "तुरंत"],
    category: "clinical",
  },
  HELP: {
    signGloss: "HELP",
    tamilMeaning: "உதவி",
    keywords: ["உதவி", "காப்பாத்துங்க", "சகாயம்", "help", "assist", "support", "मदद", "सहायता"],
    category: "clinical",
  },
  BLOOD: {
    signGloss: "BLOOD",
    tamilMeaning: "இரத்தம்",
    keywords: ["ரத்தம்", "இரத்தம்", "பிளட்", "blood", "bleed", "bleeding", "खून", "रक्त"],
    category: "clinical",
  },
  INJURY: {
    signGloss: "INJURY",
    tamilMeaning: "காயம்",
    keywords: ["காயம்", "அடிபட்டது", "வெட்டு", "injury", "wound", "fracture", "cut", "चोट", "घाव"],
    category: "clinical",
  },
  HOSPITAL: {
    signGloss: "HOSPITAL",
    tamilMeaning: "மருத்துவமனை",
    keywords: ["ஆஸ்பத்திரி", "மருத்துவமனை", "கிளினிக்", "ward", "hospital", "clinic", "अस्पताल"],
    category: "clinical",
  },
  YES: {
    signGloss: "YES",
    tamilMeaning: "ஆம் / சரி",
    keywords: ["ஆம்", "சரி", "ஆமா", "ஓகே", "yes", "okay", "correct", "agree", "हाँ", "ठीक"],
    category: "communication",
  },
  NO: {
    signGloss: "NO",
    tamilMeaning: "இல்லை / தவறு",
    keywords: ["இல்லை", "இல்ல", "வேண்டாம்", "தவறு", "no", "not", "disagree", "never", "नहीं", "गलत"],
    category: "communication",
  },
  HELLO: {
    signGloss: "HELLO",
    tamilMeaning: "வணக்கம்",
    keywords: ["வணக்கம்", "நமஸ்காரம்", "ஹலோ", "hello", "hi", "welcome", "greetings", "नमस्ते"],
    category: "communication",
  },
  "THANK YOU": {
    signGloss: "THANK YOU",
    tamilMeaning: "நன்றி",
    keywords: ["நன்றி", "மிக்க நன்றி", "தேங்க்ஸ்", "thank you", "thanks", "grateful", "धन्यवाद"],
    category: "communication",
  },
  FOOD: {
    signGloss: "FOOD",
    tamilMeaning: "உணவு",
    keywords: ["சாப்பாடு", "உணவு", "பசி", "சாப்பிடுங்க", "food", "eat", "meal", "diet", "खाना", "भोजन"],
    category: "nutrition",
  },
  CLEAN: {
    signGloss: "CLEAN",
    tamilMeaning: "சுத்தம்",
    keywords: ["சுத்தம்", "வாஷ்", "துடைக்கவும்", "clean", "sanitize", "wash", "हाथ धोएं", "साफ"],
    category: "clinical",
  },
  CLOSE: {
    signGloss: "CLOSE",
    tamilMeaning: "மூடவும்",
    keywords: ["மூடுங்கள்", "மூடவும்", "கண் மூடு", "close", "shut", "eyes closed", "बंद"],
    category: "clinical",
  },
  COME: {
    signGloss: "COME",
    tamilMeaning: "வாருங்கள்",
    keywords: ["வாருங்கள்", "உள்ளே வாங்க", "இங்கு வா", "come", "enter", "step in", "अंदर आइए"],
    category: "communication",
  },
  STOP: {
    signGloss: "STOP",
    tamilMeaning: "நிறுத்துங்கள்",
    keywords: ["நிறுத்துங்கள்", "நில்லுங்கள்", "பொறுங்கள்", "stop", "halt", "pause", "wait", "रुकिए"],
    category: "clinical",
  },
};

/**
 * Searches a spoken text string for known medical sign keywords.
 */
export function extractSignMatchesFromSpeech(spokenText: string): SpeechSignMatch[] {
  if (!spokenText) return [];
  const normalized = spokenText.toLowerCase();
  const matches: SpeechSignMatch[] = [];
  const matchedGlosses = new Set<string>();

  for (const [key, item] of Object.entries(CLINICAL_KEYWORD_MAP)) {
    for (const kw of item.keywords) {
      if (normalized.includes(kw.toLowerCase()) && !matchedGlosses.has(item.signGloss)) {
        matchedGlosses.add(item.signGloss);
        const glossLower = item.signGloss.toLowerCase();
        const videoUrl =
          SIGN_VIDEO_URLS[glossLower] ||
          `/videos/signs/${item.signGloss.charAt(0).toUpperCase() + item.signGloss.slice(1).toLowerCase()}.mp4`;

        matches.push({
          keyword: kw,
          signGloss: item.signGloss,
          tamilMeaning: item.tamilMeaning,
          videoUrl,
          category: item.category,
        });
        break;
      }
    }
  }

  // If no specific keyword is found, but text is present, default to primary greeting/intake
  if (matches.length === 0 && spokenText.trim().length > 0) {
    matches.push({
      keyword: "consultation",
      signGloss: "DOCTOR",
      tamilMeaning: "மருத்துவர் ஆலோசனை",
      videoUrl: SIGN_VIDEO_URLS["doctor"] || "/videos/signs/Doctor.mp4",
      category: "clinical",
    });
  }

  return matches;
}

/**
 * Voice Recognition Controller wrapper for Doctor-to-Patient Reverse Translation.
 */
export class DoctorSpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private onResultCallback?: (transcript: string, matches: SpeechSignMatch[]) => void;
  private onErrorCallback?: (err: string) => void;
  private onEndCallback?: () => void;
  public language = "ta-IN";

  constructor(lang: "ta" | "hi" | "en" = "ta") {
    this.setLanguage(lang);
    this.initRecognition();
  }

  public setLanguage(lang: "ta" | "hi" | "en") {
    this.language = lang === "ta" ? "ta-IN" : lang === "hi" ? "hi-IN" : "en-US";
    if (this.recognition) {
      this.recognition.lang = this.language;
    }
  }

  private initRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("[DoctorSpeechRecognizer] Web Speech Recognition API not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.language;

    this.recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        const matches = extractSignMatchesFromSpeech(finalTranscript);
        this.onResultCallback?.(finalTranscript.trim(), matches);
      }
    };

    this.recognition.onerror = (event: any) => {
      this.onErrorCallback?.(event.error || "Speech recognition error");
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEndCallback?.();
    };
  }

  public start(
    onResult: (transcript: string, matches: SpeechSignMatch[]) => void,
    onError?: (err: string) => void,
    onEnd?: () => void
  ): boolean {
    if (!this.recognition) {
      this.initRecognition();
    }
    if (!this.recognition) return false;

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    try {
      this.recognition.lang = this.language;
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (e) {
      console.warn("[DoctorSpeechRecognizer] start exception:", e);
      return false;
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening = false;
    }
  }

  public get active(): boolean {
    return this.isListening;
  }
}
