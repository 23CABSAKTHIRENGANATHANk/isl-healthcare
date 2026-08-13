import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardX } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/layout/AppLayout";
import { CardSkeleton } from "@/components/common/LoadingStates";
import { AssessmentRunner } from "@/features/assessment/AssessmentRunner";
import { getAssessment } from "@/services/assessment.service";

export const Route = createFileRoute("/assessment")({
  head: () => ({
    meta: [
      { title: "Healthcare ISL Assessment | ISL Setu" },
      {
        name: "description",
        content: "Take the Bronze Healthcare ISL Assessment: 20 questions across sign identification, matching and live camera practice.",
      },
      { property: "og:title", content: "Healthcare ISL Assessment | ISL Setu" },
      {
        property: "og:description",
        content: "Take the Bronze Healthcare ISL Assessment: 20 questions across sign identification, matching and live camera practice.",
      },
    ],
  }),
  component: AssessmentPage,
});

function AssessmentPage() {
  const { data: assessment, isLoading, isError } = useQuery({
    queryKey: ["assessment", "bronze"],
    queryFn: () => getAssessment("bronze"),
  });

  return (
    <PageShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Certification"
          title="Healthcare ISL Assessment"
          description="Complete this timed assessment to earn your Bronze healthcare ISL credential."
        />

        {isLoading ? (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton className="min-h-64" />
          </div>
        ) : isError || !assessment ? (
          <EmptyState
            icon={ClipboardX}
            title="Assessment unavailable"
            description="We couldn't load this assessment right now. Please refresh the page or try again shortly."
            tone="warning"
          />
        ) : (
          <AssessmentRunner assessment={assessment} />
        )}
      </div>
    </PageShell>
  );
}
