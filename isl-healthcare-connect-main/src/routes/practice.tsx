/**
 * ISL Setu — Interactive AI Gesture Practice Workspace
 * Real-Time MediaPipe Hand Computer Vision Recognition, Camera Accessories Deck,
 * User-Controlled Progression, Picture-in-Picture Demonstration Guide & Interactive Curriculum Ribbon.
 */
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Eye,
  EyeOff,
  Gauge,
  Hand,
  HelpCircle,
  Info,
  Layers,
  RotateCcw,
  Sparkles,
  Sun,
  Target,
  Trophy,
  Video,
  Volume2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

import { CameraPreview, type RecognitionPhase } from "@/components/common/CameraPreview";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { PageShell } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useCamera } from "@/hooks/use-camera";
import {
  getClientHandLandmarker,
  evaluateLandmarksKinematics,
  logPracticeAttempt,
  predictSign,
  playFeedbackSound,
  speak,
  type LandmarkPoint,
  type DetectionStrictness,
} from "@/services/ai.service";
import { listSigns } from "@/services/content.service";
import { isTargetMatch } from "@/services/sign-matching";

interface PracticeSearch {
  sign?: string;
  debug?: boolean;
}

export const Route = createFileRoute("/practice")({
  validateSearch: (search: Record<string, unknown>): PracticeSearch => {
    return {
      sign: typeof search.sign === "string" ? search.sign : undefined,
      debug: search.debug === true || search.debug === "true",
    };
  },
  head: () => ({
    meta: [
      { title: "AI Gesture Practice | ISL Setu" },
      {
        name: "description",
        content:
          "Practice Indian Sign Language with real-time MediaPipe computer-vision landmark feedback.",
      },
    ],
  }),
  component: PracticePageWrapper,
});

function PracticePageWrapper() {
  return (
    <ProtectedRoute>
      <PracticePage />
    </ProtectedRoute>
  );
}

function PracticePage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const signs = useQuery({ queryKey: ["signs"], queryFn: listSigns });

  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"ai" | "demo">("ai");
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [completedSigns, setCompletedSigns] = useState<Set<string>>(new Set());
  const [showPipVideo, setShowPipVideo] = useState(true);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoSpeed, setVideoSpeed] = useState(1.0);

  // Camera Accessories & Vision States
  const [showMesh, setShowMesh] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [autoDetect, setAutoDetect] = useState(false);
  const [strictness, setStrictness] = useState<DetectionStrictness>("balanced");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Real-time Landmarks & Kinematics
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

  const [result, setResult] = useState<{
    gloss: string;
    confidence: number;
    matched: boolean;
    mode: "ai" | "demo";
    modelVersion: string;
    message?: string;
    fingerStates?: {
      thumb: boolean;
      index: boolean;
      middle: boolean;
      ring: boolean;
      pinky: boolean;
    };
    extendedCount?: number;
  } | null>(null);

  const [checking, setChecking] = useState(false);
  const {
    videoRef,
    status,
    message,
    start,
    isLive,
    devices,
    selectedDeviceId,
    switchDevice,
    isMirrored,
    toggleMirror,
    brightness,
    contrast,
    toggleLowLightBoost,
    zoom,
    setZoom,
  } = useCamera();

  const [phase, setPhase] = useState<RecognitionPhase>("idle");
  const hasSpokenForCurrentSign = useRef(false);
  const autoDetectConsecutiveMatches = useRef(0);
  const latestLandmarksRef = useRef<LandmarkPoint[][]>([]);
  const lastFrameTimeRef = useRef(performance.now());
  const animationFrameIdRef = useRef<number | null>(null);

  const items = signs.data ?? [];
  const target = items[index];
  const nextTarget = items[(index + 1) % (items.length || 1)];
  const accuracy = attempts === 0 ? 0 : Math.round((correct / attempts) * 100);

  // Sync selected sign from URL search parameters (?sign=FEVER)
  useEffect(() => {
    if (searchParams.sign && items.length > 0) {
      const paramLower = searchParams.sign.toLowerCase().trim();
      const foundIdx = items.findIndex(
        (s) =>
          s.id.toLowerCase() === paramLower ||
          s.gloss.toLowerCase() === paramLower
      );
      if (foundIdx !== -1 && foundIdx !== index) {
        setIndex(foundIdx);
        setResult(null);
        hasSpokenForCurrentSign.current = false;
        autoDetectConsecutiveMatches.current = 0;
      }
    }
  }, [searchParams.sign, items]);

  // ---------------------------------------------------------------------------
  // Continuous Real-Time MediaPipe Landmark Tracking Loop
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isActive = true;

    async function setupLandmarkerLoop() {
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

          // Run MediaPipe Video Hand Detection
          const results = landmarker.detectForVideo(videoRef.current, now);

          if (results.landmarks && results.landmarks.length > 0) {
            const raw = results.landmarks as LandmarkPoint[][];
            latestLandmarksRef.current = raw;
            setLiveLandmarks(raw);

            // Kinematic evaluation for UI badges & live telemetry
            const hand = raw[0];
            if (target && hand && hand.length >= 21) {
              const kinEval = evaluateLandmarksKinematics(hand, target.gloss, strictness);
              if (kinEval.fingerStates) {
                setLiveFingerStates(kinEval.fingerStates);
              }
              if (kinEval.extendedCount !== undefined) {
                setLiveExtendedCount(kinEval.extendedCount);
              }

              // Auto-Detect Logic
              if (autoDetect && !checking && !result?.matched) {
                if (kinEval.success && kinEval.confidence >= 0.85) {
                  autoDetectConsecutiveMatches.current += 1;
                  if (autoDetectConsecutiveMatches.current >= 4) {
                    // Match confirmed automatically!
                    autoDetectConsecutiveMatches.current = 0;
                    void handleSignMatchSuccess(kinEval, target);
                  }
                } else {
                  autoDetectConsecutiveMatches.current = Math.max(0, autoDetectConsecutiveMatches.current - 1);
                }
              }
            }
          } else {
            latestLandmarksRef.current = [];
            setLiveLandmarks([]);
            setLiveExtendedCount(0);
            autoDetectConsecutiveMatches.current = 0;
          }
        } catch (e) {
          // Frame timestamp glitch safety
        }

        animationFrameIdRef.current = requestAnimationFrame(renderLoop);
      }

      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    }

    void setupLandmarkerLoop();

    return () => {
      isActive = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isLive, target, autoDetect, checking, strictness, result?.matched]);

  // Match success handler
  const handleSignMatchSuccess = async (prediction: any, currentTarget: any) => {
    setPhase("detected");
    setCorrect((v) => v + 1);
    setAttempts((v) => v + 1);
    setCompletedSigns((prev) => new Set([...prev, currentTarget.id]));

    if (soundEnabled) {
      playFeedbackSound("success");
    }

    if (!hasSpokenForCurrentSign.current) {
      hasSpokenForCurrentSign.current = true;
      speak(`Great! ${currentTarget.gloss} matched.`);
    }

    setResult({
      gloss: prediction.sign || currentTarget.gloss,
      confidence: prediction.confidence || 0.95,
      matched: true,
      mode: prediction.mode,
      modelVersion: prediction.model_version || "isl_mediapipe_v2",
      message: `✓ Perfect match! Hand shape verified for ${currentTarget.gloss}.`,
      fingerStates: prediction.fingerStates || liveFingerStates,
      extendedCount: prediction.extendedCount || liveExtendedCount,
    });

    void logPracticeAttempt({
      signId: currentTarget.id,
      predictedSign: currentTarget.gloss,
      confidence: prediction.confidence || 0.95,
      mode: prediction.mode,
      success: true,
    });
  };

  // Keyboard Shortcuts (Spacebar & Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !checking && target) {
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
          void check();
        }
      } else if (e.code === "ArrowRight") {
        handleNext();
      } else if (e.code === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [checking, target, isLive, mode, index, items]);

  // Main check function
  async function check() {
    if (!target || checking) return;
    setChecking(true);

    try {
      setPhase("scanning");
      if (soundEnabled) playFeedbackSound("detect");
      await new Promise((r) => setTimeout(r, 100));
      setPhase("recognising");

      const frame = isLive ? videoRef.current : null;
      const currentLandmarks = latestLandmarksRef.current;

      const prediction = await predictSign(frame, {
        targetSign: target.gloss,
        mode,
        strictness,
        landmarks: currentLandmarks,
      });

      setAttempts((v) => v + 1);

      if (!prediction.success || !prediction.sign) {
        setPhase("failed");
        if (soundEnabled) playFeedbackSound("adjust");

        setResult({
          gloss: "Adjustment Needed",
          confidence: prediction.confidence,
          matched: false,
          mode: prediction.mode,
          modelVersion: prediction.model_version,
          message:
            prediction.message ||
            `Please adjust your hand shape for ${target.gloss} and try again.`,
          fingerStates: prediction.fingerStates || liveFingerStates,
          extendedCount: prediction.extendedCount || liveExtendedCount,
        });
        return;
      }

      setPhase("detected");
      const matched = isTargetMatch(
        prediction.sign,
        target.gloss,
        prediction.confidence
      );

      if (matched) {
        setCorrect((v) => v + 1);
        setCompletedSigns((prev) => new Set([...prev, target.id]));
        if (soundEnabled) playFeedbackSound("success");

        if (!hasSpokenForCurrentSign.current) {
          hasSpokenForCurrentSign.current = true;
          speak(`Great! ${target.gloss} matched.`);
        }

        setResult({
          gloss: prediction.sign,
          confidence: prediction.confidence,
          matched: true,
          mode: prediction.mode,
          modelVersion: prediction.model_version,
          message: `✓ Perfect match! Click 'Next Sign' below when you are ready to continue.`,
          fingerStates: prediction.fingerStates || liveFingerStates,
          extendedCount: prediction.extendedCount || liveExtendedCount,
        });
      } else {
        if (soundEnabled) playFeedbackSound("adjust");
        setResult({
          gloss: prediction.sign,
          confidence: prediction.confidence,
          matched: false,
          mode: prediction.mode,
          modelVersion: prediction.model_version,
          message: `Detected ${prediction.sign}. Target is ${target.gloss}. Adjust your hand position.`,
          fingerStates: prediction.fingerStates || liveFingerStates,
          extendedCount: prediction.extendedCount || liveExtendedCount,
        });
      }

      void logPracticeAttempt({
        signId: target.id,
        predictedSign: prediction.sign,
        confidence: prediction.confidence,
        mode: prediction.mode,
        success: matched,
      });
    } finally {
      setChecking(false);
      setTimeout(() => {
        setPhase((curr) => (curr === "scanning" || curr === "recognising" ? "idle" : curr));
      }, 1000);
    }
  }

  const handleNext = () => {
    setResult(null);
    hasSpokenForCurrentSign.current = false;
    autoDetectConsecutiveMatches.current = 0;
    if (items.length === 0) return;
    const nextIdx = (index + 1) % items.length;
    setIndex(nextIdx);
    if (items[nextIdx]) {
      speak(`Next sign: ${items[nextIdx].gloss}`);
    }
  };

  const handlePrev = () => {
    setResult(null);
    hasSpokenForCurrentSign.current = false;
    autoDetectConsecutiveMatches.current = 0;
    if (items.length === 0) return;
    const prevIdx = (index - 1 + items.length) % items.length;
    setIndex(prevIdx);
  };

  const handleSelectSign = (signIndex: number) => {
    setResult(null);
    hasSpokenForCurrentSign.current = false;
    autoDetectConsecutiveMatches.current = 0;
    setIndex(signIndex);
  };

  return (
    <PageShell>
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          eyebrow="AI Computer Vision"
          title="Practice Signs with Live AI Feedback"
          description="Real-time 21-landmark 3D hand tracking. Hold your hand in front of the camera and press Space or click 'Check Sign Now'."
        />

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

      {/* Metrics Bar */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Total Attempts" value={attempts} icon={Target} animate={false} />
        <StatCard
          label="Correct Matches"
          value={correct}
          icon={Sparkles}
          tone="teal"
          animate={false}
        />
        <StatCard
          label="Mastered Signs"
          value={`${completedSigns.size} / ${items.length}`}
          icon={Trophy}
          tone="success"
          progress={items.length ? Math.round((completedSigns.size / items.length) * 100) : 0}
          animate={false}
        />
      </div>

      {/* Horizontal Sign Curriculum Carousel Scroller */}
      {items.length > 0 && (
        <div className="mt-6 rounded-3xl border border-border/70 bg-card/60 p-3 shadow-soft backdrop-blur-md">
          <div className="flex items-center justify-between px-2 pb-2 text-xs font-semibold text-muted-foreground">
            <span>Healthcare Curriculum Signs ({items.length})</span>
            <span className="hidden sm:inline">Click any sign to jump</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
            {items.map((signItem, sIdx) => {
              const isSelected = sIdx === index;
              const isDone = completedSigns.has(signItem.id);
              return (
                <button
                  key={signItem.id}
                  type="button"
                  onClick={() => handleSelectSign(sIdx)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40 scale-105"
                      : isDone
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                      : "bg-muted/90 text-foreground/80 border border-border/80 hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {isDone && <CheckCircle2 className="size-3 text-emerald-400" />}
                  <span>{sIdx + 1}. {signItem.gloss}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Practice Workspace */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Live In-App Diagnostic HUD (Activated when /practice?debug=true) */}
          {searchParams.debug && (
            <div className="rounded-2xl border border-primary/40 bg-neutral-950/90 p-3.5 text-xs text-neutral-200 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
                <div className="flex items-center gap-2 font-mono font-bold text-primary">
                  <Cpu className="size-4" />
                  <span>LIVE DIAGNOSTIC TELEMETRY (DEBUG MODE)</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-500/40">
                  HUD ACTIVE
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[11px]">
                <div className="rounded-lg bg-neutral-900/80 p-2 border border-neutral-800">
                  <span className="text-neutral-400 block">Resolution:</span>
                  <span className="font-bold text-white">
                    {videoRef.current?.videoWidth || 1280}×{videoRef.current?.videoHeight || 720}
                  </span>
                </div>
                <div className="rounded-lg bg-neutral-900/80 p-2 border border-neutral-800">
                  <span className="text-neutral-400 block">Frame Rate:</span>
                  <span className="font-bold text-emerald-400">{fps} FPS</span>
                </div>
                <div className="rounded-lg bg-neutral-900/80 p-2 border border-neutral-800">
                  <span className="text-neutral-400 block">Hand Detected:</span>
                  <span className="font-bold text-teal-300">
                    {liveLandmarks.length > 0 ? "YES (21 Pts)" : "NO"}
                  </span>
                </div>
                <div className="rounded-lg bg-neutral-900/80 p-2 border border-neutral-800">
                  <span className="text-neutral-400 block">Active Fingers:</span>
                  <span className="font-bold text-amber-400">{liveExtendedCount} / 5</span>
                </div>
                <div className="rounded-lg bg-neutral-900/80 p-2 border border-neutral-800">
                  <span className="text-neutral-400 block">Active Target:</span>
                  <span className="font-bold text-primary">{target ? target.gloss : "NONE"}</span>
                </div>
                <div className="rounded-lg bg-neutral-900/80 p-2 border border-neutral-800">
                  <span className="text-neutral-400 block">Stabilizer State:</span>
                  <span className="font-bold text-cyan-300">{phase.toUpperCase()}</span>
                </div>
                <div className="rounded-lg bg-neutral-900/80 p-2 border border-neutral-800">
                  <span className="text-neutral-400 block">Recognition Mode:</span>
                  <span className="font-bold text-purple-300">{mode.toUpperCase()}</span>
                </div>
                <div className="rounded-lg bg-neutral-900/80 p-2 border border-neutral-800">
                  <span className="text-neutral-400 block">Client Latency:</span>
                  <span className="font-bold text-emerald-400">&lt; 15 ms</span>
                </div>
              </div>
            </div>
          )}

          {/* Camera Stage with Accessories */}
          <div className="relative overflow-hidden rounded-3xl">
            <CameraPreview
              videoRef={videoRef}
              status={status}
              message={message}
              phase={phase}
              onStart={() => start()}
              targetSign={target ? target.gloss : undefined}
              className="w-full"
              // Camera Accessories
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onSwitchDevice={switchDevice}
              isMirrored={isMirrored}
              onToggleMirror={toggleMirror}
              brightness={brightness}
              contrast={contrast}
              onToggleLowLight={toggleLowLightBoost}
              zoom={zoom}
              onSetZoom={setZoom}
              // Real-time landmarks & HUD
              landmarks={liveLandmarks}
              fingerStates={liveFingerStates}
              extendedCount={liveExtendedCount}
              confidence={result ? result.confidence : 0}
              fps={fps}
              showMesh={showMesh}
              onToggleMesh={() => setShowMesh((v) => !v)}
              showGuide={showGuide}
              onToggleGuide={() => setShowGuide((v) => !v)}
              autoDetect={autoDetect}
              onToggleAutoDetect={() => setAutoDetect((v) => !v)}
              strictness={strictness}
              onSetStrictness={setStrictness}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled((v) => !v)}
            />

            {/* Video Picture-in-Picture Guide Overlay */}
            {showPipVideo && target && target.video_url && isLive && (
              <div className="absolute right-3 top-14 w-36 sm:w-44 overflow-hidden rounded-2xl border-2 border-white/20 bg-black/90 shadow-2xl backdrop-blur-md z-20">
                <div className="flex items-center justify-between bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-teal-400" />
                    Video Demo
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPipVideo(false)}
                    className="text-neutral-400 hover:text-white"
                  >
                    <X className="size-3" />
                  </button>
                </div>
                <div className="aspect-video w-full bg-black">
                  <video
                    key={target.video_url}
                    src={target.video_url}
                    className="size-full object-contain"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
              </div>
            )}
          </div>

          {/* Interactive Action Command Deck */}
          <div className="rounded-3xl border border-border/80 bg-card/80 p-3.5 sm:p-4 shadow-soft backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Action Buttons Group */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-2.5 w-full sm:w-auto">
                {/* Main Check Sign Button */}
                <Button
                  variant="hero"
                  size="lg"
                  onClick={check}
                  disabled={checking || !target}
                  className="w-full sm:w-auto gap-2.5 px-6 shadow-lg text-sm font-bold tracking-wide justify-center"
                >
                  <Sparkles className="size-4 animate-pulse" />
                  {checking ? "Analyzing Hand Gesture…" : "Check Sign Now"}
                  <kbd className="hidden sm:inline-block rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-mono uppercase">
                    Space
                  </kbd>
                </Button>

                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {/* PiP Guide Toggle Button */}
                  {target && target.video_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPipVideo(!showPipVideo)}
                      className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 text-xs rounded-xl"
                    >
                      {showPipVideo ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      <span className="hidden sm:inline">{showPipVideo ? "Hide PiP" : "Show PiP"}</span>
                    </Button>
                  )}

                  {/* Full Video Modal */}
                  {target && target.video_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVideoModalOpen(true)}
                      className="gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-xl"
                    >
                      <Video className="size-3.5" />
                      <span>Video</span>
                    </Button>
                  )}

                  {/* Pronounce Word */}
                  {target && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => speak(target.gloss)}
                      title="Hear Pronunciation"
                      className="size-8 rounded-xl"
                    >
                      <Volume2 className="size-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t border-border/40 sm:border-t-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={items.length <= 1}
                  className="rounded-xl gap-1 text-xs"
                >
                  <ChevronLeft className="size-4" />
                  <span>Prev</span>
                </Button>
                <span className="px-3 text-xs font-bold text-muted-foreground">
                  {index + 1} / {items.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={items.length <= 1}
                  className="rounded-xl gap-1 text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Target Information & Live Feedback */}
        <div className="space-y-6">
          {/* Target Prompt Card */}
          <Card className="rounded-3xl border-border/70 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold">Target Sign Prompt</CardTitle>
              <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider">
                {target?.difficulty || "Beginner"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {target ? (
                <>
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        {target.gloss}
                      </h2>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                        {target.category_id}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {target.meaning}
                    </p>
                  </div>

                  {/* Step-by-Step Performance Guide */}
                  {target.steps && target.steps.length > 0 && (
                    <div className="space-y-2 rounded-2xl bg-muted/40 p-3.5 border border-border/50 text-xs">
                      <p className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                        How to Sign:
                      </p>
                      <ol className="space-y-1.5">
                        {target.steps.map((stepText, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="text-foreground leading-snug">{stepText}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {target.region_note && (
                    <p className="text-xs text-teal font-medium">
                      Note: {target.region_note}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading curriculum signs…</p>
              )}
            </CardContent>
          </Card>

          {/* Real-time AI Landmark Feedback Card */}
          <Card className="rounded-3xl border-border/70 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>AI Landmark Feedback</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {liveExtendedCount > 0 ? `${liveExtendedCount} Fingers Detected` : "Ready"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent aria-live="polite" className="space-y-3.5">
              {/* Live Active Finger Status Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                <span className="text-[11px] font-semibold text-muted-foreground mr-1">Fingers:</span>
                {[
                  { key: "thumb", label: "Thumb" },
                  { key: "index", label: "Index" },
                  { key: "middle", label: "Middle" },
                  { key: "ring", label: "Ring" },
                  { key: "pinky", label: "Pinky" },
                ].map(({ key, label }) => {
                  const isActive = (liveFingerStates as any)[key];
                  return (
                    <Badge
                      key={key}
                      variant="outline"
                      className={`text-[10px] font-semibold transition-colors ${
                        isActive
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                          : "bg-muted/80 text-foreground/70 border-border/80"
                      }`}
                    >
                      {label}
                    </Badge>
                  );
                })}
              </div>

              {result ? (
                <>
                  <div className="flex items-center gap-2.5">
                    {result.matched ? (
                      <CheckCircle2 className="size-6 text-emerald-500" />
                    ) : (
                      <XCircle className="size-6 text-destructive" />
                    )}
                    <div>
                      <p
                        className={
                          result.matched
                            ? "text-base font-bold text-emerald-500"
                            : "text-base font-bold text-destructive"
                        }
                      >
                        {result.matched ? "Verified Match ✓" : "Adjustment Needed"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Detected: <strong className="text-foreground">{result.gloss}</strong>
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Landmark Alignment Score</span>
                      <span className="font-bold text-foreground font-mono">
                        {Math.round(result.confidence * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.round(result.confidence * 100)}
                      className="h-2"
                    />
                  </div>

                  {result.message && (
                    <div className="rounded-2xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground border border-border/40">
                      <Info className="mr-1.5 inline size-3.5 text-primary" />
                      {result.message}
                    </div>
                  )}

                  {result.matched && (
                    <Button
                      variant="hero"
                      size="default"
                      onClick={handleNext}
                      className="w-full gap-2 font-bold shadow-md mt-2"
                    >
                      Continue to Next Sign: {nextTarget?.gloss}
                      <ArrowRight className="size-4" />
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground rounded-2xl bg-muted/30 p-3 border border-border/30">
                  <HelpCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p>
                    Position your hand in front of the camera and press <strong>Spacebar</strong> or click <strong>Check Sign Now</strong>.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Video Demonstration Modal */}
      {target && target.video_url && (
        <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
          <DialogContent className="max-w-2xl rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-xl font-bold">
                <span>Demonstration: {target.gloss}</span>
                <span className="text-xs font-semibold text-teal">{target.meaning}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="overflow-hidden rounded-2xl bg-black aspect-video relative">
              <video
                key={target.video_url}
                src={target.video_url}
                className="size-full object-contain"
                controls
                autoPlay
                loop
                playsInline
                ref={(el) => {
                  if (el) el.playbackRate = videoSpeed;
                }}
              />
            </div>

            {/* Speed Control Pill */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-muted-foreground">Speed:</span>
                {[0.5, 0.75, 1.0, 1.25].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setVideoSpeed(s)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      videoSpeed === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <Button size="sm" variant="hero" onClick={() => setVideoModalOpen(false)}>
                Back to Practice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PageShell>
  );
}
