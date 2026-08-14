import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Mic, Rocket } from "lucide-react";

import {
  AccessibilitySection,
  DeafCommunitySection,
  HealthcareFocusSection,
  MissionVisionSection,
  ProblemSection,
  SolutionSection,
  TechnologySection,
} from "@/features/about/AboutSections";
import { RoadmapTimeline } from "@/features/about/RoadmapTimeline";
import { PageHeader, SectionHeading } from "@/components/common/PageHeader";
import { PageShell } from "@/components/layout/AppLayout";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ISL Setu | Mission, Roadmap & Technology" },
      {
        name: "description",
        content:
          "Learn about ISL Setu's mission to make healthcare ISL communication accessible, our approach, technology and planned roadmap.",
      },
      { property: "og:title", content: "About ISL Setu" },
      {
        property: "og:description",
        content:
          "Our mission, the problem we're solving, how ISL Setu works, and a planned roadmap from healthcare MVP to national expansion.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell className="flex flex-col gap-16">
      <PageHeader
        eyebrow="About ISL Setu"
        title="Communication should never be the barrier to care"
        description="Learn ISL. Practice with AI. Communicate without barriers. Here's why we're building ISL Setu, how it works today, and where it's headed."
      />

      <Reveal as="section" aria-labelledby="mission-vision-heading">
        <h2 id="mission-vision-heading" className="sr-only">
          Mission and vision
        </h2>
        <MissionVisionSection />
      </Reveal>

      <section aria-labelledby="problem-heading" className="flex flex-col gap-6">
        <SectionHeading
          align="left"
          eyebrow="The problem"
          title="Why this matters"
          description="Deaf and hard-of-hearing patients face real, everyday barriers when accessing healthcare in India."
        />
        <ProblemSection />
      </section>

      <section aria-labelledby="solution-heading" className="flex flex-col gap-6">
        <SectionHeading
          eyebrow="Our approach"
          title="From learning to certified communication"
          description="ISL Setu guides healthcare workers through a clear, structured pathway."
        />
        <SolutionSection />
      </section>

      <section aria-labelledby="healthcare-focus-heading" className="flex flex-col gap-6">
        <SectionHeading
          align="left"
          eyebrow="Healthcare focus"
          title="Built for the people patients meet first"
          description="We start with the roles that shape a patient's day-to-day experience of care."
        />
        <HealthcareFocusSection />
      </section>

      <section aria-labelledby="technology-heading" className="flex flex-col gap-6">
        <SectionHeading
          align="left"
          eyebrow="Technology"
          title="How ISL Setu is built"
          description="A simple, extensible architecture designed for the future, not just healthcare today."
        />
        <TechnologySection />
      </section>

      <section aria-labelledby="accessibility-heading" className="flex flex-col gap-6">
        <SectionHeading
          align="left"
          eyebrow="Accessibility"
          title="Designed to be usable by everyone"
        />
        <AccessibilitySection />
      </section>

      <section aria-labelledby="deaf-community-heading" className="flex flex-col gap-6">
        <SectionHeading
          align="left"
          eyebrow="Working with the Deaf community"
          title="Built with, not just for"
        />
        <DeafCommunitySection />
      </section>

      <section aria-labelledby="roadmap-heading" className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Future expansion"
          title="Our planned roadmap"
          description="These are planned phases we are working towards, not milestones that have already been delivered or deployed."
        />
        <RoadmapTimeline />
      </section>

      <Reveal as="section" aria-labelledby="cta-heading">
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-gradient-hero px-6 py-12 text-center shadow-soft">
          <Rocket className="size-8 text-primary" aria-hidden="true" />
          <h2 id="cta-heading" className="text-2xl font-bold text-foreground sm:text-3xl">
            Ready to see ISL Setu in action?
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Start with a healthcare ISL lesson, or try VoiceBridge to see how our communication tool
            works.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="hero" size="lg" asChild>
              <Link to="/learn">
                <GraduationCap /> Start learning
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/voicebridge">
                <Mic /> Try VoiceBridge
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </PageShell>
  );
}
