import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AdminSidebar, type AdminSection } from "@/features/admin/AdminSidebar";
import { DashboardSection } from "@/features/admin/sections/DashboardSection";
import {
  AssessmentsSection,
  LessonsSection,
  SettingsSection,
  SignsSection,
  UsersSection,
} from "@/features/admin/sections/OtherSections";
import { listLessons, listSigns } from "@/services/content.service";
import { getHospitalAnalytics, listStaff } from "@/services/hospital.service";
import { listCertificates } from "@/services/assessment.service";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin & Trainer Portal | ISL Setu" },
      {
        name: "description",
        content: "Manage ISL healthcare lessons, signs, assessment questions, staff rosters and platform settings.",
      },
      { property: "og:title", content: "Admin & Trainer Portal | ISL Setu" },
      {
        property: "og:description",
        content: "Admin portal for healthcare sign language curriculum and staff readiness management.",
      },
    ],
  }),
  component: AdminPageWrapper,
});

function AdminPageWrapper() {
  return (
    <ProtectedRoute>
      <AdminPage />
    </ProtectedRoute>
  );
}

function AdminPage() {
  const [section, setSection] = useState<AdminSection>("dashboard");

  const lessonsQuery = useQuery({ queryKey: ["admin-lessons"], queryFn: listLessons });
  const signsQuery = useQuery({ queryKey: ["admin-signs"], queryFn: listSigns });
  const staffQuery = useQuery({ queryKey: ["admin-staff"], queryFn: () => listStaff() });
  const certsQuery = useQuery({ queryKey: ["admin-certs"], queryFn: listCertificates });
  const analyticsQuery = useQuery({ queryKey: ["admin-analytics"], queryFn: getHospitalAnalytics });

  const lessons = lessonsQuery.data ?? [];
  const signs = signsQuery.data ?? [];
  const staff = staffQuery.data ?? [];
  const certificates = certsQuery.data ?? [];
  const isLoading = lessonsQuery.isLoading || signsQuery.isLoading;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Portal"
        title="Admin & Trainer Portal"
        description="Manage healthcare ISL lessons, vocabulary, assessments, and facility compliance."
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
              lessons={lessons}
              signs={signs}
              staff={staff}
              certificates={certificates}
              analytics={analyticsQuery.data}
              isLoading={isLoading}
            />
          )}

          {section === "lessons" && <LessonsSection lessons={lessons} />}
          {section === "signs" && <SignsSection signs={signs} />}
          {section === "assessments" && <AssessmentsSection />}
          {section === "users" && <UsersSection staff={staff} />}
          {section === "settings" && <SettingsSection />}
        </section>
      </div>
    </PageShell>
  );
}
