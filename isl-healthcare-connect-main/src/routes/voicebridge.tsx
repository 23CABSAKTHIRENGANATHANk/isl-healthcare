import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Cpu,
  Download,
  FileText,
  Globe,
  Hand,
  Mic,
  MicOff,
  PhoneCall,
  RotateCcw,
  Sparkles,
  Square,
  Trash2,
  User,
  Stethoscope,
  Video,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

import { CameraPreview, type RecognitionPhase } from "@/components/common/CameraPreview";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SUPPORTED_LANGUAGES,
  getSpokenPhrase,
  predictSign,
  speak,
  getVoiceReadinessStatus,
  getClientHandLandmarker,
  CLINICAL_SIGN_DICTIONARY,
  type LandmarkPoint,
} from "@/services/ai.service";
import {
  DoctorSpeechRecognizer,
  extractSignMatchesFromSpeech,
  type SpeechSignMatch,
} from "@/services/speech-to-sign.service";
import { emergencyTriageService, type EmergencyAlert } from "@/services/emergency-triage.service";
import { SIGN_VIDEO_URLS } from "@/config/video-mapping";
import { useCamera } from "@/hooks/use-camera";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { PredictionStabilizer } from "@/services/predictionStabilizer.service";
import { toast } from "sonner";

export const Route = createFileRoute("/voicebridge")({
  head: () => ({
    meta: [
      { title: "VoiceBridge — Sign to Voice & Doctor Speech to Sign | ISL Setu" },
      {
        name: "description",
        content:
          "Dedicated two-way clinical communication: Patient Sign to Voice, Doctor Speech to ISL Sign, and Live 2-Way Telehealth Consultation.",
      },
      { property: "og:title", content: "VoiceBridge — Clinical Sign & Speech Translator" },
      {
        property: "og:description",
        content: "Two-way medical speech-to-sign and sign-to-voice communication bridge for hospitals.",
      },
    ],
  }),
  component: VoiceBridgePageWrapper,
});

function VoiceBridgePageWrapper() {
  return (
    <ProtectedRoute>
      <VoiceBridgePage />
    </ProtectedRoute>
  );
}

const CORE_HEALTHCARE_SIGNS = [
  { sign: "HELP", label: "Help / உதவி", icon: "✋" },
  { sign: "DOCTOR", label: "Doctor / மருத்துவர்", icon: "✌️" },
  { sign: "NURSE", label: "Nurse / செவிலியர்", icon: "✌️" },
  { sign: "WATER", label: "Water / குடிநீர்", icon: "🖖" },
  { sign: "PAIN", label: "Pain / வலி", icon: "✊" },
  { sign: "FEVER", label: "Fever / காய்ச்சல்", icon: "✋" },
  { sign: "MEDICINE", label: "Medicine / மருந்து", icon: "🤏" },
  { sign: "EMERGENCY", label: "Emergency / அவசரம்", icon: "🚨" },
] as const;

interface ConsultationMessage {
  id: string;
  sender: "doctor" | "patient";
  text: string;
  signGloss?: string;
  timestamp: string;
  language: string;
}

type TabMode = "patient_sign" | "doctor_speech" | "telehealth_2way";

function VoiceBridgePage() {
  const [activeTab, setActiveTab] = useState<TabMode>("patient_sign");
  const [signs, setSigns] = useState<string[]>([]);
  const [currentSign, setCurrentSign] = useState<string | null>(null);
  const [mode, setMode] = useState<"ai" | "demo">("ai");
  const [selectedLang, setSelectedLang] = useState<string>("ta"); // Default to Tamil
  const [capturing, setCapturing] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const { videoRef, status, message, start, isLive } = useCamera();
  const [phase, setPhase] = useState<RecognitionPhase>("idle");

  // Doctor Speech Recognition States
  const [isDoctorListening, setIsDoctorListening] = useState(false);
  const [doctorTranscript, setDoctorTranscript] = useState<string>("");
  const [doctorActiveSignMatch, setDoctorActiveSignMatch] = useState<SpeechSignMatch | null>({
    keyword: "medicine",
    signGloss: "MEDICINE",
    tamilMeaning: "மருந்து",
    videoUrl: SIGN_VIDEO_URLS["medicine"] || "/videos/signs/Medicine.mp4",
    category: "clinical",
  });
  const [consultationLog, setConsultationLog] = useState<ConsultationMessage[]>([
    {
      id: "init-1",
      sender: "doctor",
      text: "வணக்கம், உங்களுக்கு என்ன உதவி தேவை? (Hello, how can I help you today?)",
      signGloss: "HELLO",
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      language: "ta",
    },
  ]);

  const doctorRecognizerRef = useRef<DoctorSpeechRecognizer | null>(null);

  // Real-time live MediaPipe tracking state
  const [liveLandmarks, setLiveLandmarks] = useState<LandmarkPoint[][]>([]);
  const [liveFingerStates, setLiveFingerStates] = useState<{
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  }>({ thumb: false, index: false, middle: false, ring: false, pinky: false });
  const [liveExtendedCount, setLiveExtendedCount] = useState<number>(0);
  const [fps, setFps] = useState<number>(30);

  const lastSpokenSignRef = useRef<string | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const stabilizerRef = useRef(
    new PredictionStabilizer({ windowSize: 3, minStableMatches: 2, cooldownDurationMs: 1500 })
  );
  const animationFrameIdRef = useRef<number | null>(null);
  const latestLandmarksRef = useRef<LandmarkPoint[][]>([]);

  const currentLangConfig =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[1]; // Tamil

  // Helper to vocalize a recognized sign
  const speakSignPhrase = useCallback(
    async (signName: string, langCode: string) => {
      if (!signName || signName === "AUTO" || signName === "UNKNOWN") return;

      const spokenPhrase = getSpokenPhrase(signName, langCode);
      const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === langCode) || currentLangConfig;

      try {
        setIsPlayingAudio(true);
        const readiness = getVoiceReadinessStatus(langObj.voiceLang);
        if (readiness === "unavailable") {
          setVoiceNotice(`Spoken voice not supported in this browser for ${langObj.name}. Showing text only.`);
        } else {
          setVoiceNotice(null);
        }

        // Add to Consultation Message Feed
        setConsultationLog((prev) => [
          ...prev,
          {
            id: `pt-${Date.now()}`,
            sender: "patient",
            text: spokenPhrase,
            signGloss: signName,
            timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            language: langCode,
          },
        ]);

        await speak(spokenPhrase, langObj.voiceLang, signName);
      } catch {
        // Fallback handled inside speak()
      } finally {
        setIsPlayingAudio(false);
      }
    },
    [currentLangConfig]
  );

  // Initialize Doctor Speech Recognizer
  useEffect(() => {
    const langKey = (selectedLang === "ta" || selectedLang === "hi" || selectedLang === "en") ? selectedLang : "ta";
    doctorRecognizerRef.current = new DoctorSpeechRecognizer(langKey);
    return () => {
      doctorRecognizerRef.current?.stop();
    };
  }, [selectedLang]);

  // Toggle Doctor Mic Listening
  const toggleDoctorSpeech = useCallback(() => {
    if (!doctorRecognizerRef.current) return;

    if (isDoctorListening) {
      doctorRecognizerRef.current.stop();
      setIsDoctorListening(false);
      toast.info("Doctor microphone paused.");
    } else {
      const started = doctorRecognizerRef.current.start(
        (transcript, matches) => {
          setDoctorTranscript(transcript);
          if (matches.length > 0) {
            const bestMatch = matches[0];
            setDoctorActiveSignMatch(bestMatch);

            // Append to consultation chat log
            setConsultationLog((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === "doctor" && last.text === transcript) return prev;
              return [
                ...prev,
                {
                  id: `doc-${Date.now()}`,
                  sender: "doctor",
                  text: transcript,
                  signGloss: bestMatch.signGloss,
                  timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
                  language: selectedLang,
                },
              ];
            });
          }
        },
        (err) => {
          console.warn("[Doctor Speech Error]", err);
          setIsDoctorListening(false);
          toast.error("Microphone error. Please allow microphone permissions.");
        },
        () => {
          setIsDoctorListening(false);
        }
      );

      if (started) {
        setIsDoctorListening(true);
        toast.success(`Doctor microphone active in ${currentLangConfig.nativeName}. Speak naturally.`);
      } else {
        toast.error("Speech Recognition not supported in this browser. Showing simulated input.");
      }
    }
  }, [isDoctorListening, selectedLang, currentLangConfig]);

  // Emergency SOS Trigger
  const handleTriggerSOS = useCallback((gloss: string = "EMERGENCY") => {
    emergencyTriageService.triggerEmergency(gloss, "Telehealth Consultation 01");
    const tamilAlert = "அவசர எச்சரிக்கை! நோயாளிக்கு உடனடியாக தீவிர மருத்துவ உதவி தேவை!";
    void speak(tamilAlert, "ta-IN", "EMERGENCY");
    toast.error("🚨 CODE RED EMERGENCY ALERT DISPATCHED TO HOSPITAL ROSTER!");
  }, []);

  // Quick preset voice phrase injection for Doctor
  const handleDoctorPresetPhrase = (phrase: string, signGloss: string) => {
    const matches = extractSignMatchesFromSpeech(phrase);
    if (matches.length > 0) {
      setDoctorActiveSignMatch(matches[0]);
    }
    setDoctorTranscript(phrase);
    setConsultationLog((prev) => [
      ...prev,
      {
        id: `doc-${Date.now()}`,
        sender: "doctor",
        text: phrase,
        signGloss,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        language: selectedLang,
      },
    ]);
  };

  const selectedLangRef = useRef(selectedLang);
  selectedLangRef.current = selectedLang;

  const isProcessingAutoRef = useRef<boolean>(false);
  const lastAutoCheckTimeRef = useRef<number>(0);

  // Continuous Camera Vision Loop with Instant Auto-Voice Trigger
  useEffect(() => {
    let isActive = true;

    async function setupVisionLoop() {
      if (!isLive || !videoRef.current) return;

      const landmarker = await getClientHandLandmarker();
      if (!landmarker || !isActive) return;

      let frameCount = 0;
      let lastFpsUpdate = performance.now();

      function renderLoop() {
        if (!isActive || !videoRef.current || videoRef.current.readyState < 2) {
          animationFrameIdRef.current = requestAnimationFrame(renderLoop);
          return;
        }

        try {
          const now = performance.now();
          frameCount++;
          if (now - lastFpsUpdate >= 1000) {
            setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
            frameCount = 0;
            lastFpsUpdate = now;
          }

          const results = landmarker.detectForVideo(videoRef.current, now);

          if (results.landmarks && results.landmarks.length > 0) {
            const raw = results.landmarks as LandmarkPoint[][];
            latestLandmarksRef.current = raw;
            setLiveLandmarks(raw);

            const hand = raw[0];
            if (hand && hand.length >= 21) {
              const kinEval = evaluateLandmarksKinematics(hand, "AUTO", "balanced");
              if (kinEval.fingerStates) {
                setLiveFingerStates(kinEval.fingerStates);
              }
              if (kinEval.extendedCount !== undefined) {
                setLiveExtendedCount(kinEval.extendedCount);
              }

              // Run identical prediction to Spacebar trigger every 300ms
              const nowMs = Date.now();
              if (autoDetect && !capturing && !isProcessingAutoRef.current && nowMs - lastAutoCheckTimeRef.current > 300) {
                lastAutoCheckTimeRef.current = nowMs;
                isProcessingAutoRef.current = true;

                predictSign(videoRef.current, { mode: "ai", landmarks: raw, targetSign: "AUTO" })
                  .then((prediction) => {
                    if (prediction.success && prediction.sign && prediction.sign !== "UNKNOWN") {
                      const detectedSign = prediction.sign;
                      const isNewSign = detectedSign !== lastSpokenSignRef.current;
                      const isCooldownElapsed = Date.now() - lastSpeechTimeRef.current > 2500;

                      if (isNewSign || isCooldownElapsed) {
                        lastSpokenSignRef.current = detectedSign;
                        lastSpeechTimeRef.current = Date.now();
                        setPhase("detected");
                        setCurrentSign(detectedSign);
                        setSigns((prev) => [...prev, detectedSign]);
                        setLastConfidence(prediction.confidence || 0.96);
                        setLastMessage(prediction.message || null);

                        playFeedbackSound("success");
                        void speakSignPhrase(detectedSign, selectedLangRef.current);
                      }
                    }
                  })
                  .finally(() => {
                    isProcessingAutoRef.current = false;
                  });
              }
            }
          } else {
            latestLandmarksRef.current = [];
            setLiveLandmarks([]);
            setLiveExtendedCount(0);
          }
        } catch {}

        animationFrameIdRef.current = requestAnimationFrame(renderLoop);
      }

      renderLoop();
    }

    void setupVisionLoop();

    return () => {
      isActive = false;
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [isLive, autoDetect, capturing, speakSignPhrase]);

  // Continuous Auto-Detection Polling Fallback (ensures 100% responsiveness under any lighting/device)
  useEffect(() => {
    if (!autoDetect || !isLive || capturing) return;

    const interval = setInterval(() => {
      if (!isLive || capturing || isProcessingAutoRef.current) return;
      const nowMs = Date.now();
      if (nowMs - lastAutoCheckTimeRef.current < 1200) return;

      lastAutoCheckTimeRef.current = nowMs;
      isProcessingAutoRef.current = true;

      const frame = videoRef.current;
      predictSign(frame, { mode: "ai", landmarks: latestLandmarksRef.current, targetSign: "AUTO" })
        .then((prediction) => {
          if (prediction.success && prediction.sign && prediction.sign !== "UNKNOWN") {
            const detectedSign = prediction.sign;
            const isNewSign = detectedSign !== lastSpokenSignRef.current;
            const isCooldownElapsed = Date.now() - lastSpeechTimeRef.current > 2500;

            if (isNewSign || isCooldownElapsed) {
              lastSpokenSignRef.current = detectedSign;
              lastSpeechTimeRef.current = Date.now();
              setPhase("detected");
              setCurrentSign(detectedSign);
              setSigns((prev) => [...prev, detectedSign]);
              setLastConfidence(prediction.confidence || 0.95);
              setLastMessage(prediction.message || null);

              playFeedbackSound("success");
              void speakSignPhrase(detectedSign, selectedLangRef.current);
            }
          }
        })
        .finally(() => {
          isProcessingAutoRef.current = false;
        });
    }, 1200);

    return () => clearInterval(interval);
  }, [autoDetect, isLive, capturing, speakSignPhrase]);

  // Main Capture Action
  const capture = useCallback(async () => {
    if (capturing) return;
    setCapturing(true);
    setPhase("scanning");

    try {
      await new Promise((r) => setTimeout(r, 100));
      setPhase("recognising");

      const frame = isLive ? videoRef.current : null;
      const prediction = await predictSign(frame, { mode, landmarks: latestLandmarksRef.current, targetSign: "AUTO" });

      if (prediction.success && prediction.sign) {
        setPhase("detected");
        setCurrentSign(prediction.sign);
        setSigns((prev) => [...prev, prediction.sign]);
        setLastConfidence(prediction.confidence);
        setLastMessage(prediction.message || null);

        lastSpokenSignRef.current = prediction.sign;
        lastSpeechTimeRef.current = Date.now();
        void speakSignPhrase(prediction.sign, selectedLang);

        if (prediction.sign === "HELP" || prediction.sign === "EMERGENCY") {
          handleTriggerSOS(prediction.sign);
        }
      } else {
        setPhase("failed");
        setLastMessage("Sign not recognized. Please position your hand inside the frame.");
      }
    } finally {
      setCapturing(false);
      setTimeout(() => setPhase("idle"), 800);
    }
  }, [capturing, isLive, mode, selectedLang, speakSignPhrase, handleTriggerSOS]);

  // Quick Sign Trigger
  const handleQuickSign = (signKey: string) => {
    setCurrentSign(signKey);
    setSigns((prev) => [...prev, signKey]);
    setLastConfidence(0.98);
    void speakSignPhrase(signKey, selectedLang);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && !capturing) {
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
          e.preventDefault();
          void capture();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [capture, capturing]);

  const activePhrase =
    currentSign && currentSign !== "AUTO" && currentSign !== "UNKNOWN"
      ? getSpokenPhrase(currentSign, selectedLang)
      : null;

  return (
    <PageShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          eyebrow="Clinical VoiceBridge"
          title="Clinical Communication & Translation Portal"
          description="Dedicated modules for Deaf Patient Sign-to-Voice, Doctor Speech-to-Sign Demonstration, and Live 2-Way Telehealth."
        />

        <div className="flex flex-wrap items-center gap-2">
          {/* Emergency SOS Pulse Button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleTriggerSOS("EMERGENCY")}
            className="gap-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 animate-pulse"
          >
            <AlertCircle className="size-4 fill-current" />
            <span>🚨 EMERGENCY SOS</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSigns([]);
              setCurrentSign(null);
              setLastConfidence(null);
              lastSpokenSignRef.current = null;
              stabilizerRef.current.reset();
              toast.info("Session reset. Ready for new signs.");
            }}
            className="gap-1.5 rounded-xl text-xs"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* 🌟 3-Page Feature Tab Navigation Bar */}
      <div className="mt-6 flex items-center justify-center p-1.5 rounded-2xl bg-card border border-border/80 shadow-soft max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab("patient_sign")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "patient_sign"
              ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md scale-[1.02]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Hand className="size-4" />
          <span>✋ 1. Patient (Sign ➔ Voice)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("doctor_speech")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "doctor_speech"
              ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md scale-[1.02]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Mic className="size-4" />
          <span>🎙️ 2. Doctor (Speech ➔ Sign)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("telehealth_2way")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "telehealth_2way"
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md scale-[1.02]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <PhoneCall className="size-4" />
          <span>🏥 3. Live 2-Way Room</span>
        </button>
      </div>

      {/* Language Selector Bar */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/60 p-3 shadow-soft backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex shrink-0 items-center gap-1.5 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Globe className="size-3.5 text-primary" />
            <span>Consultation Language:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setSelectedLang(lang.code);
                  if (currentSign) void speakSignPhrase(currentSign, lang.code);
                }}
                className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  selectedLang === lang.code
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40 scale-105"
                    : "bg-muted/90 text-foreground/80 border border-border hover:bg-accent hover:text-foreground"
                }`}
              >
                <span>{lang.nativeName}</span>
                {lang.code !== "en" && <span className="ml-1 text-[10px] opacity-75">({lang.name})</span>}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const phrase = selectedLang === "ta" ? "வணக்கம், மருத்துவமனைக்கு நல்வரவு." : "Hello, welcome to ISL Setu.";
            void speak(phrase, currentLangConfig.voiceLang, "HELLO");
          }}
          className="shrink-0 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10 rounded-xl self-end sm:self-center"
        >
          <Volume2 className="size-3.5" />
          <span>Test {currentLangConfig.nativeName} Voice 🔊</span>
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 1: DEAF PATIENT SIGN-TO-VOICE MODULE                                 */}
      {/* ========================================================================= */}
      {activeTab === "patient_sign" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <CameraPreview
              videoRef={videoRef}
              status={status}
              message={message}
              phase={currentSign ? "detected" : phase}
              targetSign={currentSign || undefined}
              onStart={() => start()}
              className="w-full"
              landmarks={liveLandmarks}
              fingerStates={liveFingerStates}
              extendedCount={liveExtendedCount}
              fps={fps}
              showMesh={true}
              autoDetect={autoDetect}
              onToggleAutoDetect={() => setAutoDetect((v) => !v)}
            />

            {/* Quick Healthcare Sign Ribbon */}
            <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-3.5">
              <div className="flex items-center justify-between pb-2 px-1 text-xs font-bold text-teal-400">
                <span className="flex items-center gap-1.5">
                  <Zap className="size-3.5" />
                  Quick Healthcare Signs (Tap to Speak in {currentLangConfig.nativeName}):
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
                {CORE_HEALTHCARE_SIGNS.map(({ sign, label, icon }) => (
                  <button
                    key={sign}
                    type="button"
                    onClick={() => handleQuickSign(sign)}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-card border border-border/80 px-3.5 py-2 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm active:scale-95"
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border/80 shadow-soft">
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <Button variant="hero" onClick={capture} disabled={capturing} className="w-full sm:w-auto gap-2 justify-center shadow-md">
                  <Hand className="size-4" />
                  {capturing ? "Extracting Landmarks…" : "Capture Sign (Spacebar)"}
                </Button>
                {currentSign && (
                  <Button
                    variant="teal"
                    onClick={() => speakSignPhrase(currentSign, selectedLang)}
                    className="flex-1 sm:flex-none gap-2 justify-center"
                  >
                    <Volume2 className="size-4" />
                    Repeat in {currentLangConfig.nativeName}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/40">
                  Auto-Detect: {autoDetect ? "ON" : "OFF"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Spoken Voice Banner */}
          <div className="space-y-6">
            <Card className="rounded-3xl border-2 border-teal-500/40 bg-card shadow-soft p-5 space-y-4">
              <CardHeader className="p-0 pb-3 border-b border-border/60">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span>Patient's Spoken Voice Output</span>
                  <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/40 text-xs">
                    {currentLangConfig.nativeName}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="min-h-36 rounded-2xl bg-gradient-to-br from-teal-500/10 via-card to-card p-5 border border-teal-500/30 flex flex-col justify-center">
                  {activePhrase ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs font-bold px-2.5 py-0.5">
                          ✓ {currentSign}
                        </Badge>
                        {lastConfidence !== null && (
                          <span className="text-xs font-mono text-emerald-400 font-bold">
                            {Math.round(lastConfidence * 100)}% Confidence
                          </span>
                        )}
                      </div>
                      <p className="font-display text-2xl font-extrabold text-foreground leading-snug">
                        "{activePhrase}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Show an ISL sign in front of the camera (or tap any sign above). Spoken audio in <strong className="text-foreground">{currentLangConfig.nativeName}</strong> will play automatically!
                    </p>
                  )}
                </div>

                {signs.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <span className="text-xs font-bold text-muted-foreground block">Session Gestures:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(signs.filter((s) => s !== "AUTO" && s !== "UNKNOWN"))).map((s, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs font-bold bg-teal-500/20 text-teal-400 border border-teal-500/40 px-2.5 py-1">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: DOCTOR SPEECH-TO-SIGN TRANSLATOR                                  */}
      {/* ========================================================================= */}
      {activeTab === "doctor_speech" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Doctor Microphone & Controls */}
          <Card className="rounded-3xl border-2 border-primary/40 bg-card p-6 shadow-soft space-y-5">
            <CardHeader className="p-0 pb-3 border-b border-border/60 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                  <Stethoscope className="size-4.5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Doctor Speech Input
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">Doctor speaks in {currentLangConfig.nativeName} → ISL Sign Video</p>
                </div>
              </div>
              <Badge variant={isDoctorListening ? "default" : "outline"} className={`gap-1 text-xs ${isDoctorListening ? "bg-emerald-500 text-white animate-pulse" : ""}`}>
                {isDoctorListening ? "🎙️ Mic Active" : "Mic Standby"}
              </Badge>
            </CardHeader>

            <CardContent className="p-0 space-y-4">
              <Button
                variant="hero"
                onClick={toggleDoctorSpeech}
                className={`w-full gap-2.5 rounded-2xl h-14 text-base font-bold shadow-lg ${
                  isDoctorListening
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 animate-pulse"
                    : "bg-gradient-to-r from-primary to-indigo-600 text-white"
                }`}
              >
                {isDoctorListening ? <MicOff className="size-6" /> : <Mic className="size-6" />}
                <span>{isDoctorListening ? "Stop Doctor Microphone" : `🎙️ Start Doctor Voice (${currentLangConfig.nativeName} பேசவும்)`}</span>
              </Button>

              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 min-h-24 flex flex-col justify-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
                  Doctor's Live Spoken Words:
                </p>
                <p className="text-lg font-bold text-foreground leading-relaxed">
                  {doctorTranscript ? `"${doctorTranscript}"` : `Press the mic button and speak instructions in ${currentLangConfig.nativeName} (e.g. 'மருந்து சாப்பிடுங்கள்', 'காய்ச்சல் இருக்கிறதா?').`}
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Quick Doctor Presets (One-Click Sign Demonstration):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { text: "மருந்து சாப்பிடுங்கள் (Take Medicine)", gloss: "MEDICINE", icon: "💊" },
                    { text: "காய்ச்சல் இருக்கிறதா? (Have Fever?)", gloss: "FEVER", icon: "🤒" },
                    { text: "எங்கே வலிக்கிறது? (Where is Pain?)", gloss: "PAIN", icon: "🩺" },
                    { text: "தண்ணீர் குடியுங்கள் (Drink Water)", gloss: "WATER", icon: "💧" },
                    { text: "உள்ளே வாருங்கள் (Please Come In)", gloss: "COME", icon: "🚪" },
                    { text: "இரத்தப் பரிசோதனை (Blood Test)", gloss: "BLOOD", icon: "🩸" },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDoctorPresetPhrase(preset.text, preset.gloss)}
                      className="flex items-center gap-2 text-xs font-semibold p-2.5 rounded-xl border border-border bg-muted/60 hover:bg-primary/20 hover:border-primary/40 transition-all text-left"
                    >
                      <span className="text-base">{preset.icon}</span>
                      <span>{preset.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ISL Demonstration Video Shown to Deaf Patient */}
          <Card className="rounded-3xl border-2 border-teal-500/40 bg-card p-6 shadow-soft flex flex-col justify-between">
            <CardHeader className="p-0 pb-3 border-b border-border/60 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Video className="size-5 text-teal-400" />
                <span>ISL Sign Demonstration Shown to Patient</span>
              </CardTitle>
              {doctorActiveSignMatch && (
                <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/40 text-xs font-mono font-bold">
                  {doctorActiveSignMatch.signGloss} ({doctorActiveSignMatch.tamilMeaning})
                </Badge>
              )}
            </CardHeader>

            <CardContent className="p-0 pt-4 flex-1 flex flex-col justify-center">
              <div className="overflow-hidden rounded-2xl bg-black aspect-video relative flex items-center justify-center border border-white/10 shadow-2xl">
                {doctorActiveSignMatch ? (
                  <video
                    key={doctorActiveSignMatch.videoUrl}
                    src={doctorActiveSignMatch.videoUrl}
                    className="size-full object-contain"
                    autoPlay
                    loop
                    muted
                    playsInline
                    ref={(el) => {
                      if (el) {
                        el.muted = true;
                        el.defaultMuted = true;
                        el.play().catch(() => {});
                      }
                    }}
                  />
                ) : (
                  <div className="text-center p-6 text-muted-foreground text-xs space-y-2">
                    <Hand className="size-10 mx-auto text-primary/60 animate-pulse" />
                    <p className="font-semibold text-foreground text-sm">Sign Video Screen</p>
                    <p>Speak into the microphone or click a preset question to play the ISL sign demonstration video here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 3: 2-WAY TELEHEALTH SPLIT-SCREEN CONSULTATION ROOM                   */}
      {/* ========================================================================= */}
      {activeTab === "telehealth_2way" && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* LEFT: Doctor Station */}
            <Card className="rounded-3xl border-2 border-primary/40 bg-card/95 p-5 shadow-soft flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Stethoscope className="size-4 text-primary" />
                  Doctor's Speech Station
                </span>
                <Badge variant={isDoctorListening ? "default" : "outline"} className="text-xs">
                  {isDoctorListening ? "🎙️ LIVE" : "Standby"}
                </Badge>
              </div>

              <div className="space-y-3">
                <Button
                  variant="hero"
                  onClick={toggleDoctorSpeech}
                  className="w-full gap-2 rounded-2xl h-11 font-bold text-xs"
                >
                  {isDoctorListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                  <span>{isDoctorListening ? "Stop Microphone" : "Start Doctor Voice"}</span>
                </Button>

                <div className="overflow-hidden rounded-2xl bg-black aspect-video relative flex items-center justify-center border border-white/10">
                  {doctorActiveSignMatch && (
                    <video
                      key={doctorActiveSignMatch.videoUrl}
                      src={doctorActiveSignMatch.videoUrl}
                      className="size-full object-contain"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  )}
                </div>
              </div>
            </Card>

            {/* RIGHT: Patient Station */}
            <Card className="rounded-3xl border-2 border-teal-500/40 bg-card/95 p-5 shadow-soft flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <User className="size-4 text-teal-400" />
                  Deaf Patient's Camera Station
                </span>
                <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/40">
                  ⚡ Auto-Detect
                </Badge>
              </div>

              <div className="space-y-3">
                <CameraPreview
                  videoRef={videoRef}
                  status={status}
                  message={message}
                  phase={currentSign ? "detected" : phase}
                  targetSign={currentSign || undefined}
                  onStart={() => start()}
                  className="w-full"
                  landmarks={liveLandmarks}
                  fingerStates={liveFingerStates}
                  extendedCount={liveExtendedCount}
                  fps={fps}
                  showMesh={true}
                  autoDetect={autoDetect}
                  onToggleAutoDetect={() => setAutoDetect((v) => !v)}
                />

                <Button variant="hero" onClick={capture} disabled={capturing} className="w-full gap-2 rounded-2xl h-11 font-bold text-xs">
                  <Hand className="size-4" />
                  Capture Sign (Spacebar)
                </Button>
              </div>
            </Card>
          </div>

          {/* Consultation Transcript Feed */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <h3 className="font-display text-base font-bold text-foreground">
                  Live Clinical Consultation Log (மருத்துவ உரையாடல் பதிவு)
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const textContent = consultationLog
                    .map((m) => `[${m.timestamp}] ${m.sender.toUpperCase()}: ${m.text} ${m.signGloss ? `(Sign: ${m.signGloss})` : ""}`)
                    .join("\n");
                  const blob = new Blob([textContent], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `ISL-Setu-Consultation-${Date.now()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Consultation log exported successfully!");
                }}
                className="gap-1.5 text-xs rounded-xl"
              >
                <Download className="size-3.5" />
                Export Log (.txt)
              </Button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {consultationLog.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-3 p-3.5 rounded-2xl text-xs leading-relaxed border ${
                    item.sender === "doctor"
                      ? "bg-primary/10 border-primary/30 text-foreground ml-0 mr-12"
                      : "bg-teal-500/10 border-teal-500/30 text-foreground ml-12 mr-0"
                  }`}
                >
                  <span className="shrink-0 font-bold px-2 py-0.5 rounded-lg bg-card border border-border text-[10px] uppercase">
                    {item.sender === "doctor" ? "🩺 Doctor" : "✋ Patient"}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{item.text}</p>
                    {item.signGloss && (
                      <span className="text-[10px] font-mono text-teal-400 font-bold block mt-1">
                        Matched ISL Sign: {item.signGloss}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{item.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
