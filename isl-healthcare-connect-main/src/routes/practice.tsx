import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Gauge, RefreshCw, Sparkles, Target } from "lucide-react";
import { useState } from "react";

import { CameraPreview } from "@/components/common/CameraPreview";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { PageShell } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { predictSign, speak } from "@/services/ai.service";
import { listSigns } from "@/services/content.service";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Practice ISL signs with AI feedback" },
      {
        name: "description",
        content: "Practise healthcare ISL signs with your camera and get instant confidence feedback in Demo Mode.",
      },
      { property: "og:title", content: "Practice ISL signs with AI feedback" },
      { property: "og:description", content: "Camera-based ISL practice with instant confidence scoring." },
    ],
  }),
  component: PracticePage,
});

function PracticePage() {
  const signs = useQuery({ queryKey: ["signs"], queryFn: listSigns });
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<{ gloss: string; confidence: number; matched: boolean } | null>(null);
  const [checking, setChecking] = useState(false);

  const items = signs.data ?? [];
  const target = items[index];
  const accuracy = attempts === 0 ? 0 : Math.round((correct / attempts) * 100);

  async function check() {
    if (!target) return;
    setChecking(true);
    setResult(null);
    const prediction = await predictSign(null, { targetSign: target.gloss });
    if (!prediction) {
      setAttempts((value) => value + 1);
      setResult({ gloss: "Not recognised", confidence: 0, matched: false });
      speak("Sign not recognised. Please try again.");
      setChecking(false);
      return;
    }
    const matched = prediction.sign.toUpperCase() === target.gloss.toUpperCase() && prediction.confidence >= 0.7;
    setAttempts((value) => value + 1);
    if (matched) setCorrect((value) => value + 1);
    setResult({ gloss: prediction.sign, confidence: prediction.confidence, matched });
    speak(matched ? `Correct. ${target.gloss}` : `Try again. That looked like ${prediction.sign}`);
    setChecking(false);
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Practice with AI"
        title="Practise signs with instant feedback"
        description="Show the prompted sign to your camera. ISL Setu is in Demo Mode — recognition is simulated, so treat feedback as practice guidance, never as clinical validation."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Attempts" value={attempts} icon={Target} animate={false} />
        <StatCard label="Correct" value={correct} icon={Sparkles} tone="teal" animate={false} />
        <StatCard label="Session accuracy" value={accuracy} suffix="%" icon={Gauge} tone="success" progress={accuracy} animate={false} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CameraPreview
            overlayLabel={target ? `Sign: ${target.gloss}` : "Loading signs"}
            statusLabel={checking ? "Analysing…" : result ? (result.matched ? "Match" : "Retry") : "Ready"}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="hero" onClick={check} disabled={checking || !target}>
              <Sparkles aria-hidden="true" />
              {checking ? "Checking…" : "Check my sign"}
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
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Current prompt</CardTitle>
            </CardHeader>
            <CardContent>
              {target ? (
                <>
                  <p className="text-2xl font-bold text-foreground">{target.gloss}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{target.description}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Regional note: {target.regional_note}</p>
                </>
              ) : (
                <Progress value={0} className="h-2" />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">AI feedback</CardTitle>
            </CardHeader>
            <CardContent aria-live="polite">
              {result ? (
                <>
                  <p className={result.matched ? "text-sm font-semibold text-success" : "text-sm font-semibold text-destructive"}>
                    {result.matched ? "Nice work — that matches." : "Not quite yet — try once more."}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Recognised as <strong className="text-foreground">{result.gloss}</strong>
                  </p>
                  <Progress
                    value={Math.round(result.confidence * 100)}
                    className="mt-3 h-2"
                    aria-label={`Confidence ${Math.round(result.confidence * 100)}%`}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Simulated confidence: {Math.round(result.confidence * 100)}%
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Feedback will appear here after you check a sign.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
