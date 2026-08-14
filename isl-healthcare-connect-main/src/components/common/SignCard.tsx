import { Hand, Info } from "lucide-react";

import { DifficultyBadge } from "@/components/common/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Sign } from "@/types";

export function SignCard({ sign }: { sign: Sign }) {
  return (
    <Card className="h-full rounded-2xl border-border/70 shadow-soft transition-shadow hover:shadow-lift">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Hand className="size-5" aria-hidden="true" />
          </span>
          <DifficultyBadge difficulty={sign.difficulty} />
        </div>
        <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
          {sign.gloss}
        </h3>
        <p className="text-sm text-muted-foreground">{sign.meaning}</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-teal">
              <Info className="size-3.5" aria-hidden="true" />
              Regional variation
            </p>
          </TooltipTrigger>
          <TooltipContent>{sign.region_note}</TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  );
}
