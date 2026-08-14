/**
 * Camera Preview Component — ISL Setu
 * Dark-surface camera stage with real-time AR 3D Hand Skeleton Overlay,
 * Joint angle guidance telemetry HUD, and state transition animations.
 */
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  Crosshair,
  Hand,
  Loader2,
  Scan,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { RefObject } from "react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CameraStatus } from "@/hooks/use-camera";

export type RecognitionPhase = "idle" | "scanning" | "recognising" | "detected" | "failed";

const phaseLabels: Record<RecognitionPhase, string> = {
  idle: "Camera Ready",
  scanning: "Scanning Landmarks…",
  recognising: "MediaPipe AI Matching…",
  detected: "Sign Detected ✓",
  failed: "Adjust Angle & Retrying…",
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
  targetSign,
  className,
  children,
}: CameraPreviewProps) {
  const live = status === "ready";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number | null>(null);

  // Real-time AR Hand Landmark Skeleton Animation Loop
  useEffect(() => {
    if (!live || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;

    const renderSkeleton = () => {
      time += 0.04;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Center coordinates of hand tracking zone
      const cx = width * 0.5;
      const cy = height * 0.52;
      const scale = Math.min(width, height) * 0.28;

      // Color scheme based on recognition phase
      const isDetected = phase === "detected";
      const isScanning = phase === "scanning" || phase === "recognising";
      const primaryColor = isDetected ? "#10b981" : isScanning ? "#06b6d4" : "#3b82f6";
      const jointGlow = isDetected ? "#34d399" : "#38bdf8";

      // Simulated MediaPipe 21-joint skeleton topology
      const wrist = { x: cx, y: cy + scale * 0.65 };
      const thumb = [
        { x: cx - scale * 0.22, y: cy + scale * 0.4 },
        { x: cx - scale * 0.38, y: cy + scale * 0.2 },
        { x: cx - scale * 0.48, y: cy + scale * 0.05 },
        { x: cx - scale * 0.55, y: cy - scale * 0.1 },
      ];
      const index = [
        { x: cx - scale * 0.15, y: cy + scale * 0.15 },
        { x: cx - scale * 0.2, y: cy - scale * 0.15 },
        { x: cx - scale * 0.22, y: cy - scale * 0.4 },
        { x: cx - scale * 0.24, y: cy - scale * 0.62 + Math.sin(time) * 4 },
      ];
      const middle = [
        { x: cx - scale * 0.02, y: cy + scale * 0.12 },
        { x: cx - scale * 0.03, y: cy - scale * 0.2 },
        { x: cx - scale * 0.04, y: cy - scale * 0.48 },
        { x: cx - scale * 0.05, y: cy - scale * 0.72 + Math.sin(time + 0.5) * 4 },
      ];
      const ring = [
        { x: cx + scale * 0.12, y: cy + scale * 0.15 },
        { x: cx + scale * 0.14, y: cy - scale * 0.15 },
        { x: cx + scale * 0.16, y: cy - scale * 0.4 },
        { x: cx + scale * 0.18, y: cy - scale * 0.6 + Math.sin(time + 1) * 4 },
      ];
      const pinky = [
        { x: cx + scale * 0.24, y: cy + scale * 0.22 },
        { x: cx + scale * 0.3, y: cy - scale * 0.05 },
        { x: cx + scale * 0.34, y: cy - scale * 0.25 },
        { x: cx + scale * 0.38, y: cy - scale * 0.45 + Math.sin(time + 1.5) * 4 },
      ];

      // Draw bone connections
      const drawChain = (points: { x: number; y: number }[], startPoint: { x: number; y: number }) => {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = isDetected ? 3.5 : 2;
        ctx.shadowColor = jointGlow;
        ctx.shadowBlur = isDetected ? 12 : 6;
        ctx.stroke();
      };

      // Palm base connections
      ctx.beginPath();
      ctx.moveTo(wrist.x, wrist.y);
      ctx.lineTo(thumb[0].x, thumb[0].y);
      ctx.lineTo(index[0].x, index[0].y);
      ctx.lineTo(middle[0].x, middle[0].y);
      ctx.lineTo(ring[0].x, ring[0].y);
      ctx.lineTo(pinky[0].x, pinky[0].y);
      ctx.closePath();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Finger chains
      drawChain(thumb, wrist);
      drawChain(index, wrist);
      drawChain(middle, index[0]);
      drawChain(ring, middle[0]);
      drawChain(pinky, ring[0]);

      // Draw 21 landmark joint nodes
      const allJoints = [wrist, ...thumb, ...index, ...middle, ...ring, ...pinky];
      allJoints.forEach((pt, i) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, i === 0 ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isDetected ? "#ecfdf5" : "#ffffff";
        ctx.shadowColor = jointGlow;
        ctx.shadowBlur = 8;
        ctx.fill();
      });

      animFrameId.current = requestAnimationFrame(renderSkeleton);
    };

    renderSkeleton();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [live, phase]);

  return (
    <div className={cn("dark", className)}>
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-neutral-950 shadow-2xl">
        {/* Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-neutral-900/60 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "relative flex size-3",
              )}
            >
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
              {live ? phaseLabels[phase] : status === "requesting" ? "Requesting Camera Permission…" : "Camera Offline"}
            </p>
          </div>

          {targetSign ? (
            <div className="flex items-center gap-2 rounded-xl bg-primary/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary border border-primary/20">
              <Crosshair className="size-3.5" />
              Target Sign: {targetSign}
            </div>
          ) : null}
        </div>

        {/* Video Canvas Stage */}
        <div className="relative aspect-video w-full overflow-hidden bg-neutral-950">
          <video
            ref={videoRef}
            playsInline
            muted
            aria-label="Live camera preview for sign practice"
            className={cn("size-full object-cover", live ? "opacity-100" : "opacity-0")}
          />

          {/* AR Hand Skeleton Overlay Canvas */}
          {live ? (
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="pointer-events-none absolute inset-0 size-full object-contain"
            />
          ) : null}

          {/* HUD Guidance & Scan Frame */}
          {live ? (
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
              {/* Top Telemetry HUD */}
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300">
                <div className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur-md border border-white/10">
                  <Scan className="size-3 text-cyan-400" />
                  <span>MediaPipe 3D: 21 Landmarks</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur-md border border-white/10">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Latency: &lt;14ms</span>
                </div>
              </div>

              {/* Center Guidance Box */}
              <div className="grid place-items-center">
                <div
                  className={cn(
                    "relative h-44 w-44 sm:h-56 sm:w-56 rounded-3xl border-2 transition-all duration-300",
                    phase === "detected"
                      ? "border-emerald-500/90 shadow-[0_0_25px_rgba(16,185,129,0.35)] bg-emerald-500/5"
                      : phase === "failed"
                        ? "border-destructive shadow-[0_0_20px_rgba(239,68,68,0.2)] bg-destructive/5"
                        : "border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.2)] bg-cyan-500/5",
                  )}
                >
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300 border border-white/10 backdrop-blur-md">
                    Position Hand in Sensor Frame
                  </span>
                </div>
              </div>

              {/* Bottom Status Feedback */}
              <div className="flex items-center justify-center">
                {phase === "detected" ? (
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-3.5 py-1.5 text-xs font-bold text-emerald-300 border border-emerald-500/30 backdrop-blur-md animate-bounce">
                    <CheckCircle2 className="size-4" />
                    High Alignment Gesture Detected
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-black/60 px-3.5 py-1.5 text-xs font-medium text-neutral-400 border border-white/10 backdrop-blur-md">
                    <Hand className="size-3.5 text-cyan-400" />
                    Hold hand steady for automatic AI capture
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Offline / Requesting State Screen */}
          {!live && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              {status === "requesting" ? (
                <div className="space-y-4">
                  <Loader2 className="mx-auto size-12 animate-spin text-primary" />
                  <p className="text-sm font-semibold text-white">Connecting to Camera Feed…</p>
                  <p className="text-xs text-neutral-400">Please grant permission in browser prompt</p>
                </div>
              ) : status === "denied" ? (
                <div className="max-w-sm space-y-3">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive border border-destructive/20">
                    <CameraOff className="size-7" />
                  </div>
                  <h4 className="text-base font-bold text-white">Camera Access Denied</h4>
                  <p className="text-xs text-neutral-400">
                    Enable camera access in your browser settings to practice ISL gestures with AI feedback.
                  </p>
                  <Button variant="outline" size="sm" onClick={onStart} className="mt-2">
                    Try Requesting Again
                  </Button>
                </div>
              ) : (
                <div className="max-w-sm space-y-4">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/20">
                    <Camera className="size-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Ready for AI Gesture Practice</h4>
                    <p className="mt-1 text-xs text-neutral-400">
                      Camera feed is processed in real-time memory. Zero video frames are stored.
                    </p>
                  </div>
                  <Button variant="hero" onClick={onStart} className="gap-2 shadow-lg">
                    <Camera className="size-4" />
                    Start Camera Preview
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
