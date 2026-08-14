/**
 * Sign Display Component — ISL Setu
 * Displays real ISL video demonstration with slow-motion speed controls (0.5x, 0.75x, 1x, 1.25x)
 * and rich interactive hand gesture guidance.
 * 
 * Features:
 * - Automatic video URL resolution from mapping system
 * - Multiple fallback candidates for video sources
 * - Speed control for learning (0.5x, 0.75x, 1x, 1.25x)
 * - Fullscreen support
 * - Audio pronunciation on demand
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
import { generateVideoUrlCandidates } from "@/services/video-system";

interface SignDisplayProps {
  gloss: string;
  meaning: string;
  videoUrl?: string | null;
  signId?: string; // For video mapping lookup
  demoMode?: boolean;
  steps?: string[];
  regionNote?: string;
  className?: string;
}

export function SignDisplay({
  gloss,
  meaning,
  videoUrl,
  signId,
  demoMode = false,
  steps = [],
  regionNote,
  className = "",
}: SignDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate prioritized candidate URLs using enhanced video system
  const candidateUrls = useMemo(() => {
    // Use the enhanced video system that includes mapping fallbacks
    return generateVideoUrlCandidates(gloss, signId || videoUrl || undefined);
  }, [gloss, signId, videoUrl]);

  const currentUrl = candidateUrls[candidateIdx] || candidateUrls[0];

  // Auto-play and handle speed changes on sign change
  useEffect(() => {
    setHasError(false);
    setCandidateIdx(0);
    setIsPlaying(true);
  }, [gloss, videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      videoRef.current.play().catch(() => {});
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

  return (
    <div
      ref={containerRef}
      className={`group relative w-full overflow-hidden rounded-3xl border border-border/80 bg-neutral-950 shadow-2xl ${className}`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          key={currentUrl}
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
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/85 via-black/40 to-transparent p-4 text-white">
          <div className="flex items-center gap-2">
            <span className="flex size-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
            <span className="font-display text-base font-bold tracking-wide text-white">
              {gloss}
            </span>
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
              HD ISL Video Demo
            </span>
          </div>

          {speed !== 1.0 && (
            <span className="rounded-lg bg-teal/25 border border-teal/40 px-2.5 py-1 text-xs font-bold text-teal-300 backdrop-blur-md">
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
        <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 text-white">
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
