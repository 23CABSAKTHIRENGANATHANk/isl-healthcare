import { AlertTriangle, Camera, CameraOff, Loader2, ShieldCheck } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CameraStatus } from "@/hooks/use-camera";

export type RecognitionPhase = "idle" | "scanning" | "recognising" | "detected" | "failed";

const phaseLabels: Record<RecognitionPhase, string> = {
  idle: "Camera Ready",
  scanning: "Scanning…",
  recognising: "Recognising…",
  detected: "Detected ✓",
  failed: "Not recognised",
};

interface CameraPreviewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  message?: string;
  phase: RecognitionPhase;
  onStart: () => void;
  targetSign?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Dark-surface camera stage. Dark UI is used deliberately here for contrast
 * against a live video feed. No frames leave the device.
 */
export function CameraPreview({
  videoRef,
  status,
  message,
  phase,
  onStart,
  targetSign,
  className,
  children,
}: CameraPreviewProps) {
  const live = status === "ready";

  return (
    <div className={cn("dark", className)}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
            <span
              className={cn(
                "size-2.5 rounded-full",
                live
                  ? "bg-success"
                  : status === "requesting"
                    ? "bg-warning"
                    : "bg-muted-foreground",
              )}
              aria-hidden="true"
            />
            {live
              ? phaseLabels[phase]
              : status === "requesting"
                ? "Requesting camera…"
                : "Camera off"}
          </p>
          {targetSign ? (
            <p className="rounded-full bg-primary/15 px-3 py-1 text-sm font-bold tracking-wide text-primary">
              SHOW: {targetSign}
            </p>
          ) : null}
        </div>

        <div className="relative aspect-video w-full bg-background">
          <video
            ref={videoRef}
            playsInline
            muted
            aria-label="Live camera preview for sign practice"
            className={cn("size-full object-cover", live ? "opacity-100" : "opacity-0")}
          />

          {/* Hand-position guidance frame */}
          {live ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div
                className={cn(
                  "relative h-[72%] w-[52%] rounded-3xl border-2 border-dashed",
                  phase === "detected"
                    ? "border-success"
                    : phase === "failed"
                      ? "border-destructive"
                      : "border-primary/70",
                )}
              >
                <span className="absolute -top-7 left-0 rounded-md bg-card/85 px-2 py-0.5 text-xs font-medium text-card-foreground">
                  Keep your hand inside the frame
                </span>
                {phase === "scanning" || phase === "recognising" ? (
                  <span className="absolute inset-x-0 top-0 h-1/3 animate-scan rounded-3xl bg-gradient-to-b from-primary/40 to-transparent" />
                ) : null}
              </div>
            </div>
          ) : null}

          {!live ? (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              {status === "requesting" ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Waiting for camera permission…
                </p>
              ) : status === "denied" || status === "unavailable" || status === "error" ? (
                <div className="max-w-sm space-y-3">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/15 text-destructive">
                    {status === "denied" ? (
                      <CameraOff className="size-6" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="size-6" aria-hidden="true" />
                    )}
                  </span>
                  <h3 className="text-base font-semibold text-card-foreground">
                    {status === "denied" ? "Camera permission denied" : "Camera unavailable"}
                  </h3>
                  <p className="text-sm text-muted-foreground">{message}</p>
                  <Button variant="outline" onClick={onStart}>
                    Try camera again
                  </Button>
                </div>
              ) : (
                <div className="max-w-sm space-y-3">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                    <Camera className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="text-base font-semibold text-card-foreground">
                    Before we turn on your camera
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your camera is used for sign practice. Camera footage is not stored by default
                    and nothing is uploaded from this screen.
                  </p>
                  <Button variant="hero" onClick={onStart}>
                    <Camera aria-hidden="true" />
                    Start Camera
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
            Footage is processed on-device in this demo and is not stored.
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
