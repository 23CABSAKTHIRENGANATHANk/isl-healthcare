/**
 * Professional ISL Video Player
 * Features: Play/Pause, Replay, Playback Speed, Fullscreen, Volume, Progress Bar
 * Keyboard shortcuts: Space (play/pause), Fullscreen (f), Volume (+/-), Speed (>, <)
 */
import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface VideoPlayerProps {
  src: string | null;
  title: string;
  poster?: string;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
  onEnded?: () => void;
  captions?: Array<{ at: number; text: string }>;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25];

export function VideoPlayer({
  src,
  title,
  poster,
  autoPlay = false,
  controls = true,
  className = "",
  onEnded,
  captions = [],
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [currentCaptionText, setCurrentCaptionText] = useState("");
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlayPause();
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "ArrowRight":
          videoRef.current.currentTime = Math.min(
            duration,
            videoRef.current.currentTime + 5,
          );
          break;
        case "ArrowLeft":
          videoRef.current.currentTime = Math.max(
            0,
            videoRef.current.currentTime - 5,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume((v) => Math.min(1, v + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume((v) => Math.max(0, v - 0.1));
          break;
        case "KeyM":
          toggleMute();
          break;
        case "Comma":
          if (e.shiftKey) {
            const currentIdx = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
            if (currentIdx > 0) {
              setPlaybackSpeed(PLAYBACK_SPEEDS[currentIdx - 1]);
            }
          }
          break;
        case "Period":
          if (e.shiftKey) {
            const currentIdx = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
            if (currentIdx < PLAYBACK_SPEEDS.length - 1) {
              setPlaybackSpeed(PLAYBACK_SPEEDS[currentIdx + 1]);
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [duration, playbackSpeed, videoRef]);

  // Update playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Update volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Update captions
  useEffect(() => {
    const caption = captions.find(
      (c) => currentTime >= c.at && currentTime < c.at + 3,
    );
    setCurrentCaptionText(caption?.text || "");
  }, [currentTime, captions]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  const handleVideoError = () => {
    console.error(`Failed to load video: ${src}`);
    setHasError(true);
  };

  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressChange = (value: number[]) => {
    const newTime = value[0];
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (hasError || !src) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-2xl bg-destructive/10 ${className}`}
      >
        <div className="aspect-video w-full flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-3" />
            <p className="text-sm font-medium text-foreground">Video not found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {src || "No video URL provided"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-2xl bg-black group ${className}`}
    >
      {/* Video Element */}
      <div className="aspect-video w-full relative">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="h-full w-full object-contain"
          onError={handleVideoError}
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={onEnded}
          playsInline
        />

        {/* Captions Overlay */}
        {currentCaptionText && (
          <div className="absolute bottom-20 left-0 right-0 text-center px-4 py-2 bg-black/70">
            <p className="text-sm text-white">{currentCaptionText}</p>
          </div>
        )}

        {/* Center Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={togglePlayPause}
            className="flex items-center justify-center rounded-full bg-white/90 p-4 shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={isPlaying ? "Pause sign video" : "Play sign video"}
          >
            {isPlaying ? (
              <Pause className="h-8 w-8 text-black" />
            ) : (
              <Play className="h-8 w-8 text-black" />
            )}
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      {controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress Bar */}
          <div className="mb-3 flex items-center gap-2">
            <Slider
              value={[currentTime]}
              max={duration || 0}
              step={0.1}
              onValueChange={handleProgressChange}
              className="flex-1"
              aria-label="Video progress"
            />
            <span className="text-xs text-white/70 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <Button
                size="icon"
                variant="ghost"
                onClick={togglePlayPause}
                className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              {/* Replay */}
              <Button
                size="icon"
                variant="ghost"
                onClick={handleReplay}
                className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
                aria-label="Replay video"
                title="Replay (R)"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              {/* Playback Speed */}
              <div className="flex items-center gap-1">
                {PLAYBACK_SPEEDS.map((speed) => (
                  <Button
                    key={speed}
                    size="sm"
                    variant={playbackSpeed === speed ? "default" : "ghost"}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`h-7 px-2 text-xs font-medium ${
                      playbackSpeed === speed
                        ? "bg-primary text-primary-foreground"
                        : "text-white hover:bg-white/20"
                    }`}
                    aria-label={`Playback speed ${speed}x`}
                  >
                    {speed}x
                  </Button>
                ))}
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2 ml-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleMute}
                  className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>

                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={(value) => {
                    setVolume(value[0]);
                    setIsMuted(false);
                  }}
                  className="w-16"
                  aria-label="Volume"
                />
              </div>
            </div>

            {/* Fullscreen */}
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleFullscreen}
              className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Keyboard Hints */}
          <p className="text-xs text-white/50 mt-2">
            Space: Play/Pause | F: Fullscreen | Arrow keys: Seek/Volume | M: Mute | &lt;/&gt;: Speed
          </p>
        </div>
      )}
    </div>
  );
}
