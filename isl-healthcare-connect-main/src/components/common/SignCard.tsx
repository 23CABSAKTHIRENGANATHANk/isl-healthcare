import { Camera, CheckCircle2, Hand, Info, Play, Video, Volume2 } from "lucide-react";
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

export function SignCard({ sign }: { sign: Sign }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
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
        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
              <Hand className="size-5" aria-hidden="true" />
            </span>
            <div className="flex items-center gap-1.5">
              {sign.video_url ? (
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
            {sign.video_url ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold shadow-sm"
              >
                <Play className="size-3.5 fill-current" />
                Watch Video
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold"
              >
                <Info className="size-3.5" />
                View Steps
              </Button>
            )}

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

          {/* Video Player or Visual Placeholder */}
          <div className="relative aspect-video w-full overflow-hidden bg-black/90">
            {sign.video_url ? (
              <video
                ref={videoRef}
                src={sign.video_url}
                className="h-full w-full object-contain"
                controls
                autoPlay
                loop
                playsInline
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/20 via-background to-secondary p-6 text-center">
                <Hand className="size-16 text-primary animate-pulse" />
                <p className="text-sm font-medium text-foreground">
                  Follow the step-by-step gesture cues below
                </p>
              </div>
            )}
          </div>

          {/* Video Controls & Gesture Breakdown */}
          <div className="space-y-4 px-6 py-4">
            {sign.video_url ? (
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-2.5 text-xs">
                <span className="font-medium text-muted-foreground">Playback Speed:</span>
                <div className="flex gap-1">
                  {[0.5, 0.75, 1].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleSpeedChange(speed)}
                      className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
                        playbackSpeed === speed
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {speed}x {speed === 0.5 ? "(Slow Mo)" : ""}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Step-by-Step Hand Gesture Cues
              </h4>
              <ul className="mt-2 space-y-1.5 text-sm text-foreground">
                {sign.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
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
