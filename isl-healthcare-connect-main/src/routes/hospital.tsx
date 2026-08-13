import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Medal, Trophy, Users } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatGridSkeleton } from "@/components/common/LoadingStates";
import type { StatusKind } from "@/components/common/StatusBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PageShell } from "@/components/layout/AppLayout";
import { Reveal } from "@/components/motion/Reveal";
import { Toaster } from "@/components/ui/sonner";
import { ManageStaffDialog } from "@/features/hospital/ManageStaffDialog";
import { ReadyCard } from "@/features/hospital/ReadyCard";
import { ReportDialog } from "@/features/hospital/ReportDialog";
import { HospitalCharts } from "@/features/hospital/HospitalCharts";
import { StaffTable } from "@/features/hospital/StaffTable";
import { certifiedCounts, getHospital, getHospitalAnalytics, listStaff } from "@/services/hospital.service";

import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export const Route = createFileRoute("/hospital")({
  head: () => ({
    meta: [
      { title: "Hospital ISL Accessibility Dashboard | ISL Setu" },
      {
        name: "description",
        content: "Track staff Indian Sign Language certification, coverage and training progress across your facility.",
      },
      { property: "og:title", content: "Hospital ISL Accessibility Dashboard | ISL Setu" },
      {
        property: "og:description",
        content: "Track staff Indian Sign Language certification, coverage and training progress across your facility.",
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
  const hospitalQuery = useQuery({ queryKey: ["hospital"], queryFn: getHospital });
  const staffQuery = useQuery({ queryKey: ["hospital-staff"], queryFn: listStaff });
  const analyticsQuery = useQuery({ queryKey: ["hospital-analytics"], queryFn: getHospitalAnalytics });

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
              <StatusBadge status={readinessStatus[hospital.readiness]} label={readinessLabel[hospital.readiness]} />
            ) : null}
          </>
        }
      />

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

      {hospital ? <Reveal><ReadyCard hospital={hospital} certifiedTotal={counts.total} /></Reveal> : null}

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
          {analyticsQuery.data ? <HospitalCharts analytics={analyticsQuery.data} /> : <StatGridSkeleton count={3} />}
        </section>
      </Reveal>
    </PageShell>
  );
}
