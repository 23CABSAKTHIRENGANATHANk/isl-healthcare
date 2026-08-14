import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Eye,
  FastForward,
  Gauge,
  HelpCircle,
  Info,
  Layers,
  Play,
  RefreshCw,
  Sparkles,
  Target,
  Video,
  Volume2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

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
  logPracticeAttempt,
  predictSign,
  speak,
} from "@/services/ai.service";
import { listSigns } from "@/services/content.service";

interface PracticeSearch {
  sign?: string;
}

export const Route = createFileRoute("/practice")({
  validateSearch: (search: Record<string, unknown>): PracticeSearch => {
    return {
      sign: typeof search.sign === "string" ? search.sign : undefined,
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
  const [autoDetect, setAutoDetect] = useState(true);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoSpeed, setVideoSpeed] = useState(1.0);
  const [result, setResult] = useState<{
    gloss: string;
    confidence: number;
    matched: boolean;
    mode: "ai" | "demo";
    modelVersion: string;
    message?: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const { videoRef, status, message, start, isLive } = useCamera();
  const [phase, setPhase] = useState<RecognitionPhase>("idle");

  const items = signs.data ?? [];
  const target = items[index];
  const accuracy = attempts === 0 ? 0 : Math.round((correct / attempts) * 100);

  // Sync selected sign from URL search parameters (?sign=FEVER)
  useEffect(() => {
    if (searchParams.sign && items.length > 0) {
      const paramLower = searchParams.sign.toLowerCase().trim();
      const foundIdx = items.findIndex(
        (s) =>
          s.id.toLowerCase() === paramLower ||
          s.gloss.toLowerCase() === paramLower,
      );
      if (foundIdx !== -1 && foundIdx !== index) {
        setIndex(foundIdx);
      }
    }
  }, [searchParams.sign, items]);

  // Spacebar keyboard shortcut for hands-free checking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !checking && target) {
        // Prevent default page scroll on space
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
          void check();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [checking, target, isLive, mode, index]);

  // Continuous auto-detection loop when toggled on
  useEffect(() => {
    if (!autoDetect || !isLive || checking) return;
    const interval = setInterval(() => {
      if (isLive && !checking && target) {
        void check();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [autoDetect, isLive, checking, target, index]);

  async function check() {
    if (!target) return;
    setChecking(true);
    setResult(null);

    try {
      setPhase("scanning");
      await new Promise((r) => setTimeout(r, 200));
      setPhase("recognising");

      const frame = isLive ? videoRef.current : null;
      const prediction = await predictSign(frame, {
        targetSign: target.gloss,
        mode,
      });

      setAttempts((v) => v + 1);

      if (!prediction.success || !prediction.sign) {
        setPhase("failed");
        setResult({
          gloss: "Not recognised",
          confidence: prediction.confidence,
          matched: false,
          mode: prediction.mode,
          modelVersion: prediction.model_version,
          message:
            prediction.message ||
            "Sign not recognised. Hold hand steady inside sensor frame.",
        });
        speak("Sign not recognised. Please try again.");

        void logPracticeAttempt({
          signId: target.id,
          predictedSign: null,
          confidence: prediction.confidence,
          mode: prediction.mode,
          success: false,
        });
        return;
      }

      setPhase("detected");
      const matched =
        prediction.sign.toUpperCase() === target.gloss.toUpperCase() &&
        prediction.confidence >= 0.7;

      if (matched) {
        setCorrect((v) => v + 1);
        speak(`Excellent! ${target.gloss} matched. ${Math.round(prediction.confidence * 100)}% accurate.`);
      } else {
        speak(`Detected ${prediction.sign}. Expected ${target.gloss}. Try again.`);
      }

      setResult({
        gloss: prediction.sign,
        confidence: prediction.confidence,
        matched,
        mode: prediction.mode,
        modelVersion: prediction.model_version,
        message: matched
          ? `✓ Perfect gesture match! (${Math.round(prediction.confidence * 100)}% confidence)`
          : `Detected ${prediction.sign} but expected ${target.gloss}. Adjust hand position.`,
      });

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
      }, 1500);
    }
  }

  const handleNext = () => {
    setResult(null);
    setIndex((v) => (items.length === 0 ? 0 : (v + 1) % items.length));
  };

  const handlePrev = () => {
    setResult(null);
    setIndex((v) => (items.length === 0 ? 0 : (v - 1 + items.length) % items.length));
  };

  return (
    <PageShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          eyebrow="AI Computer Vision"
          title="Practice Signs with Live AI Feedback"
          description="Show prompted sign to your camera. Real-time MediaPipe Hand 3D landmark analysis checks your hand shape and joint angles."
        />

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-soft">
          <Button
            size="sm"
            variant={mode === "ai" ? "hero" : "ghost"}
            onClick={() => setMode("ai")}
            className="rounded-xl text-xs font-semibold"
          >
            <Cpu className="size-3.5" aria-hidden="true" />
            AI Mode (MediaPipe)
          </Button>
          <Button
            size="sm"
            variant={mode === "demo" ? "outline" : "ghost"}
            onClick={() => setMode("demo")}
            className="rounded-xl text-xs font-semibold"
          >
            <Bot className="size-3.5" aria-hidden="true" />
            Demo Mode
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Attempts" value={attempts} icon={Target} animate={false} />
        <StatCard
          label="Correct Matches"
          value={correct}
          icon={Sparkles}
          tone="teal"
          animate={false}
        />
        <StatCard
          label="Session Accuracy"
          value={accuracy}
          suffix="%"
          icon={Gauge}
          tone="success"
          progress={accuracy}
          animate={false}
        />
      </div>

      {/* Main Practice Workspace */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Camera Stage */}
          <CameraPreview
            videoRef={videoRef}
            status={status}
            message={message}
            phase={phase}
            onStart={() => start()}
            targetSign={target ? target.gloss : undefined}
            className="w-full"
          />

          {/* Interactive Action Command Deck */}
          <div className="rounded-3xl border border-border/80 bg-card/80 p-4 shadow-soft backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Main Check Sign Button */}
                <Button
                  variant="hero"
                  size="lg"
                  onClick={check}
                  disabled={checking || !target}
                  className="gap-2.5 px-6 shadow-lg text-sm font-bold tracking-wide"
                >
                  <Sparkles className="size-4 animate-pulse" />
                  {checking ? "Analysing Hand Skeleton…" : "Check Sign Now"}
                  <kbd className="hidden sm:inline-block rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-mono uppercase">
                    Space
                  </kbd>
                </Button>

                {/* Watch Video Demonstration */}
                {target && target.video_url && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setVideoModalOpen(true)}
                    className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Eye className="size-4" />
                    Watch Video Guide
                  </Button>
                )}

                {/* Pronounce Word */}
                {target && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => speak(target.gloss)}
                    title="Hear Pronunciation"
                    className="rounded-2xl"
                  >
                    <Volume2 className="size-5 text-muted-foreground hover:text-foreground" />
                  </Button>
                )}
              </div>

              {/* Navigation & Auto-Detect Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant={autoDetect ? "teal" : "outline"}
                  size="sm"
                  onClick={() => setAutoDetect(!autoDetect)}
                  className="rounded-xl text-xs font-semibold gap-1.5"
                  title="Automatically checks hand position every 2.5s"
                >
                  <Zap className={`size-3.5 ${autoDetect ? "fill-current" : ""}`} />
                  Auto-Detect {autoDetect ? "ON" : "OFF"}
                </Button>

                <div className="flex items-center gap-1 border-l border-border pl-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrev}
                    disabled={items.length <= 1}
                    className="size-9 rounded-xl"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="px-2 text-xs font-bold text-muted-foreground">
                    {index + 1} / {items.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNext}
                    disabled={items.length <= 1}
                    className="size-9 rounded-xl"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
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
              <CardTitle className="text-base font-bold">AI Landmark Feedback</CardTitle>
            </CardHeader>
            <CardContent aria-live="polite" className="space-y-3.5">
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
                </>
              ) : (
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground rounded-2xl bg-muted/30 p-3 border border-border/30">
                  <HelpCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p>
                    Position hand inside the sensor box. Press <strong>Space</strong> or click{" "}
                    <strong>Check Sign</strong> for instant landmark feedback.
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
