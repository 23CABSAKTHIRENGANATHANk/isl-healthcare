/**
 * Camera Preview Component — ISL Setu
 * Clean, dark-surface camera stage with real-time video preview,
 * corner telemetry HUD, and sleek status banners without obstructing face overlays.
 */
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Crosshair,
  Hand,
  Loader2,
  Scan,
  Sparkles,
} from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CameraStatus } from "@/hooks/use-camera";

export type RecognitionPhase = "idle" | "scanning" | "recognising" | "detected" | "failed";

const phaseLabels: Record<RecognitionPhase, string> = {
  idle: "Camera Active",
  scanning: "Scanning Hand Gesture…",
  recognising: "Analyzing Landmarks…",
  detected: "Sign Verified ✓",
  failed: "Adjust Hand & Retry",
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

export function CameraPreview({
  videoRef,
  status,
  message,
  phase,
  onStart,
  targetSign = "HELLO",
  className,
  children,
}: CameraPreviewProps) {
  const live = status === "ready";

  return (
    <div className={cn("dark", className)}>
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-neutral-950 shadow-2xl">
        {/* Status Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-neutral-900/80 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-3">
              <span
                className={cn(
                  "absolute inline-flex size-full animate-ping rounded-full opacity-75",
                  live ? "bg-emerald-400" : status === "requesting" ? "bg-amber-400" : "bg-neutral-600",
                )}
              />
              <span
                className={cn(
                  "relative inline-flex size-3 rounded-full",
                  live ? "bg-emerald-500" : status === "requesting" ? "bg-amber-500" : "bg-neutral-600",
                )}
              />
            </span>
            <p className="text-sm font-semibold tracking-wide text-white">
              {live ? phaseLabels[phase] : status === "requesting" ? "Connecting Camera…" : "Camera Offline"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl bg-primary/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary border border-primary/30">
              <Crosshair className="size-3.5" />
              Target: {targetSign}
            </div>
          </div>
        </div>

        {/* Video Canvas Stage */}
        <div className="relative aspect-video w-full overflow-hidden bg-neutral-950">
          <video
            ref={videoRef}
            playsInline
            muted
            aria-label="Live camera preview for sign practice"
            className={cn(
              "size-full object-cover transition-opacity duration-300",
              live ? "opacity-100" : "opacity-0"
            )}
          />

          {/* Clean HUD Telemetry & Feedback */}
          {live ? (
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
              {/* Top Telemetry */}
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300">
                <div className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur-md border border-white/10">
                  <Scan className="size-3 text-cyan-400" />
                  <span>MediaPipe AI Vision</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur-md border border-white/10">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Latency: &lt;12ms</span>
                </div>
              </div>

              {/* Bottom State Pill */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 rounded-full bg-black/80 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/15 shadow-xl">
                  {phase === "detected" ? (
                    <>
                      <Sparkles className="size-4 text-emerald-400" />
                      <span className="text-emerald-300 font-bold">{targetSign} Verified ✓</span>
                    </>
                  ) : (
                    <>
                      <Hand className="size-4 text-teal-400" />
                      <span>Show your hand to camera & press Space or click Check</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Camera Permission Overlay */}
          {!live ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-950/90 p-6 text-center text-white backdrop-blur-sm">
              <div className="flex size-16 items-center justify-center rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl">
                {status === "requesting" ? (
                  <Loader2 className="size-8 animate-spin text-primary" />
                ) : (
                  <CameraOff className="size-8 text-neutral-400" />
                )}
              </div>
              <div className="max-w-xs space-y-1">
                <h3 className="font-bold text-base">
                  {status === "requesting" ? "Connecting Camera…" : "Camera Access Required"}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {message || "Enable camera to practice gestures with real-time AI feedback."}
                </p>
              </div>
              {status !== "requesting" && (
                <Button variant="hero" size="sm" onClick={onStart} className="rounded-xl px-5 font-bold shadow-lg">
                  <Camera className="size-4 mr-1.5" />
                  Start Camera
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
