import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "neutral" | "warning" | "destructive";
  className?: string;
}

const toneClasses = {
  neutral: "bg-muted text-muted-foreground",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function EmptyState({ icon: Icon, title, description, action, tone = "neutral", className }: EmptyStateProps) {
  return (
    <Card className={cn("rounded-2xl border-dashed border-border shadow-none", className)}>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span className={cn("grid size-12 place-items-center rounded-2xl", toneClasses[tone])}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
