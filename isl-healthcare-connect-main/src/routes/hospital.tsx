import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Award, Medal, Trophy, Users } from "lucide-react";
import { useState, useEffect } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatGridSkeleton } from "@/components/common/LoadingStates";
import type { StatusKind } from "@/components/common/StatusBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PageShell } from "@/components/layout/AppLayout";
import { Reveal } from "@/components/motion/Reveal";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ManageStaffDialog } from "@/features/hospital/ManageStaffDialog";
import { ReadyCard } from "@/features/hospital/ReadyCard";
import { ReportDialog } from "@/features/hospital/ReportDialog";
import { HospitalCharts } from "@/features/hospital/HospitalCharts";
import { StaffTable } from "@/features/hospital/StaffTable";
import {
  certifiedCounts,
  getHospital,
  getHospitalAnalytics,
  listStaff,
} from "@/services/hospital.service";
import {
  emergencyTriageService,
  type EmergencyAlert,
} from "@/services/emergency-triage.service";
import { toast } from "sonner";

import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export const Route = createFileRoute("/hospital")({
  head: () => ({
    meta: [
      { title: "Hospital ISL Accessibility Dashboard | ISL Setu" },
      {
        name: "description",
        content:
          "Track staff Indian Sign Language certification, coverage and training progress across your facility.",
      },
      { property: "og:title", content: "Hospital ISL Accessibility Dashboard | ISL Setu" },
      {
        property: "og:description",
        content:
          "Track staff Indian Sign Language certification, coverage and training progress across your facility.",
      },
    ],
  }),
  component: HospitalPageWrapper,
});

function HospitalPageWrapper() {
  return (
    <ProtectedRoute>
      <HospitalPage />
    </ProtectedRoute>
  );
}

const readinessStatus: Record<string, StatusKind> = {
  not_started: "not_started",
  in_progress: "in_progress",
  isl_ready: "completed",
};

const readinessLabel: Record<string, string> = {
  not_started: "ISL-Ready — Not Started",
  in_progress: "ISL-Ready — In Progress",
  isl_ready: "ISL-Ready — Achieved",
};

function HospitalPage() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);

  useEffect(() => {
    const unsubscribe = emergencyTriageService.subscribe((updatedAlerts) => {
      setAlerts(updatedAlerts);
    });
    return () => unsubscribe();
  }, []);

  const hospitalQuery = useQuery({ queryKey: ["hospital"], queryFn: () => getHospital() });
  const staffQuery = useQuery({ queryKey: ["hospital-staff"], queryFn: () => listStaff() });
  const analyticsQuery = useQuery({
    queryKey: ["hospital-analytics"],
    queryFn: () => getHospitalAnalytics(),
  });

  const staff = staffQuery.data ?? [];
  const counts = certifiedCounts(staff);
  const hospital = hospitalQuery.data;

  return (
    <PageShell className="space-y-10">
      <Toaster />
      <PageHeader
        eyebrow="Facility dashboard"
        title={hospital ? hospital.name : "Hospital ISL Accessibility Dashboard"}
        description={
          hospital
            ? `${hospital.city}, ${hospital.state} — staff Indian Sign Language certification and readiness overview.`
            : "Loading facility overview…"
        }
        actions={
          <>
            {hospital ? (
              <StatusBadge
                status={readinessStatus[hospital.readiness]}
                label={readinessLabel[hospital.readiness]}
              />
            ) : null}
          </>
        }
      />

      {/* Live Emergency ISL Triage Feed */}
      <Reveal>
        <div className="rounded-3xl border-2 border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-card to-card p-5 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-rose-600 flex items-center justify-center text-white animate-pulse">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                  <span>Live Emergency ISL Triage Queue</span>
                  <Badge className="bg-rose-500 text-white text-[10px] font-bold uppercase animate-pulse">
                    Code Red / Blue Sync
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Instant alerts dispatched from deaf patients in consultation rooms & triage stations
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5 self-start sm:self-center">
              <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
              Live Hospital Event Bus Connected
            </span>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                No active emergency SOS tickets. System is monitoring all triage rooms.
              </p>
            ) : (
              alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border text-xs leading-relaxed transition-all ${
                    alert.severity === "critical_code_red"
                      ? "bg-rose-950/20 border-rose-500/50"
                      : "bg-amber-950/20 border-amber-500/50"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-[10px] font-bold uppercase ${
                          alert.severity === "critical_code_red"
                            ? "bg-rose-600 text-white"
                            : "bg-amber-500 text-black"
                        }`}
                      >
                        {alert.severity === "critical_code_red" ? "🚨 CODE RED" : "⚠️ CODE BLUE"}
                      </Badge>
                      <span className="font-bold text-foreground">{alert.roomBed}</span>
                      <span className="text-muted-foreground">• {alert.timestamp}</span>
                      <Badge variant="outline" className="text-[10px] font-mono border-teal-500/40 text-teal-400">
                        Sign: {alert.signGloss}
                      </Badge>
                    </div>
                    <p className="font-medium text-foreground">{alert.tamilDescription}</p>
                    {alert.dispatchedTo && (
                      <p className="text-[11px] text-teal-400 font-medium">
                        Assigned: {alert.dispatchedTo}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {alert.status === "active" && (
                      <Button
                        size="sm"
                        variant="hero"
                        onClick={() => {
                          emergencyTriageService.updateAlertStatus(alert.id, "dispatched", "Nurse Priya (ISL Certified)");
                          toast.success(`Dispatched ISL Certified Staff to ${alert.roomBed}`);
                        }}
                        className="rounded-xl text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        Dispatch ISL Nurse
                      </Button>
                    )}
                    {alert.status === "dispatched" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          emergencyTriageService.updateAlertStatus(alert.id, "resolved");
                          toast.info(`Emergency at ${alert.roomBed} marked resolved.`);
                        }}
                        className="rounded-xl text-xs font-bold gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        Mark Resolved ✓
                      </Button>
                    )}
                    {alert.status === "resolved" && (
                      <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/40">
                        Resolved ✓
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Reveal>

      {staffQuery.isLoading ? (
        <StatGridSkeleton count={4} />
      ) : (
        <Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Certified Staff" value={counts.total} icon={Users} tone="primary" />
            <StatCard label="Bronze" value={counts.bronze} icon={Medal} tone="muted" />
            <StatCard label="Silver" value={counts.silver} icon={Award} tone="teal" />
            <StatCard label="Gold" value={counts.gold} icon={Trophy} tone="gold" />
          </div>
        </Reveal>
      )}

      {hospital ? (
        <Reveal>
          <ReadyCard hospital={hospital} certifiedTotal={counts.total} />
        </Reveal>
      ) : null}

      <Reveal>
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-foreground">Staff certification</h2>
            <div className="flex flex-wrap gap-2">
              <ManageStaffDialog staff={staff} />
              {hospital ? <ReportDialog hospital={hospital} counts={counts} /> : null}
            </div>
          </div>
          <StaffTable staff={staff} isLoading={staffQuery.isLoading} />
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Facility analytics</h2>
          {analyticsQuery.data ? (
            <HospitalCharts analytics={analyticsQuery.data} />
          ) : (
            <StatGridSkeleton count={3} />
          )}
        </section>
      </Reveal>
    </PageShell>
  );
}
