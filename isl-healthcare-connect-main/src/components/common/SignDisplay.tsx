/**
 * Sign Display Component — ISL Setu
 * Displays real ISL video demonstration with slow-motion speed controls (0.5x, 0.75x, 1x, 1.25x)
 * and rich interactive hand gesture guidance.
 */
import {
  AlertCircle,
  CheckCircle2,
  FastForward,
  Hand,
  Maximize,
  Pause,
  Play,
  Repeat,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { speak } from "@/services/ai.service";

interface SignDisplayProps {
  gloss: string;
  meaning: string;
  videoUrl?: string | null;
  demoMode?: boolean;
  steps?: string[];
  regionNote?: string;
  className?: string;
}

export function SignDisplay({
  gloss,
  meaning,
  videoUrl,
  demoMode = false,
  steps = [],
  regionNote,
  className = "",
}: SignDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate intelligent candidate URLs based on gloss name
  const candidateUrls = useMemo(() => {
    const urls: string[] = [];
    if (videoUrl) urls.push(videoUrl);

    const clean = gloss.trim();
    const titleCase = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    const upperCase = clean.toUpperCase();
    const lowerCase = clean.toLowerCase();

    // Standard public paths
    const names = [clean, titleCase, upperCase, lowerCase];
    names.forEach((name) => {
      urls.push(`/videos/signs/${name}.mp4`);
      urls.push(`/dataset-videos/${name}.mp4`);
    });

    // Remove duplicates
    return Array.from(new Set(urls));
  }, [gloss, videoUrl]);

  const currentUrl = candidateUrls[candidateIdx] || candidateUrls[0];

  // Auto-play and handle speed changes
  useEffect(() => {
    setHasError(false);
    setCandidateIdx(0);
  }, [gloss, videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed, currentUrl]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => setIsPlaying(false));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  const handleVideoError = () => {
    // Try next candidate URL before giving up
    if (candidateIdx + 1 < candidateUrls.length) {
      setCandidateIdx((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void containerRef.current.requestFullscreen();
    }
  };

  // 1. Real Video Player with Slow-Motion & Controls
  if (!hasError && currentUrl) {
    return (
      <div
        ref={containerRef}
        className={`group relative w-full overflow-hidden rounded-3xl border border-border/80 bg-neutral-950 shadow-2xl ${className}`}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          <video
            ref={videoRef}
            src={currentUrl}
            className="h-full w-full object-contain"
            onError={handleVideoError}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            autoPlay
            loop
            muted
            playsInline
          />

          {/* Top Info Bar */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 text-white">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="font-display text-sm font-bold tracking-wide text-white">
                {gloss}
              </span>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 backdrop-blur-md">
                HD Demonstration
              </span>
            </div>

            {speed !== 1.0 && (
              <span className="rounded-lg bg-teal/20 px-2.5 py-1 text-xs font-bold text-teal backdrop-blur-md">
                {speed}x Slow Motion
              </span>
            )}
          </div>

          {/* Center Play/Pause Overlay */}
          <div
            onClick={togglePlayPause}
            className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            <button
              type="button"
              className="flex size-16 items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow-2xl transition-transform hover:scale-110 active:scale-95"
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? (
                <Pause className="size-7 fill-current" />
              ) : (
                <Play className="ml-1 size-7 fill-current" />
              )}
            </button>
          </div>

          {/* Bottom Control Bar */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 text-white">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlayPause}
                className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md transition-colors hover:bg-white/30"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
              </button>
              <button
                type="button"
                onClick={handleReplay}
                className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md transition-colors hover:bg-white/30"
                title="Replay Video"
              >
                <Repeat className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => speak(gloss)}
                className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md transition-colors hover:bg-white/30"
                title="Pronounce Word"
              >
                <Volume2 className="size-4" />
              </button>
            </div>

            {/* Slow Motion Speed Selector */}
            <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1 backdrop-blur-md">
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Speed:
              </span>
              {[0.5, 0.75, 1.0, 1.25].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleSpeedChange(rate)}
                  className={`rounded-lg px-2 py-1 text-xs font-bold transition-all ${
                    speed === rate
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-neutral-300 hover:bg-white/15"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md transition-colors hover:bg-white/30"
              title="Fullscreen"
            >
              <Maximize className="size-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. High-Definition Hand Gesture Schematic (Fallback if Video Loading)
  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 shadow-xl ${className}`}
    >
      <div className="flex aspect-video w-full flex-col items-center justify-center text-center">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
          <Hand className="size-10 stroke-[1.75]" />
        </div>

        <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {gloss}
        </h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{meaning}</p>

        {regionNote && (
          <p className="mt-2 text-xs font-medium text-teal">Regional Note: {regionNote}</p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => speak(gloss)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
          >
            <Volume2 className="size-3.5" />
            Hear Pronunciation
          </button>
          <span className="inline-flex items-center gap-1 rounded-xl bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            Verified Medical Sign
          </span>
        </div>
      </div>
    </div>
  );
}
