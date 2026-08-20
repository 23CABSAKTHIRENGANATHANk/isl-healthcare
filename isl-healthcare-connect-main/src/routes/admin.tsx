import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AdminGuard } from "@/features/admin/components/AdminGuard";
import { AdminSidebar, type AdminSection } from "@/features/admin/AdminSidebar";
import { DashboardSection } from "@/features/admin/sections/DashboardSection";
import {
  AnalyticsSection,
  AssessmentsSection,
  AuditSection,
  CertificatesSection,
  HealthSection,
  HospitalsSection,
  LessonsSection,
  MediaSection,
  SettingsSection,
  SignsSection,
  UsersSection,
} from "@/features/admin/sections/OtherSections";
import { listLessons, listSigns } from "@/services/content.service";
import { getHospitalAnalytics, listHospitals, listStaff } from "@/services/hospital.service";
import { listCertificates, getAssessment } from "@/services/assessment.service";
import { getAdminKPIs, listAuditLogs } from "@/features/admin/services/admin.service";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin & Trainer Control Center | ISL Setu" },
      {
        name: "description",
        content:
          "Enterprise command center for healthcare ISL curriculum, staff compliance, analytics, and platform governance.",
      },
      { property: "og:title", content: "Admin & Trainer Control Center | ISL Setu" },
      {
        property: "og:description",
        content:
          "Production-grade administration control center for healthcare sign language education and telemetry.",
      },
    ],
  }),
  component: AdminPageWrapper,
});

function AdminPageWrapper() {
  return (
    <ProtectedRoute>
      <AdminGuard>
        <AdminPage />
      </AdminGuard>
    </ProtectedRoute>
  );
}

function AdminPage() {
  const [section, setSection] = useState<AdminSection>("dashboard");

  const kpisQuery = useQuery({ queryKey: ["admin-kpis"], queryFn: getAdminKPIs });
  const lessonsQuery = useQuery({ queryKey: ["admin-lessons"], queryFn: listLessons });
  const signsQuery = useQuery({ queryKey: ["admin-signs"], queryFn: listSigns });
  const staffQuery = useQuery({ queryKey: ["admin-staff"], queryFn: () => listStaff() });
  const certsQuery = useQuery({ queryKey: ["admin-certs"], queryFn: listCertificates });
  const hospitalsQuery = useQuery({ queryKey: ["admin-hospitals"], queryFn: listHospitals });
  const assessmentQuery = useQuery({
    queryKey: ["admin-assessment"],
    queryFn: () => getAssessment("assessment-bronze-healthcare"),
  });
  const analyticsQuery = useQuery({ queryKey: ["admin-analytics"], queryFn: getHospitalAnalytics });

  const lessons = lessonsQuery.data ?? [];
  const signs = signsQuery.data ?? [];
  const staff = staffQuery.data ?? [];
  const certificates = certsQuery.data ?? [];
  const hospitals = hospitalsQuery.data ?? [];
  const auditLogs = listAuditLogs();
  const isLoading = lessonsQuery.isLoading || signsQuery.isLoading || kpisQuery.isLoading;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Enterprise Governance"
        title="Admin & Trainer Control Center"
        description="Manage healthcare ISL curriculum, clinician credentials, facility compliance, and AI telemetry."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <AdminSidebar active={section} onChange={setSection} />
        </aside>

        <section aria-labelledby="admin-panel" className="lg:col-span-3">
          <h2 id="admin-panel" className="sr-only">
            Admin content panel
          </h2>

          {section === "dashboard" && (
            <DashboardSection
              kpis={kpisQuery.data}
              lessons={lessons}
              signs={signs}
              staff={staff}
              certificates={certificates}
              analytics={analyticsQuery.data}
              auditLogs={auditLogs}
              isLoading={isLoading}
              onNavigate={setSection}
            />
          )}

          {section === "users" && <UsersSection staff={staff} />}
          {section === "lessons" && <LessonsSection lessons={lessons} />}
          {section === "signs" && <SignsSection signs={signs} />}
          {section === "media" && <MediaSection />}
          {section === "assessments" && <AssessmentsSection assessment={assessmentQuery.data} />}
          {section === "certificates" && <CertificatesSection certificates={certificates} />}
          {section === "hospitals" && <HospitalsSection hospital={hospitals[0]} />}
          {section === "analytics" && <AnalyticsSection analytics={analyticsQuery.data} />}
          {section === "audit" && <AuditSection />}
          {section === "health" && <HealthSection />}
          {section === "settings" && <SettingsSection />}
        </section>
      </div>
    </PageShell>
  );
}
