import { useCallback, useState } from "react";
import { CheckCircle2, Cpu, Sparkles, XCircle, AlertCircle } from "lucide-react";

import { CameraPreview, type RecognitionPhase } from "@/components/common/CameraPreview";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/use-camera";
import { predictSign } from "@/services/ai.service";

interface CameraTaskQuestionProps {
  targetSign: string;
  value: string;
  onAnswer: (value: string) => void;
}

/**
 * Camera-based assessment question powered by real-time MediaPipe AI recognition.
 */
export function CameraTaskQuestion({ targetSign, value, onAnswer }: CameraTaskQuestionProps) {
  const { videoRef, status, message, start } = useCamera();
  const [phase, setPhase] = useState<RecognitionPhase>("idle");
  const [detected, setDetected] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const runDetection = useCallback(async (forcedMode: "ai" | "demo" = "ai") => {
    setBusy(true);
    setFeedback(null);
    setPhase("scanning");
    await new Promise((resolve) => setTimeout(resolve, 400));
    setPhase("recognising");

    const frame = status === "ready" ? videoRef.current : null;
    const result = await predictSign(frame, { targetSign, mode: forcedMode });

    if (result && result.success && result.sign) {
      setConfidence(result.confidence);
      const isMatch = result.sign.toUpperCase() === targetSign.toUpperCase() && result.confidence >= 0.70;
      
      if (isMatch) {
        setPhase("detected");
        setDetected(result.sign);
        onAnswer(targetSign);
        setFeedback(`Verified match: ${result.sign} (${Math.round(result.confidence * 100)}% confidence)`);
      } else {
        setPhase("failed");
        setDetected(result.sign);
        onAnswer(result.sign);
        setFeedback(`Recognised as ${result.sign}, but target was ${targetSign}.`);
      }
    } else {
      setPhase("failed");
      setDetected(null);
      setFeedback(result?.message || "Sign not recognised. Hold hand steady and try again.");
    }
    setBusy(false);
  }, [onAnswer, status, targetSign, videoRef]);

  const isCorrect = value.toUpperCase() === targetSign.toUpperCase();

  return (
    <div className="space-y-4">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => void runDetection("demo")}
              disabled={busy}
            >
              <Sparkles aria-hidden="true" />
              Demo Assessment (no camera)
            </Button>
          ) : null}
          <Button
            variant="hero"
            size="sm"
            onClick={() => void runDetection("ai")}
            disabled={busy || status !== "ready"}
          >
            <Cpu aria-hidden="true" />
            {busy ? "Evaluating Hand Pose…" : "Record & Verify Sign"}
          </Button>
        </div>
      </CameraPreview>

      {feedback && (
        <p className="flex items-center gap-2 text-sm font-medium">
          {isCorrect ? (
            <>
              <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
              <span className="text-success">{feedback}</span>
            </>
          ) : (
            <>
              <XCircle className="size-4 text-destructive" aria-hidden="true" />
              <span className="text-destructive">{feedback}</span>
            </>
          )}
        </p>
      )}

      {!value && !feedback && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="size-3.5 text-primary" />
          <span>Show the <strong className="text-foreground">{targetSign}</strong> sign clearly to your camera, then click "Record & Verify Sign".</span>
        </div>
      )}
    </div>
  );
}
