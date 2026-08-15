import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FileWarning,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";

import logo from "@/assets/isl-setu-logo.png";
import { CertificateDialog } from "@/features/certification/CertificateDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, type StatusKind } from "@/components/common/StatusBadge";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { getDemoUser } from "@/services/progress.service";
import { downloadDirectCertificate } from "@/services/certificatePdf.service";
import { toast } from "sonner";
import type { AppUser, Certificate } from "@/types";

const statusMap: Record<Certificate["status"], StatusKind> = {
  completed: "completed",
  in_progress: "in_progress",
  locked: "locked",
};

const toneRing: Record<Certificate["tier"], string> = {
  bronze: "border-amber-500/40",
  silver: "border-slate-400/40",
  gold: "border-yellow-500/40",
};

const toneText: Record<Certificate["tier"], string> = {
  bronze: "text-amber-400",
  silver: "text-slate-300",
  gold: "text-yellow-400",
};

const toneBg: Record<Certificate["tier"], string> = {
  bronze: "bg-amber-500/10",
  silver: "bg-slate-400/10",
  gold: "bg-yellow-500/10",
};

interface CertificationDashboardProps {
  certificates: Certificate[];
}

export function CertificationDashboard({ certificates }: CertificationDashboardProps) {
  const { profile, displayName, user: authUser } = useAuth();
  const { data: demoUser } = useQuery({ queryKey: ["demo-user"], queryFn: getDemoUser });
  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const currentUser: AppUser =
    profile ||
    (authUser
      ? {
          id: authUser.id,
          full_name: displayName || authUser.email?.split("@")[0] || "Healthcare Professional",
          email: authUser.email || "",
          role: "nurse",
          hospital_id: null,
          sector: "healthcare",
          level: "bronze",
          created_at: new Date().toISOString(),
        }
      : demoUser || {
          id: "guest",
          full_name: displayName || "Healthcare Professional",
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
      toast.loading("Rendering high-definition official certificate...");
      await downloadDirectCertificate(certificate, currentUser);
      toast.dismiss();
      toast.success("Official Certificate downloaded successfully!");
    } catch (err) {
      toast.dismiss();
      toast.error("Download failed. Please try again.");
      console.error("[Certificate Download Error]", err);
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
            Math.round((certificate.signs_completed / certificate.signs_required) * 100)
          );
          const isCompleted = certificate.status === "completed";
          const isLocked = certificate.status === "locked";
          const isDownloading = downloadingId === certificate.id;

          return (
            <RevealItem key={certificate.id}>
              <Card
                className={`flex h-full flex-col overflow-hidden rounded-3xl border-2 ${toneRing[certificate.tier]} shadow-soft bg-card/95 backdrop-blur-sm`}
              >
                <div
                  className={`flex items-center justify-between px-6 py-4.5 border-b border-border/40 ${toneBg[certificate.tier]}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Award className={`size-5.5 ${toneText[certificate.tier]}`} aria-hidden="true" />
                    <p className={`font-display text-lg font-bold ${toneText[certificate.tier]}`}>
                      {certificate.title}
                    </p>
                  </div>
                  <StatusBadge status={statusMap[certificate.status]} />
                </div>

                <CardContent className="flex flex-1 flex-col justify-between gap-5 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/30 p-3.5">
                      <img src={logo} alt="" aria-hidden="true" className="h-8 w-auto opacity-90" />
                      <p className="text-xs font-medium text-muted-foreground">{certificate.subtitle}</p>
                    </div>

                    {certificate.credential_id && isCompleted ? (
                      <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <FileCheck2 className="size-4" />
                          <span>CREDENTIAL ID</span>
                        </div>
                        <span className="font-mono text-xs font-bold tracking-wider text-emerald-300">
                          {certificate.credential_id}
                        </span>
                      </div>
                    ) : null}

                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-foreground">Signs mastered</span>
                        <span className="font-mono font-bold text-muted-foreground">
                          {certificate.signs_completed}/{certificate.signs_required}
                        </span>
                      </div>
                      <Progress
                        value={percent}
                        className="mt-2 h-2.5 bg-muted/60"
                        aria-label={`${certificate.title} progress: ${percent}%`}
                      />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Requirements
                      </p>
                      <ul className="mt-2.5 space-y-2">
                        {certificate.requirements.map((req) => (
                          <li
                            key={req}
                            className="flex items-start gap-2.5 text-xs font-medium text-muted-foreground"
                          >
                            <CheckCircle2
                              className={`mt-0.5 size-4 shrink-0 ${isLocked ? "text-muted-foreground/40" : "text-emerald-400"}`}
                              aria-hidden="true"
                            />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Section */}
                  <div className="mt-4 pt-4 border-t border-border/40">
                    {isCompleted ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <Button
                            id={`view-cert-${certificate.id}`}
                            variant="outline"
                            className="h-11 flex-1 gap-2 rounded-xl font-bold border-border/80 hover:bg-muted"
                            onClick={() => setActiveCertificate(certificate)}
                          >
                            <Eye className="size-4 text-muted-foreground" aria-hidden="true" />
                            View
                          </Button>
                          <Button
                            id={`download-cert-${certificate.id}`}
                            variant="hero"
                            className="h-11 flex-[2] gap-2 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                            onClick={() => void handleDownload(certificate)}
                            disabled={isDownloading}
                          >
                            {isDownloading ? (
                              <Loader2 className="size-4.5 animate-spin" aria-hidden="true" />
                            ) : (
                              <Download className="size-4.5" aria-hidden="true" />
                            )}
                            {isDownloading ? "Generating…" : "Download Certificate (PDF)"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-full block">
                            <Button
                              variant="secondary"
                              className="h-11 w-full gap-2 rounded-xl font-medium text-muted-foreground opacity-80"
                              disabled
                            >
                              <Lock className="size-4" aria-hidden="true" />
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
                </CardContent>
              </Card>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <div className="mt-8 flex flex-col items-center gap-3.5 rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-8 text-center shadow-soft">
        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Sparkles className="size-6" />
        </div>
        <p className="font-display text-lg font-bold text-foreground">Ready to earn your next healthcare tier?</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Take the timed healthcare ISL assessment to progress toward your Silver & Gold clinical certifications.
        </p>
        <Button variant="hero" size="lg" className="rounded-xl px-8 shadow-md" asChild>
          <Link to="/assessment">Take the Clinical Assessment</Link>
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
