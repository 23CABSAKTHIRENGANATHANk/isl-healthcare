import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/layout/AppLayout";
import { CertificationDashboard } from "@/features/certification/CertificationDashboard";
import { Toaster } from "@/components/ui/sonner";
import { listCertificates } from "@/services/assessment.service";

import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export const Route = createFileRoute("/certification")({
  head: () => ({
    meta: [
      { title: "Certification Dashboard | ISL Setu" },
      {
        name: "description",
        content:
          "Track your Bronze, Silver and Gold healthcare ISL certifications and view or download your credentials.",
      },
      { property: "og:title", content: "Certification Dashboard | ISL Setu" },
      {
        property: "og:description",
        content:
          "Track your Bronze, Silver and Gold healthcare ISL certifications and view or download your credentials.",
      },
    ],
  }),
  component: CertificationPageWrapper,
});

function CertificationPageWrapper() {
  return (
    <ProtectedRoute>
      <CertificationPage />
    </ProtectedRoute>
  );
}

function CertificationPage() {
  const {
    data: certificates,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["certificates"],
    queryFn: listCertificates,
  });

  return (
    <PageShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Credentials"
          title="Certification Dashboard"
          description="Track your progress across Bronze, Silver and Gold healthcare ISL certifications."
        />

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-3" aria-busy="true" aria-live="polite">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-96 animate-pulse rounded-2xl border border-border bg-muted/40"
              />
            ))}
          </div>
        ) : isError || !certificates || certificates.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Certificates unavailable"
            description="We couldn't load your certification progress right now. Please try again shortly."
            tone="warning"
          />
        ) : (
          <CertificationDashboard certificates={certificates} />
        )}
      </div>
      <Toaster />
    </PageShell>
  );
}
