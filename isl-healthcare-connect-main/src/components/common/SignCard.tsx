import { Camera, CheckCircle2, Hand, Info, Pause, Play, Repeat, Video, Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

import { DifficultyBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Sign } from "@/types";

/** Build a prioritised list of candidate video URLs for a sign */
function buildCandidateUrls(gloss: string, videoUrl?: string | null): string[] {
  const urls: string[] = [];
  if (videoUrl) urls.push(videoUrl);

  const clean = gloss.trim();
  const titleCased = clean
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  const sentenceCased = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  const upperCase = clean.toUpperCase();
  const lowerCase = clean.toLowerCase();

  const candidates = [
    clean,
    titleCased,
    sentenceCased,
    upperCase,
    lowerCase,
    "What is your Name",
    "Good morning",
    "Good afternoon",
    "Thank you",
  ];
  candidates.forEach((name) => {
    urls.push(`/videos/signs/${name}.mp4`);
    urls.push(`/videos/dataset-videos/${name}.mp4`);
    urls.push(`/dataset-videos/${name}.mp4`);
  });
  return Array.from(new Set(urls));
}

export function SignCard({ sign }: { sign: Sign }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const candidateUrls = buildCandidateUrls(sign.gloss, sign.video_url);
  const currentVideoUrl = candidateUrls[candidateIdx];

  // Determine if there is likely a video (video_url set OR gloss matches a known file pattern)
  const hasVideoHint = Boolean(sign.video_url) || sign.gloss.trim().length > 0;

  const handleVideoError = () => {
    if (candidateIdx + 1 < candidateUrls.length) {
      setCandidateIdx((prev) => prev + 1);
    } else {
      setVideoFailed(true);
    }
  };

  const handleModalOpen = () => {
    // Reset state when opening
    setCandidateIdx(0);
    setVideoFailed(false);
    setIsPlaying(true);
    setPlaybackSpeed(1);
    setModalOpen(true);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
    setIsPlaying(!isPlaying);
  };

  const handleReplay = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const speakGloss = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${sign.gloss}. ${sign.meaning}`);
      utterance.rate = 0.9;
      utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      <Card className="group relative flex h-full flex-col overflow-hidden rounded-2xl border-border/70 bg-card/80 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift">
        {/* Video thumbnail strip at top of card */}
        {hasVideoHint && !videoFailed && (
          <div className="relative aspect-video w-full overflow-hidden bg-neutral-950">
            <video
              src={currentVideoUrl}
              className="h-full w-full object-cover opacity-75 transition-opacity duration-200 group-hover:opacity-95"
              muted
              loop
              autoPlay
              playsInline
              onError={handleVideoError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
            <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              <Video className="size-3 text-emerald-400" />
              HD Video
            </span>
          </div>
        )}

        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
              <Hand className="size-5" aria-hidden="true" />
            </span>
            <div className="flex items-center gap-1.5">
              {(sign.video_url || hasVideoHint) ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2.5 py-0.5 text-[11px] font-semibold text-teal">
                  <Video className="size-3" />
                  Video
                </span>
              ) : null}
              <DifficultyBadge difficulty={sign.difficulty} />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="font-display text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              {sign.gloss}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{sign.meaning}</p>
          </div>

          {/* Action buttons */}
          <div className="mt-auto pt-4 flex items-center justify-between gap-2">
            <Button
              variant={hasVideoHint ? "default" : "outline"}
              size="sm"
              onClick={handleModalOpen}
              className="h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold shadow-sm"
            >
              {hasVideoHint ? (
                <>
                  <Play className="size-3.5 fill-current" />
                  Watch Video
                </>
              ) : (
                <>
                  <Info className="size-3.5" />
                  View Steps
                </>
              )}
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={speakGloss}
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Listen to pronunciation"
                >
                  <Volume2 className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Listen to term</TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      {/* Video Demonstration Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl overflow-hidden rounded-2xl border-border bg-card p-0 sm:max-w-xl">
          <DialogHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center justify-between gap-2 pr-6">
              <DialogTitle className="font-display text-xl font-bold text-foreground">
                {sign.gloss}
              </DialogTitle>
              <DifficultyBadge difficulty={sign.difficulty} />
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              {sign.meaning}
            </DialogDescription>
          </DialogHeader>

          {/* Video Player */}
          <div className="relative aspect-video w-full overflow-hidden bg-black/95">
            {!videoFailed ? (
              <>
                <video
                  ref={videoRef}
                  src={currentVideoUrl}
                  className="h-full w-full object-contain"
                  autoPlay
                  loop
                  playsInline
                  onError={handleVideoError}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                {/* Video overlay controls */}
                <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 text-white">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md hover:bg-white/30 transition-colors"
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleReplay}
                      className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md hover:bg-white/30 transition-colors"
                      title="Replay"
                    >
                      <Repeat className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={speakGloss}
                      className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md hover:bg-white/30 transition-colors"
                      title="Hear pronunciation"
                    >
                      <Volume2 className="size-4" />
                    </button>
                  </div>

                  {/* Speed controls */}
                  <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1 backdrop-blur-md">
                    <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Speed:
                    </span>
                    {[0.5, 0.75, 1].map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => handleSpeedChange(speed)}
                        className={`rounded-lg px-2 py-1 text-xs font-bold transition-all ${
                          playbackSpeed === speed
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-neutral-300 hover:bg-white/15"
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
                {/* Sign label overlay */}
                <div className="absolute left-0 right-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/70 to-transparent p-4 text-white">
                  <span className="flex size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  <span className="font-semibold text-sm">{sign.gloss}</span>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    HD ISL Demo
                  </span>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/20 via-background to-secondary p-6 text-center">
                <Hand className="size-16 text-primary animate-pulse" />
                <p className="text-sm font-semibold text-foreground">{sign.gloss}</p>
                <p className="text-xs text-muted-foreground">Follow the step-by-step gesture cues below</p>
              </div>
            )}
          </div>

          {/* Gesture Breakdown */}
          <div className="space-y-4 px-6 py-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Step-by-Step Hand Gesture Cues
              </h4>
              <ol className="mt-2 space-y-2 text-sm text-foreground">
                {sign.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {sign.region_note ? (
              <div className="rounded-xl border border-teal/20 bg-teal/5 p-3 text-xs text-muted-foreground">
                <strong className="text-teal">Regional Context: </strong>
                {sign.region_note}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Close
              </Button>
              <Button asChild size="sm" className="gap-1.5 shadow-sm">
                <Link to="/practice" search={{ sign: sign.id } as never}>
                  <Camera className="size-4" />
                  Practice with Camera
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
