/**
 * Sign Display Component
 * Shows hand sign with video, image, or demo mode with gradients
 * Used in lesson player and practice screens
 */
import { AlertCircle, Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface SignDisplayProps {
  gloss: string;
  meaning: string;
  videoUrl?: string | null;
  demoMode?: boolean;
  className?: string;
}

export function SignDisplay({
  gloss,
  meaning,
  videoUrl,
  demoMode = false,
  className = "",
}: SignDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play video when component mounts or videoUrl changes
  useEffect(() => {
    if (videoRef.current && videoUrl && !demoMode) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked by browser
        setIsPlaying(false);
      });
    }
  }, [videoUrl, demoMode]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoError = () => {
    console.error(`Failed to load video for sign: ${gloss}`);
    setHasError(true);
  };

  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);

  // If video URL exists and not in demo mode, show video player
  if (videoUrl && !demoMode && !hasError) {
    return (
      <div className={`relative w-full overflow-hidden rounded-2xl bg-black ${className}`}>
        <div className="aspect-video w-full">
          <video
            ref={videoRef}
            src={videoUrl}
            className="h-full w-full object-cover"
            onError={handleVideoError}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            loop
            muted
            playsInline
          />

          {/* Video Controls Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
            <button
              onClick={togglePlayPause}
              className="flex items-center justify-center rounded-full bg-white/90 p-4 shadow-lg transition-transform hover:scale-110"
              aria-label={isPlaying ? "Pause sign video" : "Play sign video"}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 text-black" />
              ) : (
                <Play className="h-6 w-6 text-black" />
              )}
            </button>
          </div>

          {/* Bottom Label */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent px-4 py-3 text-white">
            <p className="text-sm font-semibold">{gloss}</p>
            <p className="text-xs opacity-75">{meaning}</p>
          </div>
        </div>
      </div>
    );
  }

  // If video failed or demo mode, show gradient placeholder
  return (
    <div
      className={`relative grid w-full aspect-video place-items-center rounded-2xl bg-gradient-to-br from-blue-500 via-teal-500 to-cyan-600 text-center text-white shadow-lg ${className}`}
    >
      <div className="px-6">
        <p className="text-3xl font-bold sm:text-5xl">{gloss}</p>
        <p className="mt-2 text-sm opacity-90 font-medium">{meaning}</p>

        {/* Demo Mode Badge */}
        {demoMode && <p className="mt-3 text-xs opacity-75">Demo Mode: illustrative sign playback</p>}

        {/* Error Badge */}
        {hasError && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-black/30 px-3 py-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs">Video unavailable</span>
          </div>
        )}
      </div>
    </div>
  );
}
