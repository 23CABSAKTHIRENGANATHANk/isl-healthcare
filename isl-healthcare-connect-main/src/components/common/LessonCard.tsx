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
  primary: "from-primary/80 via-primary/40 to-transparent",
  teal: "from-teal/80 via-teal/40 to-transparent",
  gold: "from-gold/80 via-gold/40 to-transparent",
  success: "from-success/80 via-success/40 to-transparent",
};

/** Map lesson slug → a representative sign video for the thumbnail */
const LESSON_PREVIEW_VIDEOS: Record<string, string> = {
  "clinical-triage": "/videos/signs/Fever.mp4",
  "patient-intake": "/videos/signs/Hello.mp4",
  "dietary-nutrition": "/videos/signs/Tea.mp4",
  "pediatric-care": "/videos/signs/Bear.mp4",
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
      className="h-full"
    >
      <Card className="flex h-full flex-col overflow-hidden rounded-2xl border-border/70 shadow-soft transition-shadow hover:shadow-lift group">
        {/* Thumbnail banner — shows a live preview video or gradient fallback */}
        <div
          className={cn(
            "relative h-40 overflow-hidden bg-gradient-to-br",
            tones[lesson.thumbnail_tone],
          )}
        >
          {previewVideo ? (
            <>
              <video
                src={previewVideo}
                className="absolute inset-0 h-full w-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-500"
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
          <span className="absolute left-4 top-4 z-10 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
            {lesson.code}
          </span>

          {/* Video indicator */}
          {previewVideo && (
            <span className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              <Video className="size-3" />
              HD Videos
            </span>
          )}

          {/* Center play button */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
              <Play className="size-6 fill-white text-white ml-0.5" aria-hidden="true" />
            </div>
          </div>

          {/* Bottom sign count */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-card/80 to-transparent p-4">
            <p className="text-xs font-semibold text-foreground/70">
              {lesson.sign_ids?.length ?? "Multiple"} ISL signs with HD video demos
            </p>
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={lesson.difficulty} />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3.5" aria-hidden="true" />
              {lesson.duration_minutes} min
            </span>
          </div>
          <h3 className="text-lg font-semibold text-foreground">{lesson.title}</h3>
          <p className="text-sm text-muted-foreground">{lesson.summary}</p>
          <div className="mt-auto space-y-3 pt-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Progress</span>
                <span>{percent}%</span>
              </div>
              <Progress
                value={percent}
                className="h-2"
                aria-label={`${lesson.title} progress: ${percent}%`}
              />
            </div>
            <Button asChild className="w-full" variant={started ? "default" : "outline"}>
              <Link to="/learn/$lesson" params={{ lesson: lesson.slug }}>
                <PlayCircle aria-hidden="true" />
                {started ? "Continue lesson" : "Start lesson"}
                <span className="sr-only"> — {lesson.title}</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
