import { createFileRoute } from "@tanstack/react-router";
import { Hand, Mic, Trash2, Volume2 } from "lucide-react";
import { useState } from "react";

import { CameraPreview } from "@/components/common/CameraPreview";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { predictSign, speak } from "@/services/ai.service";

export const Route = createFileRoute("/voicebridge")({
  head: () => ({
    meta: [
      { title: "VoiceBridge — sign to text to voice" },
      {
        name: "description",
        content: "Turn Indian Sign Language into captions and spoken words so deaf patients and hospital staff can talk.",
      },
      { property: "og:title", content: "VoiceBridge — sign to text to voice" },
      { property: "og:description", content: "Sign-to-text-to-voice communication for hospital conversations." },
    ],
  }),
  component: VoiceBridgePage,
});

function VoiceBridgePage() {
  const [sentence, setSentence] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);

  async function capture() {
    setCapturing(true);
    const prediction = await predictSign(null);
    if (prediction) {
      setSentence((words) => [...words, prediction.sign]);
      setLastConfidence(prediction.confidence);
    }
    setCapturing(false);
  }

  const text = sentence.join(" ");

  return (
    <PageShell>
      <PageHeader
        eyebrow="VoiceBridge"
        title="Sign → Text → Voice"
        description="Capture signs one at a time to build a sentence, then read it aloud for hearing staff. Demo Mode simulates recognition — always confirm critical clinical details another way."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CameraPreview
            overlayLabel="Show one sign at a time"
            statusLabel={capturing ? "Recognising…" : "Ready"}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="hero" onClick={capture} disabled={capturing}>
              <Hand aria-hidden="true" />
              {capturing ? "Recognising…" : "Capture sign"}
            </Button>
            <Button variant="teal" onClick={() => speak(text)} disabled={sentence.length === 0}>
              <Volume2 aria-hidden="true" />
              Speak sentence
            </Button>
            <Button variant="outline" onClick={() => setSentence([])} disabled={sentence.length === 0}>
              <Trash2 aria-hidden="true" />
              Clear
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Live captions</CardTitle>
            </CardHeader>
            <CardContent aria-live="polite">
              <p className="min-h-24 rounded-xl bg-muted p-4 text-lg font-semibold leading-relaxed text-foreground">
                {text || "Captions will appear here as signs are recognised."}
              </p>
              {lastConfidence !== null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Last sign simulated confidence: {Math.round(lastConfidence * 100)}%
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">How to use it</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <Hand className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  Ask the patient to sign one word at a time, facing the camera.
                </li>
                <li className="flex gap-3">
                  <Mic className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  Build the sentence, then read the captions back to confirm meaning.
                </li>
                <li className="flex gap-3">
                  <Volume2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  Speak the sentence aloud for colleagues who do not sign.
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
