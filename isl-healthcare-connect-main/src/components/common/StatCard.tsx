import type { LucideIcon } from "lucide-react";

import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type StatTone = "primary" | "teal" | "gold" | "success" | "muted";

const toneClasses: Record<StatTone, string> = {
  primary: "bg-primary/10 text-primary",
  teal: "bg-teal/10 text-teal",
  gold: "bg-gold/15 text-gold",
  success: "bg-success/10 text-success",
  muted: "bg-muted text-muted-foreground",
};

interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  icon: LucideIcon;
  tone?: StatTone;
  helper?: string;
  progress?: number;
  animate?: boolean;
  decimals?: number;
  className?: string;
}

export function StatCard({
  label,
  value,
  suffix = "",
  icon: Icon,
  tone = "primary",
  helper,
  progress,
  animate = true,
  decimals = 0,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("h-full rounded-2xl border-border/70 shadow-soft transition-shadow hover:shadow-lift", className)}>
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", toneClasses[tone])}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        </div>
        <p className="font-display text-3xl font-bold text-foreground">
          {typeof value === "number" && animate ? (
            <AnimatedCounter value={value} suffix={suffix} decimals={decimals} />
          ) : (
            <>
              {value}
              {suffix}
            </>
          )}
        </p>
        {typeof progress === "number" ? (
          <Progress value={progress} className="h-2" aria-label={`${label}: ${progress}% complete`} />
        ) : null}
        {helper ? <p className="mt-auto text-xs text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
