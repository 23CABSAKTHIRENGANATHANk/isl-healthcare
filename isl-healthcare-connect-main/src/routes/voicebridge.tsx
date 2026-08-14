import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Bot,
  Cpu,
  Globe,
  Hand,
  Sparkles,
  Trash2,
  Volume2,
} from "lucide-react";
import { useState } from "react";

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
} from "@/services/ai.service";
import { useCamera } from "@/hooks/use-camera";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

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

function VoiceBridgePage() {
  const [signs, setSigns] = useState<string[]>([]);
  const [mode, setMode] = useState<"ai" | "demo">("ai");
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [capturing, setCapturing] = useState(false);
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const { videoRef, status, message, start, isLive } = useCamera();
  const [phase, setPhase] = useState<RecognitionPhase>("idle");

  const currentLangConfig =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  async function capture() {
    setCapturing(true);
    setLastMessage(null);

    try {
      setPhase("scanning");
      await new Promise((r) => setTimeout(r, 200));
      setPhase("recognising");

      const frame = isLive ? videoRef.current : null;
      const prediction = await predictSign(frame, { mode });

      if (prediction.success && prediction.sign) {
        setSigns((words) => [...words, prediction.sign as string]);
        setLastConfidence(prediction.confidence);
        setPhase("detected");

        // Speak the individual recognized sign phrase in selected Indian language
        const spokenPhrase = getSpokenPhrase(prediction.sign, selectedLang);
        speak(spokenPhrase, currentLangConfig.voiceLang);
      } else {
        setPhase("failed");
        setLastMessage(prediction.message || "Sign not recognised. Hold your hand steady.");
        speak("Sign not recognised.", "en-IN");
      }
    } finally {
      setCapturing(false);
      setTimeout(() => setPhase("idle"), 900);
    }
  }

  // Construct readable sentence in selected language from captured tokens
  const fullSentence = signs.map((s) => getSpokenPhrase(s, selectedLang)).join(" ");
  const englishFallback = signs.map((s) => getSpokenPhrase(s, "en")).join(" ");

  return (
    <PageShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          eyebrow="VoiceBridge • Multilingual"
          title="Sign → Text → Multilingual Voice 🔊"
          description="Live communication bridge for hospital reception, nursing triage, and doctor consultations. Translates ISL signs directly into English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali & Marathi spoken audio."
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

      {/* Language Selector Bar */}
      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border/80 bg-card/60 p-3 shadow-soft backdrop-blur-md">
        <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <Globe className="size-3.5 text-primary" />
          <span>Speech Language:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setSelectedLang(lang.code);
                if (signs.length > 0) {
                  const translated = signs.map((s) => getSpokenPhrase(s, lang.code)).join(" ");
                  speak(translated, lang.voiceLang);
                }
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                selectedLang === lang.code
                  ? "bg-primary text-primary-foreground shadow-sm scale-105"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{lang.nativeName}</span>
              {lang.code !== "en" && <span className="ml-1 text-[10px] opacity-75">({lang.name})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
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
              <Button variant="hero" onClick={capture} disabled={capturing} className="gap-2">
                <Hand aria-hidden="true" className="size-4" />
                {capturing ? "Extracting Landmarks…" : "Capture Sign"}
              </Button>
              <Button
                variant="teal"
                onClick={() => speak(fullSentence, currentLangConfig.voiceLang)}
                disabled={signs.length === 0}
                className="gap-2"
              >
                <Volume2 aria-hidden="true" className="size-4" />
                Speak in {currentLangConfig.nativeName}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSigns([]);
                  setLastConfidence(null);
                }}
                disabled={signs.length === 0}
              >
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
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold">Live Spoken Captions</CardTitle>
              <Badge variant="secondary" className="text-xs font-semibold">
                {currentLangConfig.nativeName}
              </Badge>
            </CardHeader>
            <CardContent aria-live="polite" className="space-y-4">
              <div className="min-h-28 rounded-2xl bg-gradient-to-br from-primary/5 via-muted/40 to-muted/20 p-4 leading-relaxed border border-primary/10">
                {fullSentence ? (
                  <div className="space-y-2">
                    <p className="font-display text-lg font-bold text-foreground">
                      {fullSentence}
                    </p>
                    {selectedLang !== "en" && (
                      <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-1.5">
                        English: {englishFallback}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Captions and speech translation in <strong>{currentLangConfig.nativeName}</strong> will appear here as signs are recognised.
                  </p>
                )}
              </div>

              {signs.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {signs.map((s, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-teal/15 text-teal border border-teal/30">
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {lastConfidence !== null && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                  <span>Recognition Confidence:</span>
                  <span className="font-bold text-emerald-500 font-mono">
                    {Math.round(lastConfidence * 100)}%
                  </span>
                </div>
              )}

              {lastMessage && <p className="text-xs text-destructive">{lastMessage}</p>}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5 shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
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
