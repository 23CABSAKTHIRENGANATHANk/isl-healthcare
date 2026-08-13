import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { PageHeader, SectionHeading } from "@/components/common/PageHeader";
import { PageShell } from "@/components/layout/AppLayout";
import { Reveal } from "@/components/motion/Reveal";
import { FeedbackForm } from "@/features/responsible-ai/FeedbackForm";
import {
  AccessibilityChecklistSection,
  DataPrivacySection,
  HumanOversightSection,
  KnownLimitationsSection,
  ResponsibleAiSection,
} from "@/features/responsible-ai/ResponsibleAiSections";

export const Route = createFileRoute("/accessibility")({
  head: () => ({
    meta: [
      { title: "Responsible AI & Accessibility | ISL Setu" },
      {
        name: "description",
        content:
          "How ISL Setu handles AI limitations, human oversight, data privacy and accessibility commitments, plus how to report an issue.",
      },
      { property: "og:title", content: "Responsible AI & Accessibility Statement" },
      {
        property: "og:description",
        content:
          "AI is an assistance tool, not a replacement for interpreters. See our accessibility checklist and how to report issues.",
      },
    ],
  }),
  component: AccessibilityPage,
});

function AccessibilityPage() {
  return (
    <PageShell className="flex flex-col gap-14">
      <PageHeader
        eyebrow="Responsible AI & accessibility"
        title="Built responsibly, checked honestly"
        description="ISL Setu's AI features are assistance tools with clear limits. Here's what we do, what we don't do, and how we handle your data."
      />

      <Reveal as="section" aria-labelledby="responsible-ai-heading">
        <h2 id="responsible-ai-heading" className="sr-only">
          Responsible AI
        </h2>
        <ResponsibleAiSection />
      </Reveal>

      <Reveal as="section" aria-labelledby="oversight-heading">
        <h2 id="oversight-heading" className="sr-only">
          Human oversight and escalation
        </h2>
        <HumanOversightSection />
      </Reveal>

      <section aria-labelledby="privacy-heading" className="flex flex-col gap-6">
        <SectionHeading align="left" eyebrow="Data & privacy" title="What we store, and what we don't" />
        <DataPrivacySection />
      </section>

      <section aria-labelledby="checklist-heading" className="flex flex-col gap-6">
        <SectionHeading
          eyebrow="Accessibility commitments"
          title="A checklist we hold ourselves to"
          description="Each commitment includes a short note on how it's implemented in ISL Setu."
        />
        <AccessibilityChecklistSection />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal aria-labelledby="limitations-heading">
          <h2 id="limitations-heading" className="sr-only">
            Known limitations
          </h2>
          <KnownLimitationsSection />
        </Reveal>
        <Reveal aria-labelledby="feedback-heading">
          <h2 id="feedback-heading" className="sr-only">
            Report an issue
          </h2>
          <FeedbackForm />
        </Reveal>
      </div>

      <Reveal as="section" className="flex items-center gap-3 rounded-2xl border border-border/70 bg-surface p-6">
        <ShieldCheck className="size-6 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          This statement is reviewed as ISL Setu evolves. If something here doesn't match what you experience in
          the product, please tell us using the form above.
        </p>
      </Reveal>
    </PageShell>
  );
}
