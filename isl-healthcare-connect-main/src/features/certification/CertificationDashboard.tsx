import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle2, Download, Eye, FileWarning, Lock } from "lucide-react";

import logo from "@/assets/isl-setu-logo.png";
import { CertificateDialog } from "@/features/certification/CertificateDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, type StatusKind } from "@/components/common/StatusBadge";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getDemoUser } from "@/services/progress.service";
import type { Certificate } from "@/types";

const statusMap: Record<Certificate["status"], StatusKind> = {
  completed: "completed",
  in_progress: "in_progress",
  locked: "locked",
};

const toneRing: Record<Certificate["tier"], string> = {
  bronze: "border-bronze/30",
  silver: "border-silver/30",
  gold: "border-gold/30",
};

const toneText: Record<Certificate["tier"], string> = {
  bronze: "text-bronze",
  silver: "text-silver",
  gold: "text-gold",
};

const toneBg: Record<Certificate["tier"], string> = {
  bronze: "bg-bronze/15",
  silver: "bg-silver/15",
  gold: "bg-gold/15",
};

interface CertificationDashboardProps {
  certificates: Certificate[];
}

export function CertificationDashboard({ certificates }: CertificationDashboardProps) {
  const { data: user } = useQuery({ queryKey: ["demo-user"], queryFn: getDemoUser });
  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(null);

  return (
    <TooltipProvider delayDuration={200}>
      <RevealGroup className="grid gap-6 lg:grid-cols-3">
        {certificates.map((certificate) => {
          const percent = Math.min(
            100,
            Math.round((certificate.signs_completed / certificate.signs_required) * 100),
          );
          const isCompleted = certificate.status === "completed";
          const isLocked = certificate.status === "locked";

          return (
            <RevealItem key={certificate.id}>
              <Card className={`h-full overflow-hidden rounded-2xl border-2 ${toneRing[certificate.tier]} shadow-soft`}>
                <div className={`flex items-center justify-between px-5 py-4 ${toneBg[certificate.tier]}`}>
                  <div className="flex items-center gap-2">
                    <Award className={`size-5 ${toneText[certificate.tier]}`} aria-hidden="true" />
                    <p className={`font-display text-lg font-bold ${toneText[certificate.tier]}`}>
                      {certificate.title}
                    </p>
                  </div>
                  <StatusBadge status={statusMap[certificate.status]} />
                </div>

                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-3">
                    <img src={logo} alt="" aria-hidden="true" className="h-8 w-auto opacity-80" />
                    <p className="text-xs text-muted-foreground">{certificate.subtitle}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">Signs mastered</span>
                      <span className="text-muted-foreground">
                        {certificate.signs_completed}/{certificate.signs_required}
                      </span>
                    </div>
                    <Progress
                      value={percent}
                      className="mt-2 h-2"
                      aria-label={`${certificate.title} progress: ${percent}%`}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground">Requirements</p>
                    <ul className="mt-2 space-y-1.5">
                      {certificate.requirements.map((req) => (
                        <li key={req} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2
                            className={`mt-0.5 size-4 shrink-0 ${isLocked ? "text-muted-foreground" : "text-success"}`}
                            aria-hidden="true"
                          />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {isCompleted ? (
                      <>
                        <Button
                          variant="outline"
                          className="min-h-11 flex-1"
                          onClick={() => setActiveCertificate(certificate)}
                        >
                          <Eye aria-hidden="true" />
                          View Certificate
                        </Button>
                        <Button
                          variant="hero"
                          className="min-h-11 flex-1"
                          onClick={() => setActiveCertificate(certificate)}
                        >
                          <Download aria-hidden="true" />
                          Download Certificate
                        </Button>
                      </>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-full">
                            <Button variant="secondary" className="min-h-11 w-full" disabled>
                              <Lock aria-hidden="true" />
                              {isLocked ? "Locked" : "In Progress"}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isLocked
                            ? "Complete the requirements above to unlock this certificate."
                            : "Finish the remaining signs and pass the assessment to unlock this certificate."}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {!isCompleted ? (
                    <EmptyState
                      icon={FileWarning}
                      title="Certificate unavailable"
                      description="This credential hasn't been issued yet. Keep learning to unlock it."
                      tone="neutral"
                      className="border-none bg-transparent p-0 shadow-none [&>div]:py-4"
                    />
                  ) : null}
                </CardContent>
              </Card>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
        <Award className="size-6 text-primary" aria-hidden="true" />
        <p className="text-base font-semibold text-foreground">Ready to earn your next tier?</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Take the timed healthcare ISL assessment to progress toward your next certification.
        </p>
        <Button variant="hero" size="lg" asChild>
          <Link to="/assessment">Take the Assessment</Link>
        </Button>
      </div>

      {activeCertificate && user ? (
        <CertificateDialog
          certificate={activeCertificate}
          user={user}
          open={Boolean(activeCertificate)}
          onOpenChange={(open) => {
            if (!open) setActiveCertificate(null);
          }}
        />
      ) : null}
    </TooltipProvider>
  );
}
