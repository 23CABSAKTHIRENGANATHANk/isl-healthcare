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
import { SIGN_VIDEO_URLS } from "@/config/video-mapping";
import { useCamera } from "@/hooks/use-camera";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { PredictionStabilizer } from "@/services/predictionStabilizer.service";
import { toast } from "sonner";

export const Route = createFileRoute("/voicebridge")({
  head: () => ({
    meta: [
      { title: "VoiceBridge — 2-Way Doctor-Patient Clinical Translator | ISL Setu" },
      {
        name: "description",
        content:
          "2-Way Healthcare Translation: Convert Indian Sign Language into natural spoken voice and convert doctor speech into verified ISL sign videos in real-time.",
      },
      { property: "og:title", content: "VoiceBridge — 2-Way Doctor-Patient Clinical Translator" },
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

type BridgeViewMode = "telehealth_2way" | "sign_to_voice" | "voice_to_sign";

function VoiceBridgePage() {
  const [bridgeMode, setBridgeMode] = useState<BridgeViewMode>("telehealth_2way");
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
  const [doctorActiveSignMatch, setDoctorActiveSignMatch] = useState<SpeechSignMatch | null>(null);
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
  const lastVideoTimestampRef = useRef<number>(0);
  const stabilizerRef = useRef(
    new PredictionStabilizer({ windowSize: 5, minStableMatches: 3, cooldownDurationMs: 1200 })
  );
  const animationFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const latestLandmarksRef = useRef<LandmarkPoint[][]>([]);

  const currentLangConfig =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

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

  // Continuous Camera Vision Loop
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

            // Auto-detect gesture trigger
            if (autoDetect && !capturing) {
              const currentTime = Date.now();
              if (currentTime - lastSpeechTimeRef.current > 1500) {
                void predictSign(videoRef.current, { mode, landmarks: raw }).then((prediction) => {
                  if (prediction.success && prediction.sign && prediction.confidence >= 0.85) {
                    const stabilized = stabilizerRef.current.add(prediction.sign, prediction.confidence);
                    if (stabilized) {
                      setCurrentSign(stabilized);
                      setSigns((prev) => [...prev, stabilized]);
                      setLastConfidence(prediction.confidence);
                      lastSpokenSignRef.current = stabilized;
                      lastSpeechTimeRef.current = Date.now();
                      void speakSignPhrase(stabilized, selectedLang);
                    }
                  }
                });
              }
            }
          } else {
            latestLandmarksRef.current = [];
            setLiveLandmarks([]);
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
  }, [isLive, autoDetect, capturing, mode, selectedLang, speakSignPhrase]);

  // Main Capture Action
  const capture = useCallback(async () => {
    if (capturing) return;
    setCapturing(true);
    setPhase("scanning");

    try {
      await new Promise((r) => setTimeout(r, 100));
      setPhase("recognising");

      const frame = isLive ? videoRef.current : null;
      const prediction = await predictSign(frame, { mode, landmarks: latestLandmarksRef.current });

      if (prediction.success && prediction.sign) {
        setPhase("detected");
        setCurrentSign(prediction.sign);
        setSigns((prev) => [...prev, prediction.sign]);
        setLastConfidence(prediction.confidence);
        setLastMessage(prediction.message || null);

        lastSpokenSignRef.current = prediction.sign;
        lastSpeechTimeRef.current = Date.now();
        void speakSignPhrase(prediction.sign, selectedLang);
      } else {
        setPhase("failed");
        setLastMessage("Sign not recognized. Please position your hand inside the frame.");
      }
    } finally {
      setCapturing(false);
      setTimeout(() => setPhase("idle"), 800);
    }
  }, [capturing, isLive, mode, selectedLang, speakSignPhrase]);

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
          eyebrow="Clinical Telehealth Bridge"
          title="2-Way Doctor ⇄ Deaf Patient Communication"
          description="Interactive bidirectional translation: Doctor speaks in Tamil/English/Hindi → Instant ISL Sign Video for patient. Patient signs on camera → Instant Multilingual Voice for doctor."
        />

        {/* Bridge Mode Switcher */}
        <div className="flex items-center justify-center sm:justify-start gap-1.5 rounded-2xl border border-border/80 bg-card p-1.5 shadow-soft w-full sm:w-auto">
          <Button
            size="sm"
            variant={bridgeMode === "telehealth_2way" ? "hero" : "ghost"}
            onClick={() => setBridgeMode("telehealth_2way")}
            className="flex-1 sm:flex-none rounded-xl text-xs font-bold gap-1.5"
          >
            <PhoneCall className="size-3.5" />
            2-Way Telehealth
          </Button>
          <Button
            size="sm"
            variant={bridgeMode === "sign_to_voice" ? "hero" : "ghost"}
            onClick={() => setBridgeMode("sign_to_voice")}
            className="flex-1 sm:flex-none rounded-xl text-xs font-semibold gap-1.5"
          >
            <Hand className="size-3.5" />
            Sign ➔ Voice
          </Button>
          <Button
            size="sm"
            variant={bridgeMode === "voice_to_sign" ? "hero" : "ghost"}
            onClick={() => setBridgeMode("voice_to_sign")}
            className="flex-1 sm:flex-none rounded-xl text-xs font-semibold gap-1.5"
          >
            <Mic className="size-3.5" />
            Doctor ➔ Sign
          </Button>
        </div>
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

      {/* Main 2-Way Telehealth Consultation Grid */}
      {bridgeMode === "telehealth_2way" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* LEFT PANEL: Doctor Consultation Station */}
          <Card className="rounded-3xl border-2 border-primary/40 bg-card/95 shadow-soft flex flex-col justify-between overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 bg-primary/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                  <Stethoscope className="size-4.5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Doctor's Station (Speech ➔ Sign)
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">Doctor speaks → Video shown to deaf patient</p>
                </div>
              </div>
              <Badge variant={isDoctorListening ? "default" : "outline"} className={`gap-1 text-xs ${isDoctorListening ? "bg-emerald-500 text-white animate-pulse" : ""}`}>
                {isDoctorListening ? "🎙️ Doctor Mic LIVE" : "Mic Standby"}
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
              {/* Doctor Speech Input Controls */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="hero"
                    onClick={toggleDoctorSpeech}
                    className={`flex-1 gap-2.5 rounded-2xl h-12 font-bold shadow-md ${
                      isDoctorListening
                        ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25"
                        : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 text-white"
                    }`}
                  >
                    {isDoctorListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                    <span>{isDoctorListening ? "Stop Doctor Microphone" : "🎙️ Start Doctor Voice (பேசத் தொடங்கவும்)"}</span>
                  </Button>
                </div>

                {/* Doctor Spoken Transcript Card */}
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5 min-h-20 flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
                    Doctor's Spoken Words:
                  </p>
                  <p className="text-base font-bold text-foreground leading-relaxed">
                    {doctorTranscript ? `"${doctorTranscript}"` : "Press Start Microphone and speak clinical instructions (e.g. 'மருந்து சாப்பிடுங்கள்', 'எங்கே வலிக்கிறது?')."}
                  </p>
                </div>

                {/* Doctor Quick Clinical Presets */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Quick Clinical Questions:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { text: "மருந்து சாப்பிடுங்கள்", gloss: "MEDICINE", icon: "💊" },
                      { text: "காய்ச்சல் இருக்கிறதா?", gloss: "FEVER", icon: "🤒" },
                      { text: "எங்கே வலிக்கிறது?", gloss: "PAIN", icon: "🩺" },
                      { text: "தண்ணீர் குடியுங்கள்", gloss: "WATER", icon: "💧" },
                      { text: "உள்ளே வாருங்கள்", gloss: "COME", icon: "🚪" },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleDoctorPresetPhrase(preset.text, preset.gloss)}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-border bg-muted/60 hover:bg-primary/20 hover:border-primary/40 transition-all"
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Patient Video Display Area (Generated from Doctor Speech) */}
              <div className="space-y-2 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                    <Video className="size-3.5" />
                    ISL Sign Shown to Deaf Patient:
                  </span>
                  {doctorActiveSignMatch && (
                    <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/40 text-xs font-mono font-bold">
                      {doctorActiveSignMatch.signGloss} ({doctorActiveSignMatch.tamilMeaning})
                    </Badge>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl bg-black aspect-video relative flex items-center justify-center border border-white/10 shadow-lg">
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
                    <div className="text-center p-4 text-muted-foreground text-xs space-y-1.5">
                      <Hand className="size-8 mx-auto text-primary/60 animate-pulse" />
                      <p className="font-semibold text-foreground">Sign Demonstration Screen</p>
                      <p>When doctor speaks, matching ISL sign animation will play here.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT PANEL: Deaf Patient Vision & Sign Station */}
          <Card className="rounded-3xl border-2 border-teal-500/40 bg-card/95 shadow-soft flex flex-col justify-between overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 bg-teal-500/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-teal-500 flex items-center justify-center text-white">
                  <User className="size-4.5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Deaf Patient's Station (Sign ➔ Voice)
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">Patient signs → Spoken voice output to doctor</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/40 bg-emerald-500/10">
                ⚡ Auto-Detect Vision LIVE
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
              {/* Patient Camera Stream */}
              <div className="space-y-3">
                <CameraPreview
                  videoRef={videoRef}
                  status={status}
                  message={message}
                  phase={phase}
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

                {/* Patient Capture Action Deck */}
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="hero"
                    onClick={capture}
                    disabled={capturing}
                    className="flex-1 gap-2 rounded-2xl h-11 font-bold shadow-md justify-center"
                  >
                    <Hand className="size-4" />
                    {capturing ? "Recognizing..." : "Capture Sign (Spacebar)"}
                  </Button>
                  {currentSign && (
                    <Button
                      variant="outline"
                      onClick={() => speakSignPhrase(currentSign, selectedLang)}
                      className="gap-1.5 rounded-2xl h-11 border-primary/40 text-primary font-bold text-xs"
                    >
                      <Volume2 className="size-4" />
                      Repeat Voice
                    </Button>
                  )}
                </div>
              </div>

              {/* Patient Recognized Sign Output Banner */}
              <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4 min-h-24 flex flex-col justify-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal-400 mb-1">
                  Patient's Spoken Output to Doctor ({currentLangConfig.nativeName}):
                </p>
                {activePhrase ? (
                  <div>
                    <p className="text-xl font-extrabold text-white leading-snug">
                      "{activePhrase}"
                    </p>
                    <p className="text-xs text-teal-300 font-mono mt-1 font-bold">
                      ✓ Sign Verified: {currentSign} ({Math.round((lastConfidence || 0.95) * 100)}% Confidence)
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Patient signs (e.g. Help, Doctor, Pain, Water) will be translated and spoken in <strong className="text-foreground">{currentLangConfig.nativeName}</strong>.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Standalone Sign to Voice & Voice to Sign Views */
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <CameraPreview
              videoRef={videoRef}
              status={status}
              message={message}
              phase={phase}
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
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border/80 shadow-soft">
              <Button variant="hero" onClick={capture} disabled={capturing} className="gap-2 rounded-xl">
                <Hand className="size-4" />
                {capturing ? "Extracting Landmarks…" : "Capture Sign (Space)"}
              </Button>
              {currentSign && (
                <Button variant="teal" onClick={() => speakSignPhrase(currentSign, selectedLang)} className="gap-2 rounded-xl">
                  <Volume2 className="size-4" />
                  Repeat in {currentLangConfig.nativeName}
                </Button>
              )}
            </div>
          </div>

          <div>
            <Card className="rounded-3xl border-border/70 shadow-soft p-5 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Active Spoken Phrase</p>
              <p className="text-2xl font-extrabold text-foreground">"{activePhrase || 'Ready for sign input'}"</p>
            </Card>
          </div>
        </div>
      )}

      {/* Live Consultation Transcript Feed */}
      <div className="mt-8 rounded-3xl border border-border/80 bg-card/90 p-6 shadow-soft space-y-4">
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
    </PageShell>
  );
}
