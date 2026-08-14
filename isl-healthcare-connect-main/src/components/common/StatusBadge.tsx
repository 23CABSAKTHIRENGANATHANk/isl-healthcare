import { CheckCircle2, CircleDashed, Clock, Lock, XCircle, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusKind = "completed" | "in_progress" | "locked" | "failed" | "not_started";

const config: Record<StatusKind, { label: string; icon: LucideIcon; className: string }> = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "border-success/30 bg-success/10 text-success",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className: "border-warning/35 bg-warning/15 text-warning",
  },
  locked: {
    label: "Locked",
    icon: Lock,
    className: "border-border bg-muted text-muted-foreground",
  },
  failed: {
    label: "Not Passed",
    icon: XCircle,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  not_started: {
    label: "Not Started",
    icon: CircleDashed,
    className: "border-border bg-muted text-muted-foreground",
  },
};

/**
 * Status is always conveyed by an icon + text label, never colour alone.
 */
export function StatusBadge({
  status,
  label,
  className,
}: {
  status: StatusKind;
  label?: string;
  className?: string;
}) {
  const item = config[status];
  const Icon = item.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 rounded-full px-2.5 py-1 font-semibold", item.className, className)}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label ?? item.label}
    </Badge>
  );
}

export function DifficultyBadge({
  difficulty,
}: {
  difficulty: "beginner" | "intermediate" | "advanced";
}) {
  const map = {
    beginner: { label: "Beginner", dots: 1 },
    intermediate: { label: "Intermediate", dots: 2 },
    advanced: { label: "Advanced", dots: 3 },
  } as const;
  const item = map[difficulty];
  return (
    <Badge variant="secondary" className="gap-1.5 rounded-full font-medium">
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={cn("size-1.5 rounded-full", n <= item.dots ? "bg-primary" : "bg-border")}
          />
        ))}
      </span>
      {item.label}
    </Badge>
  );
}

export function DemoModeBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full border-warning/40 bg-warning/15 font-semibold text-warning",
        className,
      )}
    >
      <CircleDashed className="size-3.5" aria-hidden="true" />
      Demo Mode — simulated result
    </Badge>
  );
}
