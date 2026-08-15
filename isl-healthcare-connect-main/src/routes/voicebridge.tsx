import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Cpu,
  Globe,
  Hand,
  RotateCcw,
  Sparkles,
  Square,
  Trash2,
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
  getClientHandLandmarker,
  type LandmarkPoint,
} from "@/services/ai.service";
import { useCamera } from "@/hooks/use-camera";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { PredictionStabilizer } from "@/services/predictionStabilizer.service";

export const Route = createFileRoute("/voicebridge")({
  head: () => ({
    meta: [
      { title: "VoiceBridge — Multilingual Sign to Speech | ISL Setu" },
      {
        name: "description",
        content:
          "Convert Indian Sign Language into clear text and natural spoken voice in English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali and Marathi.",
      },
      { property: "og:title", content: "VoiceBridge — Multilingual Sign to Speech" },
      {
        property: "og:description",
        content: "Sign-to-text-to-voice communication bridge for hospital consultations.",
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

function VoiceBridgePage() {
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
  const stabilizerRef = useRef(new PredictionStabilizer({ windowSize: 5, minStableMatches: 3, cooldownDurationMs: 1200 }));
  const animationFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const latestLandmarksRef = useRef<LandmarkPoint[][]>([]);

  const currentLangConfig =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  // Helper to vocalize a recognized sign
  const speakSignPhrase = useCallback((signName: string, langCode: string) => {
    if (!signName || signName === "AUTO" || signName === "UNKNOWN") return;

    const spokenPhrase = getSpokenPhrase(signName, langCode);
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === langCode) || currentLangConfig;
    
    setIsPlayingAudio(true);
    const speechResult = speak(spokenPhrase, langObj.voiceLang, signName);
    if (!speechResult.ok) {
      setVoiceNotice(`Audio notice: ${speechResult.reason || "Audio voice unavailable. Showing text."}`);
    }
    setTimeout(() => setIsPlayingAudio(false), 2200);
  }, [currentLangConfig]);

  // Stop any active speech
  const handleStopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  // Test speaker button
  const handleTestSpeaker = () => {
    speakSignPhrase("DOCTOR", selectedLang);
  };

  // Handle direct quick sign click (Instant clinical tap)
  const handleQuickSign = (signName: string) => {
    if (!signName || signName === "AUTO" || signName === "UNKNOWN") return;
    setCurrentSign(signName);
    setSigns((prev) => [...prev, signName]);
    setLastConfidence(0.96);
    setPhase("detected");
    lastSpokenSignRef.current = signName;
    lastSpeechTimeRef.current = Date.now();
    speakSignPhrase(signName, selectedLang);
    setTimeout(() => setPhase("idle"), 1200);
  };

  // Continuous Real-Time Vision & MediaPipe Loop
  useEffect(() => {
    let isCancelled = false;

    async function visionLoop() {
      if (isCancelled) return;

      const video = videoRef.current;
      if (isLive && video && video.readyState >= 2 && video.videoWidth > 0) {
        try {
          const landmarker = await getClientHandLandmarker();
          if (landmarker && !isCancelled) {
            let timestamp = performance.now();
            if (timestamp <= lastVideoTimestampRef.current) {
              timestamp = lastVideoTimestampRef.current + 1;
            }
            lastVideoTimestampRef.current = timestamp;

            const result = landmarker.detectForVideo(video, timestamp);

            // FPS calculation
            const elapsed = timestamp - lastFrameTimeRef.current;
            if (elapsed >= 1000) {
              setFps(Math.round(1000 / Math.max(1, elapsed)));
              lastFrameTimeRef.current = timestamp;
            }

            if (result && result.landmarks && result.landmarks.length > 0) {
              const rawPoints = result.landmarks[0] as LandmarkPoint[];
              latestLandmarksRef.current = [rawPoints];
              setLiveLandmarks([rawPoints]);

              // Evaluate real-time kinematics
              const pred = await predictSign(video, {
                mode,
                landmarks: [rawPoints],
                targetSign: "AUTO",
              });

              if (pred.fingerStates) {
                setLiveFingerStates(pred.fingerStates);
              }
              if (pred.extendedCount !== undefined) {
                setLiveExtendedCount(pred.extendedCount);
              }

              // Run prediction through temporal stabilizer
              if (autoDetect && pred.success && pred.sign && pred.sign !== "UNKNOWN" && pred.sign !== "AUTO") {
                const stabilized = stabilizerRef.current.processFrame(pred);
                if (stabilized.isStable && stabilized.sign && stabilized.sign !== "AUTO" && stabilized.sign !== "UNKNOWN") {
                  const nowTime = Date.now();

                  // Only speak and append if it is a NEW sign or after hand re-entry
                  if (stabilized.sign !== lastSpokenSignRef.current && (nowTime - lastSpeechTimeRef.current > 1500)) {
                    lastSpokenSignRef.current = stabilized.sign;
                    lastSpeechTimeRef.current = nowTime;
                    setCurrentSign(stabilized.sign);
                    setSigns((prev) => [...prev, stabilized.sign as string]);
                    setLastConfidence(stabilized.confidence);
                    setPhase("detected");
                    speakSignPhrase(stabilized.sign, selectedLang);
                    setTimeout(() => setPhase("idle"), 1200);
                  }
                }
              }
            } else {
              latestLandmarksRef.current = [];
              setLiveLandmarks([]);
              setLiveExtendedCount(0);
              // Reset last spoken sign when hand leaves camera frame
              lastSpokenSignRef.current = null;
            }
          }
        } catch (err) {
          console.warn("[VoiceBridge Vision Loop]", err);
        }
      }

      if (!isCancelled) {
        animationFrameIdRef.current = requestAnimationFrame(visionLoop);
      }
    }

    if (isLive) {
      animationFrameIdRef.current = requestAnimationFrame(visionLoop);
    }

    return () => {
      isCancelled = true;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isLive, videoRef, mode, autoDetect, selectedLang, speakSignPhrase]);

  // Manual / Spacebar Capture function
  const capture = useCallback(async () => {
    if (capturing) return;
    setCapturing(true);
    setLastMessage(null);
    setVoiceNotice(null);

    try {
      setPhase("recognising");

      const video = videoRef.current;
      let currentLandmarks = latestLandmarksRef.current;

      // If landmarks were not caught yet, run an immediate detection on current video frame
      if ((!currentLandmarks || currentLandmarks.length === 0) && video && video.readyState >= 2) {
        try {
          const landmarker = await getClientHandLandmarker();
          if (landmarker) {
            let timestamp = performance.now();
            if (timestamp <= lastVideoTimestampRef.current) {
              timestamp = lastVideoTimestampRef.current + 1;
            }
            lastVideoTimestampRef.current = timestamp;
            const res = landmarker.detectForVideo(video, timestamp);
            if (res && res.landmarks && res.landmarks.length > 0) {
              currentLandmarks = [res.landmarks[0] as LandmarkPoint[]];
              latestLandmarksRef.current = currentLandmarks;
              setLiveLandmarks(currentLandmarks);
            }
          }
        } catch (e) {
          console.warn("[VoiceBridge Direct Capture]", e);
        }
      }

      const prediction = await predictSign(video, {
        mode,
        landmarks: currentLandmarks,
        targetSign: "AUTO",
      });

      if (prediction.success && prediction.sign && prediction.sign !== "UNKNOWN" && prediction.sign !== "AUTO") {
        setCurrentSign(prediction.sign);
        setSigns((words) => [...words, prediction.sign as string]);
        setLastConfidence(prediction.confidence);
        setPhase("detected");

        lastSpokenSignRef.current = prediction.sign;
        lastSpeechTimeRef.current = Date.now();
        speakSignPhrase(prediction.sign, selectedLang);
      } else {
        setPhase("failed");
        setLastMessage(prediction.message || "Sign not recognized. Please position your hand inside the frame.");
        speak("Sign not recognized.", "en-IN");
      }
    } finally {
      setCapturing(false);
      setTimeout(() => setPhase("idle"), 900);
    }
  }, [capturing, isLive, videoRef, mode, selectedLang, speakSignPhrase]);

  // Spacebar & Enter Key Keyboard Shortcut Handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" || e.key === " " || e.code === "Enter") {
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
          e.preventDefault();
          void capture();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [capture]);

  // Active current spoken phrase
  const activePhrase = currentSign && currentSign !== "AUTO" && currentSign !== "UNKNOWN" ? getSpokenPhrase(currentSign, selectedLang) : null;
  const activeEnglishPhrase = currentSign && currentSign !== "AUTO" && currentSign !== "UNKNOWN" ? getSpokenPhrase(currentSign, "en") : null;

  return (
    <PageShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          eyebrow="VoiceBridge • Multilingual"
          title="Sign → Text → Multilingual Voice 🔊"
          description="Live communication bridge for hospital reception, nursing triage, and doctor consultations. Translates ISL signs directly into English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali & Marathi spoken audio."
        />

        {/* Mode Switcher */}
        <div className="flex items-center justify-center sm:justify-start gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-soft w-full sm:w-auto">
          <Button
            size="sm"
            variant={mode === "ai" ? "hero" : "ghost"}
            onClick={() => setMode("ai")}
            className="flex-1 sm:flex-none rounded-xl text-xs font-semibold"
          >
            <Cpu className="size-3.5" aria-hidden="true" />
            AI Mode (MediaPipe)
          </Button>
          <Button
            size="sm"
            variant={mode === "demo" ? "outline" : "ghost"}
            onClick={() => setMode("demo")}
            className="flex-1 sm:flex-none rounded-xl text-xs font-semibold"
          >
            <Bot className="size-3.5" aria-hidden="true" />
            Demo Mode
          </Button>
        </div>
      </div>

      {/* Language Selector Bar (Touch-Scrollable on Mobile) */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/60 p-3 shadow-soft backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex shrink-0 items-center gap-1.5 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Globe className="size-3.5 text-primary" />
            <span>Speech Language:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setSelectedLang(lang.code);
                  if (currentSign && currentSign !== "AUTO" && currentSign !== "UNKNOWN") {
                    speakSignPhrase(currentSign, lang.code);
                  }
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
          onClick={handleTestSpeaker}
          className="shrink-0 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10 rounded-xl self-end sm:self-center"
        >
          <Volume2 className="size-3.5" />
          <span>Test Voice 🔊</span>
        </Button>
      </div>

      {/* Quick Healthcare Sign Ribbon (One-Tap Instant Vocalization) */}
      <div className="mt-4 rounded-2xl border border-teal-500/30 bg-teal-500/5 p-3.5">
        <div className="flex items-center justify-between pb-2 px-1 text-xs font-bold text-teal-400">
          <span className="flex items-center gap-1.5">
            <Zap className="size-3.5" />
            Quick Healthcare Signs (Tap to Speak):
          </span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">Tap sign, press Space, or use live camera</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border/80 shadow-soft">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <Button variant="hero" onClick={capture} disabled={capturing} className="w-full sm:w-auto gap-2 justify-center shadow-md">
                <Hand aria-hidden="true" className="size-4" />
                {capturing ? "Extracting Landmarks…" : "Capture Sign (Space)"}
              </Button>
              {currentSign && currentSign !== "AUTO" && currentSign !== "UNKNOWN" && (
                <Button
                  variant="teal"
                  onClick={() => speakSignPhrase(currentSign, selectedLang)}
                  className="flex-1 sm:flex-none gap-2 justify-center"
                >
                  <Volume2 aria-hidden="true" className="size-4" />
                  Repeat in {currentLangConfig.nativeName}
                </Button>
              )}
              {isPlayingAudio && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleStopSpeech}
                  className="gap-1.5 rounded-xl"
                >
                  <Square className="size-3.5 fill-current" />
                  Stop
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setSigns([]);
                  setCurrentSign(null);
                  setLastConfidence(null);
                  lastSpokenSignRef.current = null;
                  stabilizerRef.current.reset();
                }}
                disabled={signs.length === 0 && !currentSign}
                className="shrink-0 rounded-xl"
              >
                <Trash2 aria-hidden="true" />
                Clear
              </Button>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/40">
                Auto-Detect: {autoDetect ? "ON" : "OFF"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {mode === "ai" ? "MediaPipe 3D" : "Simulated"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Active Spoken Caption Card (Clean & Non-Repeating) */}
          <Card className="rounded-3xl border-border/70 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span>Active Spoken Phrase</span>
                {isPlayingAudio && (
                  <span className="flex size-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500" />
                  </span>
                )}
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-bold text-primary">
                {currentLangConfig.nativeName} ({currentLangConfig.name})
              </Badge>
            </CardHeader>
            <CardContent aria-live="polite" className="space-y-4">
              <div className="min-h-32 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-surface p-4 leading-relaxed border border-primary/20 shadow-inner flex flex-col justify-center">
                {activePhrase && currentSign ? (
                  <div className="space-y-2.5">
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
                    {selectedLang !== "en" && activeEnglishPhrase && (
                      <p className="text-xs text-muted-foreground font-medium border-t border-border/60 pt-2">
                        English Translation: {activeEnglishPhrase}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Perform an ISL sign in front of the camera (e.g. 2 fingers for Doctor, 3 for Water, Open hand for Help) or press <strong>Space</strong> / click a sign. Captions & spoken audio in <strong className="text-foreground">{currentLangConfig.nativeName}</strong> will play automatically.
                  </p>
                )}
              </div>

              {/* Distinct Session History Tags */}
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

              {lastMessage && <p className="text-xs text-destructive font-medium">{lastMessage}</p>}
              {voiceNotice && <p className="text-xs text-amber-400 font-medium">{voiceNotice}</p>}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-amber-500/30 bg-amber-500/5 shadow-soft">
            <CardContent className="pt-5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Responsible AI Notice:</strong> VoiceBridge is
                  designed for basic healthcare triage and reception. It does not replace qualified human
                  sign language interpreters for complex clinical diagnoses.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
