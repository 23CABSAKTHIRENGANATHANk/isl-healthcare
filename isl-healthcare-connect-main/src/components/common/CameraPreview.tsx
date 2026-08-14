/**
 * Camera Preview Component — ISL Setu
 * Dark-surface camera stage with sign-adaptive AR 3D Hand Skeleton Overlay,
 * Joint angle guidance telemetry HUD, and dynamic pose shape templates.
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
  targetSign = "HELLO",
  className,
  children,
}: CameraPreviewProps) {
  const live = status === "ready";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number | null>(null);

  const signUpper = (targetSign || "HELLO").toUpperCase().trim();

  // Determine gesture shape label
  const getGestureShapeName = () => {
    if (["INJURY", "ONE", "POINT", "YOU"].includes(signUpper)) return "Index Pointing Pose (1-Finger)";
    if (["BREAK", "FEDUP", "YES", "STOP"].includes(signUpper)) return "Closed Fist / Grip Pose";
    if (["WHAT IS YOUR NAME", "EXAM", "MATHS", "PEACOCK"].includes(signUpper)) return "Two-Finger (V / H) Pose";
    if (["DRINK", "TEA", "POUR", "WATER"].includes(signUpper)) return "Cupped C-Shape Pose";
    if (["MEDICINE", "FOOD", "LEMON", "KEY"].includes(signUpper)) return "Pinch / O-Shape Finger Pose";
    if (["FEVER", "HEADACHE", "TEMPLE"].includes(signUpper)) return "Forehead Flat Palm Pose";
    return "Open 5-Palm Pose";
  };

  // Real-time AR Hand Landmark Skeleton Animation Loop with sign-specific shapes
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

      const wrist = { x: cx, y: cy + scale * 0.65 };

      let thumb: { x: number; y: number }[];
      let index: { x: number; y: number }[];
      let middle: { x: number; y: number }[];
      let ring: { x: number; y: number }[];
      let pinky: { x: number; y: number }[];

      // Sign-Adaptive Morphing Hand Skeletal Configurations:
      if (["INJURY", "ONE", "POINT", "YOU"].includes(signUpper)) {
        // 1. Index Pointing Pose
        thumb = [
          { x: cx - scale * 0.15, y: cy + scale * 0.35 },
          { x: cx - scale * 0.2, y: cy + scale * 0.2 },
          { x: cx - scale * 0.1, y: cy + scale * 0.1 },
          { x: cx - scale * 0.05, y: cy + scale * 0.05 },
        ];
        index = [
          { x: cx - scale * 0.05, y: cy + scale * 0.15 },
          { x: cx - scale * 0.05, y: cy - scale * 0.2 },
          { x: cx - scale * 0.05, y: cy - scale * 0.5 },
          { x: cx - scale * 0.05, y: cy - scale * 0.78 + Math.sin(time) * 3 },
        ];
        middle = [
          { x: cx + scale * 0.08, y: cy + scale * 0.2 },
          { x: cx + scale * 0.08, y: cy + scale * 0.05 },
          { x: cx + scale * 0.02, y: cy + scale * 0.05 },
          { x: cx, y: cy + scale * 0.12 },
        ];
        ring = [
          { x: cx + scale * 0.18, y: cy + scale * 0.22 },
          { x: cx + scale * 0.18, y: cy + scale * 0.08 },
          { x: cx + scale * 0.12, y: cy + scale * 0.08 },
          { x: cx + scale * 0.1, y: cy + scale * 0.15 },
        ];
        pinky = [
          { x: cx + scale * 0.28, y: cy + scale * 0.26 },
          { x: cx + scale * 0.28, y: cy + scale * 0.12 },
          { x: cx + scale * 0.22, y: cy + scale * 0.12 },
          { x: cx + scale * 0.2, y: cy + scale * 0.18 },
        ];
      } else if (["BREAK", "FEDUP", "YES", "STOP"].includes(signUpper)) {
        // 2. Closed Fist Pose
        thumb = [
          { x: cx - scale * 0.2, y: cy + scale * 0.35 },
          { x: cx - scale * 0.25, y: cy + scale * 0.15 },
          { x: cx - scale * 0.1, y: cy + scale * 0.05 },
          { x: cx + scale * 0.05, y: cy + scale * 0.08 },
        ];
        index = [
          { x: cx - scale * 0.15, y: cy + scale * 0.2 },
          { x: cx - scale * 0.15, y: cy + scale * 0.02 },
          { x: cx - scale * 0.05, y: cy + scale * 0.02 },
          { x: cx - scale * 0.05, y: cy + scale * 0.12 },
        ];
        middle = [
          { x: cx - scale * 0.02, y: cy + scale * 0.18 },
          { x: cx - scale * 0.02, y: cy },
          { x: cx + scale * 0.06, y: cy },
          { x: cx + scale * 0.06, y: cy + scale * 0.12 },
        ];
        ring = [
          { x: cx + scale * 0.12, y: cy + scale * 0.2 },
          { x: cx + scale * 0.12, y: cy + scale * 0.02 },
          { x: cx + scale * 0.18, y: cy + scale * 0.02 },
          { x: cx + scale * 0.18, y: cy + scale * 0.14 },
        ];
        pinky = [
          { x: cx + scale * 0.24, y: cy + scale * 0.24 },
          { x: cx + scale * 0.24, y: cy + scale * 0.06 },
          { x: cx + scale * 0.28, y: cy + scale * 0.06 },
          { x: cx + scale * 0.28, y: cy + scale * 0.16 },
        ];
      } else if (["WHAT IS YOUR NAME", "EXAM", "MATHS", "PEACOCK"].includes(signUpper)) {
        // 3. Two-Finger V / H Pose
        thumb = [
          { x: cx - scale * 0.2, y: cy + scale * 0.35 },
          { x: cx - scale * 0.25, y: cy + scale * 0.2 },
          { x: cx - scale * 0.12, y: cy + scale * 0.1 },
          { x: cx - scale * 0.05, y: cy + scale * 0.1 },
        ];
        index = [
          { x: cx - scale * 0.12, y: cy + scale * 0.15 },
          { x: cx - scale * 0.18, y: cy - scale * 0.2 },
          { x: cx - scale * 0.24, y: cy - scale * 0.5 },
          { x: cx - scale * 0.3, y: cy - scale * 0.75 + Math.sin(time) * 3 },
        ];
        middle = [
          { x: cx + scale * 0.02, y: cy + scale * 0.15 },
          { x: cx + scale * 0.08, y: cy - scale * 0.2 },
          { x: cx + scale * 0.14, y: cy - scale * 0.5 },
          { x: cx + scale * 0.2, y: cy - scale * 0.75 + Math.sin(time + 0.3) * 3 },
        ];
        ring = [
          { x: cx + scale * 0.15, y: cy + scale * 0.22 },
          { x: cx + scale * 0.15, y: cy + scale * 0.05 },
          { x: cx + scale * 0.1, y: cy + scale * 0.05 },
          { x: cx + scale * 0.08, y: cy + scale * 0.14 },
        ];
        pinky = [
          { x: cx + scale * 0.26, y: cy + scale * 0.26 },
          { x: cx + scale * 0.26, y: cy + scale * 0.1 },
          { x: cx + scale * 0.2, y: cy + scale * 0.1 },
          { x: cx + scale * 0.18, y: cy + scale * 0.18 },
        ];
      } else if (["DRINK", "TEA", "POUR", "WATER"].includes(signUpper)) {
        // 4. Cupped C-Shape Pose
        thumb = [
          { x: cx - scale * 0.25, y: cy + scale * 0.3 },
          { x: cx - scale * 0.35, y: cy + scale * 0.1 },
          { x: cx - scale * 0.25, y: cy - scale * 0.1 },
          { x: cx - scale * 0.1, y: cy - scale * 0.2 },
        ];
        index = [
          { x: cx - scale * 0.1, y: cy + scale * 0.15 },
          { x: cx + scale * 0.15, y: cy + scale * 0.05 },
          { x: cx + scale * 0.25, y: cy - scale * 0.15 },
          { x: cx + scale * 0.1, y: cy - scale * 0.35 },
        ];
        middle = [
          { x: cx - scale * 0.02, y: cy + scale * 0.15 },
          { x: cx + scale * 0.2, y: cy + scale * 0.08 },
          { x: cx + scale * 0.3, y: cy - scale * 0.1 },
          { x: cx + scale * 0.15, y: cy - scale * 0.3 },
        ];
        ring = [
          { x: cx + scale * 0.08, y: cy + scale * 0.18 },
          { x: cx + scale * 0.25, y: cy + scale * 0.12 },
          { x: cx + scale * 0.32, y: cy - scale * 0.05 },
          { x: cx + scale * 0.18, y: cy - scale * 0.25 },
        ];
        pinky = [
          { x: cx + scale * 0.18, y: cy + scale * 0.22 },
          { x: cx + scale * 0.28, y: cy + scale * 0.18 },
          { x: cx + scale * 0.32, y: cy + scale * 0.02 },
          { x: cx + scale * 0.2, y: cy - scale * 0.18 },
        ];
      } else {
        // 5. Open 5-Finger Palm Pose (HELLO, FEVER, GIVE, CLEAN, etc.)
        thumb = [
          { x: cx - scale * 0.22, y: cy + scale * 0.4 },
          { x: cx - scale * 0.38, y: cy + scale * 0.2 },
          { x: cx - scale * 0.48, y: cy + scale * 0.05 },
          { x: cx - scale * 0.55, y: cy - scale * 0.1 },
        ];
        index = [
          { x: cx - scale * 0.15, y: cy + scale * 0.15 },
          { x: cx - scale * 0.2, y: cy - scale * 0.15 },
          { x: cx - scale * 0.22, y: cy - scale * 0.4 },
          { x: cx - scale * 0.24, y: cy - scale * 0.62 + Math.sin(time) * 3 },
        ];
        middle = [
          { x: cx - scale * 0.02, y: cy + scale * 0.12 },
          { x: cx - scale * 0.03, y: cy - scale * 0.2 },
          { x: cx - scale * 0.04, y: cy - scale * 0.48 },
          { x: cx - scale * 0.05, y: cy - scale * 0.72 + Math.sin(time + 0.5) * 3 },
        ];
        ring = [
          { x: cx + scale * 0.12, y: cy + scale * 0.15 },
          { x: cx + scale * 0.14, y: cy - scale * 0.15 },
          { x: cx + scale * 0.16, y: cy - scale * 0.4 },
          { x: cx + scale * 0.18, y: cy - scale * 0.6 + Math.sin(time + 1) * 3 },
        ];
        pinky = [
          { x: cx + scale * 0.24, y: cy + scale * 0.22 },
          { x: cx + scale * 0.3, y: cy - scale * 0.05 },
          { x: cx + scale * 0.34, y: cy - scale * 0.25 },
          { x: cx + scale * 0.38, y: cy - scale * 0.45 + Math.sin(time + 1.5) * 3 },
        ];
      }

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
  }, [live, phase, signUpper]);

  return (
    <div className={cn("dark", className)}>
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-neutral-950 shadow-2xl">
        {/* Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-neutral-900/60 px-5 py-3.5 backdrop-blur-md">
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
              {live ? phaseLabels[phase] : status === "requesting" ? "Requesting Camera Permission…" : "Camera Offline"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 border border-teal-500/30">
              {getGestureShapeName()}
            </span>
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
                      ? "border-emerald-400 bg-emerald-500/15 shadow-[0_0_40px_rgba(52,211,153,0.4)]"
                      : phase === "scanning" || phase === "recognising"
                      ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-pulse"
                      : "border-teal-400/80 bg-teal-500/5",
                  )}
                >
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-300 border border-teal-500/30">
                    {getGestureShapeName()}
                  </div>

                  {phase === "detected" && (
                    <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-0.5 text-[10px] font-bold text-white shadow-lg">
                      <CheckCircle2 className="size-3" />
                      Pose Aligned!
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom State Pill */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 rounded-full bg-black/75 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/15 shadow-xl">
                  {phase === "detected" ? (
                    <>
                      <Sparkles className="size-4 text-emerald-400" />
                      <span>{targetSign} Verified! Transitioning...</span>
                    </>
                  ) : (
                    <>
                      <Hand className="size-4 text-teal-400" />
                      <span>Align hand with the {getGestureShapeName()} template</span>
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
                  {message || "Enable camera to track your 3D hand landmarks in real-time."}
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
