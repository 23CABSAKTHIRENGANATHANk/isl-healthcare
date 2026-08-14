import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Clock, Play, PlayCircle, Video } from "lucide-react";

import { DifficultyBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/types";

const tones: Record<Lesson["thumbnail_tone"], string> = {
  primary: "from-primary/30 via-primary/15 to-teal/20 text-primary",
  teal: "from-teal/35 via-teal/15 to-primary/20 text-teal",
  gold: "from-gold/35 via-gold/15 to-primary/15 text-gold",
  success: "from-success/35 via-success/15 to-teal/20 text-success",
};

const gradientOverlays: Record<Lesson["thumbnail_tone"], string> = {
  primary: "from-neutral-950/80 via-neutral-950/40 to-transparent",
  teal: "from-neutral-950/80 via-neutral-950/40 to-transparent",
  gold: "from-neutral-950/80 via-neutral-950/40 to-transparent",
  success: "from-neutral-950/80 via-neutral-950/40 to-transparent",
};

/** Map lesson slug → a representative sign video for the thumbnail */
const LESSON_PREVIEW_VIDEOS: Record<string, string> = {
  "clinical-triage": "/videos/signs/Fever.mp4",
  "clinical-acute": "/videos/signs/Injury.mp4",
  "greetings-intake": "/videos/signs/Hello.mp4",
  "bedside-cues": "/videos/signs/Clean.mp4",
  "diet-nutrition": "/videos/signs/Tea.mp4",
  "diet-vegetables": "/videos/signs/Vegetables.mp4",
  "pediatric-care": "/videos/signs/Bear.mp4",
  "pediatric-animals": "/videos/signs/Lion.mp4",
  "admin-intake": "/videos/signs/Budget.mp4",
  "ward-logistics": "/videos/signs/Key.mp4",
  "patient-intake": "/videos/signs/Hello.mp4",
  "dietary-nutrition": "/videos/signs/Tea.mp4",
  "hospital-admin": "/videos/signs/Budget.mp4",
};

export function LessonCard({ lesson, percent = 0 }: { lesson: Lesson; percent?: number }) {
  const reduce = useReducedMotion();
  const started = percent > 0;
  const previewVideo = LESSON_PREVIEW_VIDEOS[lesson.slug];

  return (
    <motion.div
      {...(reduce ? {} : { whileHover: { y: -4 } })}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col"
    >
      <Card className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border-border/70 bg-card/90 shadow-soft transition-all duration-200 hover:border-primary/50 hover:shadow-lift group">
        <div>
          {/* Thumbnail banner — shows a live preview video or gradient fallback */}
          <div
            className={cn(
              "relative h-44 w-full overflow-hidden bg-neutral-950",
              tones[lesson.thumbnail_tone],
            )}
          >
            {previewVideo ? (
              <>
                <video
                  src={previewVideo}
                  className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:opacity-85 transition-opacity duration-300"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-t",
                    gradientOverlays[lesson.thumbnail_tone],
                  )}
                />
              </>
            ) : null}

            {/* Lesson code badge */}
            <span className="absolute left-3.5 top-3.5 z-10 rounded-lg bg-card/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-foreground shadow-sm">
              {lesson.code}
            </span>

            {/* Video indicator */}
            <span className="absolute right-3.5 top-3.5 z-10 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
              <Video className="size-3.5" />
              HD Video
            </span>

            {/* Center play button */}
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-white/25 backdrop-blur-md border border-white/40 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100">
                <Play className="size-5 fill-white text-white ml-0.5" aria-hidden="true" />
              </div>
            </div>

            {/* Bottom sign count */}
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-neutral-950/90 to-transparent p-3.5">
              <p className="text-xs font-semibold text-white/90">
                {lesson.sign_ids?.length ?? "Multiple"} Verified ISL Signs
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 p-5 pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <DifficultyBadge difficulty={lesson.difficulty} />
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Clock className="size-3.5" aria-hidden="true" />
                {lesson.duration_minutes} min
              </span>
            </div>
            <h3 className="font-display text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              {lesson.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {lesson.summary}
            </p>
          </div>
        </div>

        <CardContent className="p-5 pt-4 space-y-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Progress</span>
              <span className="font-semibold text-foreground">{percent}%</span>
            </div>
            <Progress
              value={percent}
              className="h-2 rounded-full"
              aria-label={`${lesson.title} progress: ${percent}%`}
            />
          </div>
          <Button asChild className="w-full h-10 rounded-xl font-semibold gap-2 shadow-sm" variant={started ? "default" : "outline"}>
            <Link to="/learn/$lesson" params={{ lesson: lesson.slug }}>
              <PlayCircle className="size-4" aria-hidden="true" />
              {started ? "Continue Lesson" : "Start Lesson"}
              <span className="sr-only"> — {lesson.title}</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
