import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Bot, Cpu, Hand, Sparkles, Trash2, Volume2 } from "lucide-react";
import { useState } from "react";

import { CameraPreview, type RecognitionPhase } from "@/components/common/CameraPreview";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CONTROLLED_PHRASES, predictSign, speak } from "@/services/ai.service";
import { useCamera } from "@/hooks/use-camera";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export const Route = createFileRoute("/voicebridge")({
  head: () => ({
    meta: [
      { title: "VoiceBridge — Sign to Text to Voice" },
      {
        name: "description",
        content: "Convert Indian Sign Language into clear text and natural spoken voice for hospital front desks and triage.",
      },
      { property: "og:title", content: "VoiceBridge — Sign to Text to Voice" },
      { property: "og:description", content: "Sign-to-text-to-voice communication bridge for hospital consultations." },
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

function VoiceBridgePage() {
  const [signs, setSigns] = useState<string[]>([]);
  const [mode, setMode] = useState<"ai" | "demo">("ai");
  const [capturing, setCapturing] = useState(false);
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const { videoRef, status, message, start, isLive } = useCamera();
  const [phase, setPhase] = useState<RecognitionPhase>("idle");

  async function capture() {
    setCapturing(true);
    setLastMessage(null);

    try {
      setPhase("scanning");
      await new Promise((r) => setTimeout(r, 250));
      setPhase("recognising");

      const frame = isLive ? videoRef.current : null;
      const prediction = await predictSign(frame, { mode });

      if (prediction.success && prediction.sign) {
        setSigns((words) => [...words, prediction.sign as string]);
        setLastConfidence(prediction.confidence);
        setPhase("detected");

        // Speak the individual recognized sign phrase
        const spokenPhrase = CONTROLLED_PHRASES[prediction.sign] || `${prediction.sign}.`;
        speak(spokenPhrase);
      } else {
        setPhase("failed");
        setLastMessage(prediction.message || "Sign not recognised. Hold your hand steady.");
        speak("Sign not recognised.");
      }
    } finally {
      setCapturing(false);
      setTimeout(() => setPhase("idle"), 900);
    }
  }

  // Construct readable sentence from captured sign tokens
  const fullSentence = signs
    .map((s) => CONTROLLED_PHRASES[s] || s)
    .join(" ");

  return (
    <PageShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          eyebrow="VoiceBridge"
          title="Sign → Text → Voice"
          description="Live communication bridge for hospital reception, nursing triage, and doctor consultations. Shows hand signs and converts them directly into spoken audio."
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

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CameraPreview
            videoRef={videoRef}
            status={status}
            message={message}
            phase={phase}
            onStart={() => start()}
            className="h-[420px]"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="hero" onClick={capture} disabled={capturing}>
                <Hand aria-hidden="true" />
                {capturing ? "Extracting Landmarks…" : "Capture Sign"}
              </Button>
              <Button variant="teal" onClick={() => speak(fullSentence)} disabled={signs.length === 0}>
                <Volume2 aria-hidden="true" />
                Speak All
              </Button>
              <Button variant="outline" onClick={() => { setSigns([]); setLastConfidence(null); }} disabled={signs.length === 0}>
                <Trash2 aria-hidden="true" />
                Clear
              </Button>
            </div>
            <Badge variant="outline" className="text-xs">
              Backend: {mode === "ai" ? "FastAPI + MediaPipe" : "Simulated"}
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Live Spoken Captions</CardTitle>
            </CardHeader>
            <CardContent aria-live="polite" className="space-y-3">
              <div className="min-h-28 rounded-xl bg-muted/60 p-4 leading-relaxed">
                {fullSentence ? (
                  <p className="text-base font-semibold text-foreground">{fullSentence}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Captions and speech translation will appear here as signs are recognised.
                  </p>
                )}
              </div>

              {signs.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {signs.map((s, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {lastConfidence !== null && (
                <p className="text-xs text-muted-foreground">
                  Last sign confidence: <strong className="text-foreground">{Math.round(lastConfidence * 100)}%</strong>
                </p>
              )}

              {lastMessage && (
                <p className="text-xs text-destructive">{lastMessage}</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5 shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Responsible AI Notice:</strong> VoiceBridge is designed for basic healthcare assistance. It does not replace qualified human sign language interpreters for critical clinical diagnoses.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
