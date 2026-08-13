import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Clock, HandMetal, PlayCircle } from "lucide-react";

import { DifficultyBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/types";

const tones: Record<Lesson["thumbnail_tone"], string> = {
  primary: "from-primary/20 via-primary/10 to-teal/15 text-primary",
  teal: "from-teal/25 via-teal/10 to-primary/15 text-teal",
  gold: "from-gold/25 via-gold/10 to-primary/10 text-gold",
  success: "from-success/25 via-success/10 to-teal/15 text-success",
};

export function LessonCard({ lesson, percent = 0 }: { lesson: Lesson; percent?: number }) {
  const reduce = useReducedMotion();
  const started = percent > 0;

  return (
    <motion.div
      {...(reduce ? {} : { whileHover: { y: -4 } })}
      transition={{ duration: 0.2 }}
      className="h-full"
    >

      <Card className="flex h-full flex-col overflow-hidden rounded-2xl border-border/70 shadow-soft transition-shadow hover:shadow-lift">
        <div
          className={cn(
            "relative grid h-36 place-items-center bg-gradient-to-br",
            tones[lesson.thumbnail_tone],
          )}
        >
          <HandMetal className="size-12" aria-hidden="true" />
          <span className="absolute left-4 top-4 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold text-foreground">
            {lesson.code}
          </span>
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
              <Progress value={percent} className="h-2" aria-label={`${lesson.title} progress: ${percent}%`} />
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
