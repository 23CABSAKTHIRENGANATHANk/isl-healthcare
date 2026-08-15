/**
 * Camera Preview Component — ISL Setu
 * Production Camera Stage with Real-Time Landmark Skeleton Mesh Canvas,
 * Target Framing Silhouette, and Comprehensive Camera Accessories Toolbar.
 */
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Crosshair,
  Eye,
  EyeOff,
  Flame,
  FlipHorizontal,
  Hand,
  Layers,
  Loader2,
  Maximize2,
  Mic,
  Moon,
  RotateCcw,
  Scan,
  Settings2,
  Sliders,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  Zap,
  ZoomIn,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CameraStatus, CameraDevice } from "@/hooks/use-camera";
import type { LandmarkPoint, DetectionStrictness } from "@/services/ai.service";

export type RecognitionPhase = "idle" | "scanning" | "recognising" | "detected" | "failed";

const phaseLabels: Record<RecognitionPhase, string> = {
  idle: "Camera Active — Ready",
  scanning: "Scanning Hand Gesture…",
  recognising: "Analyzing 21 3D Landmarks…",
  detected: "Sign Verified ✓",
  failed: "Adjust Hand & Retry",
};

// Hand connections for drawing MediaPipe 21 landmark skeleton
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17],
];

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  message?: string;
  phase: RecognitionPhase;
  onStart: () => void;
  targetSign?: string;
  className?: string;
  children?: React.ReactNode;

  // Accessories Props
  devices?: CameraDevice[];
  selectedDeviceId?: string;
  onSwitchDevice?: (deviceId: string) => void;
  isMirrored?: boolean;
  onToggleMirror?: () => void;
  brightness?: number;
  contrast?: number;
  onToggleLowLight?: () => void;
  zoom?: number;
  onSetZoom?: (zoom: number) => void;

  // Real-time Landmark & Telemetry Props
  landmarks?: LandmarkPoint[][];
  fingerStates?: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  extendedCount?: number;
  confidence?: number;
  fps?: number;

  // Modes & Toggles
  showMesh?: boolean;
  onToggleMesh?: () => void;
  showGuide?: boolean;
  onToggleGuide?: () => void;
  autoDetect?: boolean;
  onToggleAutoDetect?: () => void;
  strictness?: DetectionStrictness;
  onSetStrictness?: (s: DetectionStrictness) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
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
  devices = [],
  selectedDeviceId,
  onSwitchDevice,
  isMirrored = true,
  onToggleMirror,
  brightness = 100,
  contrast = 100,
  onToggleLowLight,
  zoom = 1.0,
  onSetZoom,
  landmarks = [],
  fingerStates,
  extendedCount,
  confidence = 0,
  fps = 30,
  showMesh = true,
  onToggleMesh,
  showGuide = true,
  onToggleGuide,
  autoDetect = false,
  onToggleAutoDetect,
  strictness = "balanced",
  onSetStrictness,
  soundEnabled = true,
  onToggleSound,
}: CameraPreviewProps) {
  const live = status === "ready";
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isLowLightActive = brightness > 110;

  // Draw MediaPipe Landmark Mesh Skeleton on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dynamically synchronize canvas resolution with actual video stream dimensions
    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!live || !showMesh || !landmarks || landmarks.length === 0) {
      return;
    }

    const hand = landmarks[0];
    if (!hand || hand.length < 21) return;

    const cw = canvas.width;
    const ch = canvas.height;

    // Draw Skeleton Connection Bones
    ctx.lineWidth = 3;
    ctx.strokeStyle = phase === "detected" ? "rgba(52, 211, 153, 0.85)" : "rgba(45, 212, 191, 0.75)";
    ctx.lineCap = "round";

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = hand[startIdx];
      const p2 = hand[endIdx];
      if (!p1 || !p2) continue;

      const x1 = isMirrored ? (1 - p1.x) * cw : p1.x * cw;
      const y1 = p1.y * ch;
      const x2 = isMirrored ? (1 - p2.x) * cw : p2.x * cw;
      const y2 = p2.y * ch;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw Landmark Joint Dots & Fingertip Glow
    const FINGERTIPS = [4, 8, 12, 16, 20];
    for (let i = 0; i < hand.length; i++) {
      const pt = hand[i];
      const x = isMirrored ? (1 - pt.x) * cw : pt.x * cw;
      const y = pt.y * ch;

      const isTip = FINGERTIPS.includes(i);

      ctx.beginPath();
      ctx.arc(x, y, isTip ? 6 : 4, 0, 2 * Math.PI);

      if (isTip) {
        ctx.fillStyle = phase === "detected" ? "#10b981" : "#06b6d4";
        ctx.shadowColor = phase === "detected" ? "#34d399" : "#38bdf8";
        ctx.shadowBlur = 10;
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }
      ctx.fill();
    }
  }, [landmarks, live, showMesh, isMirrored, phase]);

  return (
    <div className={cn("dark select-none", className)}>
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-neutral-950 shadow-2xl">
        {/* Status Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-neutral-900/90 px-4 py-3 backdrop-blur-md">
          {/* Status & Live Pulse */}
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-3">
              <span
                className={cn(
                  "absolute inline-flex size-full animate-ping rounded-full opacity-75",
                  live ? "bg-emerald-400" : status === "requesting" ? "bg-amber-400" : "bg-neutral-600"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex size-3 rounded-full",
                  live ? "bg-emerald-500" : status === "requesting" ? "bg-amber-500" : "bg-neutral-600"
                )}
              />
            </span>
            <p className="text-xs sm:text-sm font-semibold tracking-wide text-white">
              {live ? phaseLabels[phase] : status === "requesting" ? "Connecting Camera…" : "Camera Offline"}
            </p>
          </div>

          {/* Target Sign Badge & Auto-Detect Indicator */}
          <div className="flex items-center gap-2">
            {autoDetect && live && (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] uppercase tracking-wider font-mono gap-1">
                <Zap className="size-3 animate-bounce" /> Auto-Detect On
              </Badge>
            )}
            {/* Camera Quality Indicator (GOOD / FAIR / POOR) */}
            {live && (
              <Badge
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 border",
                  (fps ?? 30) >= 20 && extendedCount && extendedCount > 0
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : (fps ?? 30) >= 12 || live
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                )}
              >
                Quality: {(fps ?? 30) >= 20 && extendedCount && extendedCount > 0 ? "GOOD" : (fps ?? 30) >= 12 ? "FAIR" : "POOR"}
              </Badge>
            )}

            <div className="flex items-center gap-1.5 rounded-xl bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary border border-primary/30">
              <Crosshair className="size-3.5" />
              {targetSign ? `Target: ${targetSign}` : "Mode: Open Recognition"}
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
            style={{
              filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              transform: `${isMirrored ? "scaleX(-1)" : "scaleX(1)"} scale(${zoom})`,
              transformOrigin: "center center",
            }}
            className={cn(
              "size-full object-cover transition-all duration-200",
              live ? "opacity-100" : "opacity-0"
            )}
          />

          {/* Landmark Canvas Overlay */}
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
            }}
            className={cn(
              "pointer-events-none absolute inset-0 size-full object-cover",
              live && showMesh ? "opacity-100" : "opacity-0"
            )}
          />

          {/* Target Framing Silhouette Guide Box & Dynamic Hand Quality Banner */}
          {live && showGuide && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <div
                className={cn(
                  "relative flex size-64 sm:size-72 items-center justify-center rounded-3xl border-2 border-dashed transition-all duration-300",
                  phase === "detected"
                    ? "border-emerald-400/80 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    : extendedCount && extendedCount > 0
                    ? "border-teal-400/70 bg-teal-500/5 shadow-[0_0_20px_rgba(20,184,166,0.2)]"
                    : "border-white/25 bg-black/10"
                )}
              >
                {/* Corner Accents */}
                <div className="absolute -left-1 -top-1 size-4 border-l-2 border-t-2 border-primary" />
                <div className="absolute -right-1 -top-1 size-4 border-r-2 border-t-2 border-primary" />
                <div className="absolute -bottom-1 -left-1 size-4 border-b-2 border-l-2 border-primary" />
                <div className="absolute -bottom-1 -right-1 size-4 border-b-2 border-r-2 border-primary" />

                {/* Guide Prompt & Positioning Feedback */}
                <div className="text-center px-4">
                  <Hand
                    className={cn(
                      "mx-auto size-12 mb-2 transition-all duration-300",
                      phase === "detected"
                        ? "text-emerald-400 scale-110"
                        : extendedCount && extendedCount > 0
                        ? "text-teal-300 scale-105 animate-pulse"
                        : "text-white/30"
                    )}
                  />
                  <p className="text-xs font-bold text-white tracking-wide drop-shadow-md">
                    {phase === "detected"
                      ? `${targetSign} Verified ✓`
                      : extendedCount && extendedCount > 0
                      ? `Good Position • ${extendedCount} Fingers Active`
                      : "Position Hand Inside Frame"}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-white/70">
                    Keep hand inside guide • Hold steady
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Clean HUD Telemetry & Real-Time Indicators */}
          {live ? (
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3.5 sm:p-4">
              {/* Top Telemetry Row */}
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1 backdrop-blur-md border border-white/10 shadow-lg">
                    <Scan className="size-3 text-cyan-400 animate-pulse" />
                    <span>MediaPipe 3D Landmark Vision</span>
                  </div>
                  {isLowLightActive && (
                    <div className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-2 py-1 text-amber-300 border border-amber-500/30">
                      <Sun className="size-3" />
                      <span>Boost On</span>
                    </div>
                  )}
                  {zoom > 1.0 && (
                    <div className="flex items-center gap-1 rounded-lg bg-primary/20 px-2 py-1 text-primary border border-primary/30">
                      <span>{zoom}x Zoom</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1 backdrop-blur-md border border-white/10">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{fps} FPS</span>
                  </div>
                </div>
              </div>

              {/* Bottom State Pill */}
              <div className="flex justify-center">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md border shadow-xl transition-all duration-300",
                    phase === "detected"
                      ? "bg-emerald-950/90 border-emerald-500/50 shadow-emerald-500/20"
                      : phase === "failed"
                      ? "bg-amber-950/90 border-amber-500/50 shadow-amber-500/20"
                      : "bg-black/85 border-white/15"
                  )}
                >
                  {phase === "detected" ? (
                    <>
                      <Sparkles className="size-4 text-emerald-400 animate-spin" />
                      <span className="text-emerald-300 font-bold">{targetSign} Verified ✓</span>
                    </>
                  ) : extendedCount && extendedCount > 0 ? (
                    <>
                      <Hand className="size-4 text-teal-400" />
                      <span>{extendedCount} Fingers Active • Ready to Match {targetSign}</span>
                    </>
                  ) : (
                    <>
                      <Hand className="size-4 text-neutral-400" />
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
                  {message || "Enable camera to practice gestures with real-time AI landmark feedback."}
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

        {/* ------------------------------------------------------------------- */}
        {/* Comprehensive Camera Accessories Toolbar (Mobile Responsive & Touch Scrollable) */}
        {/* ------------------------------------------------------------------- */}
        {live && (
          <div className="flex items-center justify-between gap-2 overflow-x-auto border-t border-border/60 bg-neutral-900/95 px-3 sm:px-4 py-2.5 text-xs backdrop-blur-md scrollbar-none">
            {/* Left Accessories: Video Controls */}
            <div className="flex shrink-0 items-center gap-1.5">
              <TooltipProvider delayDuration={150}>
                {/* Flip / Mirror Toggle */}
                {onToggleMirror && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isMirrored ? "hero" : "outline"}
                        size="sm"
                        onClick={onToggleMirror}
                        className="h-8 rounded-xl px-2.5 gap-1.5 text-xs font-semibold shrink-0"
                      >
                        <FlipHorizontal className="size-3.5" />
                        <span>Mirror</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Flip camera preview horizontally</TooltipContent>
                  </Tooltip>
                )}

                {/* Low-Light Boost Filter */}
                {onToggleLowLight && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isLowLightActive ? "hero" : "outline"}
                        size="sm"
                        onClick={onToggleLowLight}
                        className={cn(
                          "h-8 rounded-xl px-2.5 gap-1.5 text-xs font-semibold shrink-0",
                          isLowLightActive && "bg-amber-500 hover:bg-amber-600 text-black border-amber-400"
                        )}
                      >
                        <Sun className="size-3.5" />
                        <span>Light Boost</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Enhance brightness and contrast for dark rooms</TooltipContent>
                  </Tooltip>
                )}

                {/* Zoom Selector */}
                {onSetZoom && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const nextZoom = zoom === 1.0 ? 1.25 : zoom === 1.25 ? 1.5 : 1.0;
                          onSetZoom(nextZoom);
                        }}
                        className="h-8 rounded-xl px-2.5 gap-1 text-xs font-semibold shrink-0"
                      >
                        <ZoomIn className="size-3.5" />
                        <span>{zoom}x</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Cycle digital zoom (1.0x, 1.25x, 1.5x)</TooltipContent>
                  </Tooltip>
                )}

                {/* Skeleton Mesh Toggle */}
                {onToggleMesh && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={showMesh ? "hero" : "outline"}
                        size="sm"
                        onClick={onToggleMesh}
                        className="h-8 rounded-xl px-2.5 gap-1.5 text-xs font-semibold shrink-0"
                      >
                        <Layers className="size-3.5" />
                        <span>Skeleton Mesh</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Toggle real-time hand landmark skeleton overlay</TooltipContent>
                  </Tooltip>
                )}

                {/* Target Guide Silhouette Toggle */}
                {onToggleGuide && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={showGuide ? "hero" : "outline"}
                        size="sm"
                        onClick={onToggleGuide}
                        className="h-8 rounded-xl px-2.5 gap-1.5 text-xs font-semibold shrink-0"
                      >
                        <Crosshair className="size-3.5" />
                        <span>Guide Box</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Toggle hand placement target guide</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>

            {/* Right Accessories: AI Engine & Sensitivity Settings */}
            <div className="flex shrink-0 items-center gap-1.5 ml-2">
              <TooltipProvider delayDuration={150}>
                {/* Auto-Detect Mode Toggle */}
                {onToggleAutoDetect && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={autoDetect ? "hero" : "outline"}
                        size="sm"
                        onClick={onToggleAutoDetect}
                        className={cn(
                          "h-8 rounded-xl px-2.5 gap-1.5 text-xs font-semibold shrink-0",
                          autoDetect && "bg-emerald-500 hover:bg-emerald-600 text-black border-emerald-400"
                        )}
                      >
                        <Zap className="size-3.5" />
                        <span>Auto-Detect</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Automatically verify signs when held steady</TooltipContent>
                  </Tooltip>
                )}

                {/* Strictness Selector */}
                {onSetStrictness && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 rounded-xl px-2.5 gap-1 text-xs font-semibold shrink-0">
                        <Sliders className="size-3.5" />
                        <span className="capitalize">{strictness}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-neutral-900 border-neutral-800 text-white">
                      <DropdownMenuLabel className="text-xs text-neutral-400">Detection Sensitivity</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-neutral-800" />
                      <DropdownMenuItem onClick={() => onSetStrictness("lenient")} className="text-xs cursor-pointer">
                        🌱 Lenient (Best for dim light)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSetStrictness("balanced")} className="text-xs cursor-pointer">
                        ⚡ Balanced (Standard)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSetStrictness("strict")} className="text-xs cursor-pointer">
                        🎯 Strict (Certification grade)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Sound FX Toggle */}
                {onToggleSound && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={soundEnabled ? "ghost" : "outline"}
                        size="icon"
                        onClick={onToggleSound}
                        className="size-8 rounded-xl text-neutral-300 hover:text-white shrink-0"
                      >
                        {soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5 text-neutral-500" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{soundEnabled ? "Mute audio cues" : "Unmute audio cues"}</TooltipContent>
                  </Tooltip>
                )}

                {/* Device Switcher Dropdown */}
                {devices.length > 1 && onSwitchDevice && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="size-8 rounded-xl shrink-0">
                        <Settings2 className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-neutral-800 text-white">
                      <DropdownMenuLabel className="text-xs text-neutral-400">Select Camera Device</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-neutral-800" />
                      {devices.map((d) => (
                        <DropdownMenuItem
                          key={d.deviceId}
                          onClick={() => onSwitchDevice(d.deviceId)}
                          className={cn(
                            "text-xs cursor-pointer",
                            d.deviceId === selectedDeviceId && "font-bold text-primary"
                          )}
                        >
                          {d.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TooltipProvider>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
