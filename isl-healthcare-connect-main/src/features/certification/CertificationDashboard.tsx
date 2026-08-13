import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle2, Download, Eye, FileWarning, Loader2, Lock } from "lucide-react";

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
import { useAuth } from "@/hooks/use-auth";
import { getDemoUser } from "@/services/progress.service";
import { toast } from "sonner";
import type { AppUser, Certificate } from "@/types";

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

const AI_BACKEND_URL =
  typeof import.meta !== "undefined" && import.meta.env?.["VITE_AI_API_URL"]
    ? (import.meta.env["VITE_AI_API_URL"] as string)
    : "http://localhost:8000";


/**
 * Downloads a server-side generated PDF certificate from the FastAPI backend.
 * Falls back to browser print if backend is unavailable.
 */
async function downloadServerPdf(
  certificate: Certificate,
  userName: string,
  role: string
): Promise<void> {
  const params = new URLSearchParams({
    name: userName,
    tier: certificate.tier,
    role,
    score: String(80),
    ...(certificate.issued_at ? { issued_at: certificate.issued_at } : {}),
  });

  const url = `${AI_BACKEND_URL}/api/certificate/${encodeURIComponent(certificate.credential_id ?? certificate.id)}/pdf?${params.toString()}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Server returned ${response.status}`);

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `ISL-Setu-Certificate-${certificate.credential_id ?? certificate.id}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  } catch {
    // Fallback: browser print dialog
    window.print();
    throw new Error("backend_unavailable");
  }
}

export function CertificationDashboard({ certificates }: CertificationDashboardProps) {
  const { profile, displayName, user: authUser } = useAuth();
  const { data: demoUser } = useQuery({ queryKey: ["demo-user"], queryFn: getDemoUser });
  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const currentUser: AppUser = profile || (authUser ? {
    id: authUser.id,
    full_name: displayName,
    email: authUser.email || "",
    role: "nurse",
    hospital_id: null,
    sector: "healthcare",
    level: "bronze",
    created_at: new Date().toISOString(),
  } : demoUser || {
    id: "guest",
    full_name: displayName,
    email: "",
    role: "nurse",
    hospital_id: null,
    sector: "healthcare",
    level: "bronze",
    created_at: new Date().toISOString(),
  });

  async function handleDownload(certificate: Certificate) {
    setDownloadingId(certificate.id);
    try {
      await downloadServerPdf(certificate, currentUser.full_name, currentUser.role);
      toast.success("Certificate downloaded successfully!");
    } catch (err) {
      if ((err as Error).message === "backend_unavailable") {
        toast.info("AI server offline — opened browser print dialog instead.");
      } else {
        toast.error("Download failed. Please try again.");
      }
    } finally {
      setDownloadingId(null);
    }
  }

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
          const isDownloading = downloadingId === certificate.id;

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

                  {certificate.credential_id && isCompleted ? (
                    <p className="rounded-xl bg-primary/5 px-3 py-2 font-mono text-xs font-semibold tracking-wider text-primary">
                      {certificate.credential_id}
                    </p>
                  ) : null}

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
                          id={`view-cert-${certificate.id}`}
                          variant="outline"
                          className="min-h-11 flex-1"
                          onClick={() => setActiveCertificate(certificate)}
                        >
                          <Eye aria-hidden="true" />
                          View
                        </Button>
                        <Button
                          id={`download-cert-${certificate.id}`}
                          variant="hero"
                          className="min-h-11 flex-1"
                          onClick={() => void handleDownload(certificate)}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Download aria-hidden="true" />
                          )}
                          {isDownloading ? "Generating…" : "Download PDF"}
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

      {activeCertificate && currentUser ? (
        <CertificateDialog
          certificate={activeCertificate}
          user={currentUser}
          open={Boolean(activeCertificate)}
          onOpenChange={(open) => {
            if (!open) setActiveCertificate(null);
          }}
        />
      ) : null}
    </TooltipProvider>
  );
}
