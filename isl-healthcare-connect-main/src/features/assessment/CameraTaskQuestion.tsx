import { useCallback, useState } from "react";
import { CheckCircle2, Sparkles, XCircle } from "lucide-react";

import { CameraPreview, type RecognitionPhase } from "@/components/common/CameraPreview";
import { DemoModeBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/use-camera";
import { predictSign } from "@/services/ai.service";

interface CameraTaskQuestionProps {
  targetSign: string;
  value: string;
  onAnswer: (value: string) => void;
}

/**
 * Camera-based assessment question. Every result is simulated (Demo Mode) —
 * never presented as a real recognition outcome.
 */
export function CameraTaskQuestion({ targetSign, value, onAnswer }: CameraTaskQuestionProps) {
  const { videoRef, status, message, start } = useCamera();
  const [phase, setPhase] = useState<RecognitionPhase>("idle");
  const [detected, setDetected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const runDetection = useCallback(async () => {
    setBusy(true);
    setPhase("scanning");
    await new Promise((resolve) => setTimeout(resolve, 500));
    setPhase("recognising");
    const result = await predictSign(status === "ready" ? videoRef.current : null, { targetSign });
    if (result && result.sign === targetSign) {
      setPhase("detected");
      setDetected(result.sign);
      onAnswer(targetSign);
    } else {
      setPhase("failed");
      setDetected(result?.sign ?? null);
      onAnswer(result?.sign ?? "unrecognised");
    }
    setBusy(false);
  }, [onAnswer, status, targetSign, videoRef]);

  const isCorrect = value === targetSign;

  return (
    <div className="space-y-4">
      <DemoModeBadge />
      <CameraPreview
        videoRef={videoRef}
        status={status}
        {...(message ? { message } : {})}
        phase={phase}
        onStart={start}
        targetSign={targetSign}
      >
        <div className="ml-auto flex flex-wrap gap-2">
          {status !== "ready" ? (
            <Button variant="outline" size="sm" onClick={() => void runDetection()} disabled={busy}>
              <Sparkles aria-hidden="true" />
              Try Demo (no camera)
            </Button>
          ) : null}
          <Button variant="hero" size="sm" onClick={() => void runDetection()} disabled={busy}>
            <Sparkles aria-hidden="true" />
            {busy ? "Analysing…" : "Simulate Detection"}
          </Button>
        </div>
      </CameraPreview>
      {value ? (
        <p className="flex items-center gap-2 text-sm font-medium">
          {isCorrect ? (
            <>
              <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
              <span className="text-success">Simulated match for {targetSign}.</span>
            </>
          ) : (
            <>
              <XCircle className="size-4 text-destructive" aria-hidden="true" />
              <span className="text-destructive">
                Simulated result: {detected ?? "not recognised"}. You can try again above.
              </span>
            </>
          )}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Show the <span className="font-semibold text-foreground">{targetSign}</span> sign, then run the demo
          detection to record your answer.
        </p>
      )}
    </div>
  );
}
