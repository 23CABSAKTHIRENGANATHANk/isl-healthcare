import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, CheckCircle2, Cpu, Gauge, HelpCircle, Info, RefreshCw, Sparkles, Target, Volume2, XCircle } from "lucide-react";
import { useState } from "react";

import { CameraPreview } from "@/components/common/CameraPreview";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { PageShell } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { logPracticeAttempt, predictSign, speak } from "@/services/ai.service";
import { listSigns } from "@/services/content.service";
import { useCamera } from "@/hooks/use-camera";
import type { RecognitionPhase } from "@/components/common/CameraPreview";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Practice ISL signs with AI feedback" },
      {
        name: "description",
        content: "Practise healthcare ISL signs with real-time MediaPipe hand tracking and AI model feedback.",
      },
      { property: "og:title", content: "Practice ISL signs with AI feedback" },
      { property: "og:description", content: "Camera-based ISL practice with instant confidence scoring." },
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
  const signs = useQuery({ queryKey: ["signs"], queryFn: listSigns });
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mode, setMode] = useState<"ai" | "demo">("ai");
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
          message: prediction.message || "Sign not recognised. Try again with better lighting and keep hand inside frame.",
        });
        speak("Sign not recognised. Please try again with clear lighting.");
        
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
      const matched = prediction.sign.toUpperCase() === target.gloss.toUpperCase() && prediction.confidence >= 0.70;
      
      if (matched) {
        setCorrect((v) => v + 1);
      }

      setResult({
        gloss: prediction.sign,
        confidence: prediction.confidence,
        matched,
        mode: prediction.mode,
        modelVersion: prediction.model_version,
        message: prediction.message,
      });

      speak(matched ? `Correct. ${target.gloss}` : `Detected ${prediction.sign}. Try again for ${target.gloss}`);

      void logPracticeAttempt({
        signId: target.id,
        predictedSign: prediction.sign,
        confidence: prediction.confidence,
        mode: prediction.mode,
        success: matched,
      });
    } finally {
      setChecking(false);
      setTimeout(() => setPhase("idle"), 1200);
    }
  }

  return (
    <PageShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          eyebrow="AI Computer Vision"
          title="Practice signs with AI feedback"
          description="Show the prompted sign to your camera. Real-time MediaPipe Hand landmark analysis checks your hand shape and motion."
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

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Attempts" value={attempts} icon={Target} animate={false} />
        <StatCard label="Correct Signs" value={correct} icon={Sparkles} tone="teal" animate={false} />
        <StatCard label="Session Accuracy" value={accuracy} suffix="%" icon={Gauge} tone="success" progress={accuracy} animate={false} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CameraPreview
            videoRef={videoRef}
            status={status}
            message={message}
            phase={phase}
            onStart={() => start()}
            targetSign={target ? target.gloss : undefined}
            className="h-[420px]"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="hero" onClick={check} disabled={checking || !target}>
                <Sparkles aria-hidden="true" />
                {checking ? "Analysing Hand Landmarks…" : `Check Sign (${mode.toUpperCase()})`}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setIndex((value) => (items.length === 0 ? 0 : (value + 1) % items.length));
                }}
              >
                <RefreshCw aria-hidden="true" />
                Next sign
              </Button>
            </div>
            <Badge variant="outline" className="text-xs">
              Model: {mode === "ai" ? "ISL Setu AI v1 (MediaPipe)" : "Simulation Engine"}
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Target Sign Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              {target ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-foreground">{target.gloss}</p>
                    <Button size="icon" variant="ghost" onClick={() => speak(target.gloss)}>
                      <Volume2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{target.meaning}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Regional note:</span> {target.region_note}
                  </p>
                </>
              ) : (
                <Progress value={0} className="h-2" />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">AI Feedback</CardTitle>
            </CardHeader>
            <CardContent aria-live="polite" className="space-y-3">
              {result ? (
                <>
                  <div className="flex items-center gap-2">
                    {result.matched ? (
                      <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
                    ) : (
                      <XCircle className="size-5 text-destructive" aria-hidden="true" />
                    )}
                    <p className={result.matched ? "text-sm font-bold text-success" : "text-sm font-bold text-destructive"}>
                      {result.matched ? "Verified Correct Match ✓" : "Needs Adjustment"}
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Detected: <strong className="text-foreground">{result.gloss}</strong>
                  </p>

                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Confidence Score</span>
                      <span className="font-semibold text-foreground">{Math.round(result.confidence * 100)}%</span>
                    </div>
                    <Progress
                      value={Math.round(result.confidence * 100)}
                      className="mt-1.5 h-2"
                      aria-label={`Confidence ${Math.round(result.confidence * 100)}%`}
                    />
                  </div>

                  {result.message ? (
                    <p className="rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                      <Info className="mr-1.5 inline size-3.5 text-primary" />
                      {result.message}
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <HelpCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <p>Position your hand clearly inside the camera box and click "Check Sign" to receive landmark-based feedback.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
