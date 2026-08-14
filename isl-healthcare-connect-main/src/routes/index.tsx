import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  ClipboardCheck,
  Clock,
  Globe2,
  GraduationCap,
  Hand,
  HeartHandshake,
  Info,
  Languages,
  MapPin,
  MessageCircle,
  Mic,
  Rocket,
  Smartphone,
  Sparkles,
  Stethoscope,
  UserCheck,
  Users,
  WifiOff,
} from "lucide-react";

import { SectionHeading } from "@/components/common/PageHeader";
import { HeroPipeline } from "@/features/landing/HeroPipeline";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ISL Setu — Learn Indian Sign Language for Healthcare" },
      {
        name: "description",
        content:
          "Learn Indian Sign Language, practise with AI-assisted feedback and communicate basic healthcare needs with confidence. Learn, practise, assess, certify.",
      },
      { property: "og:title", content: "ISL Setu — Indian Sign Language for Healthcare" },
      {
        property: "og:description",
        content: "Learn ISL. Practice with AI. Communicate without barriers.",
      },
    ],
  }),
  component: Landing,
});

const stats = [
  {
    value: 18,
    suffix: "M+",
    label: "Estimated hearing-impaired population in India",
    note: "Estimate, not a verified count",
    icon: Users,
  },
  {
    value: 4,
    suffix: "",
    label: "Core platform capabilities",
    note: "Learn · Practice · Communicate · Certify",
    icon: Sparkles,
  },
  {
    value: 50,
    suffix: "+",
    label: "Healthcare signs planned for MVP",
    note: "Planned scope for the first release",
    icon: Hand,
  },
  {
    value: 24,
    suffix: "/7",
    label: "Digital learning access",
    note: "Self-paced, any shift pattern",
    icon: Clock,
  },
];

const problems = [
  {
    icon: MessageCircle,
    title: "Communication Gap",
    body: "Deaf patients often cannot describe symptoms, and staff cannot explain instructions, so care depends on guesswork.",
  },
  {
    icon: UserCheck,
    title: "Interpreter Availability",
    body: "Qualified ISL interpreters are scarce and rarely available at the moment a patient walks in.",
  },
  {
    icon: MapPin,
    title: "Rural Access",
    body: "District hospitals, PHCs and community health workers have the least access to interpretation support.",
  },
  {
    icon: GraduationCap,
    title: "Professional Skill Gap",
    body: "ISL is not part of most healthcare training, so even willing staff have no structured way to learn.",
  },
];

const capabilities = [
  {
    icon: BookOpen,
    title: "Learn",
    body: "Structured healthcare lessons with sign breakdowns, captions and quizzes.",
    to: "/learn" as const,
    cta: "Browse lessons",
  },
  {
    icon: Hand,
    title: "Practice",
    body: "Camera practice with instant feedback, in clearly labelled Demo Mode.",
    to: "/practice" as const,
    cta: "Open practice",
  },
  {
    icon: Mic,
    title: "Communicate",
    body: "VoiceBridge turns selected ISL signs into text and spoken output.",
    to: "/voicebridge" as const,
    cta: "Try VoiceBridge",
  },
  {
    icon: Award,
    title: "Certify",
    body: "Bronze, Silver and Gold ISL Setu platform credentials for staff.",
    to: "/certification" as const,
    cta: "See certifications",
  },
];

const steps = [
  {
    icon: BookOpen,
    title: "Learn",
    body: "Work through healthcare-first lesson categories at your own pace.",
  },
  {
    icon: Hand,
    title: "Practice",
    body: "Rehearse each sign in front of the camera with guided hand positioning.",
  },
  {
    icon: Mic,
    title: "Communicate",
    body: "Use VoiceBridge at the desk or bedside for core patient needs.",
  },
  {
    icon: ClipboardCheck,
    title: "Assess",
    body: "Take a mixed assessment covering identification and live signing tasks.",
  },
  {
    icon: Award,
    title: "Certify",
    body: "Earn an ISL Setu credential and track it at facility level.",
  },
];

const rural = [
  {
    icon: WifiOff,
    title: "Offline Learning",
    body: "Planned progressive web app support so lessons keep working on weak connections.",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    body: "Large targets, bottom navigation and camera-first layouts on small screens.",
  },
  {
    icon: HeartHandshake,
    title: "ASHA / ANM Friendly",
    body: "Short, role-relevant modules designed around community health visits.",
  },
  {
    icon: Building2,
    title: "District ISL Champions",
    body: "A planned model where trained staff support colleagues locally.",
  },
];

function Landing() {
  return (
    <>
      <section className="bg-gradient-hero">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <Reveal>
            <Badge
              variant="outline"
              className="mb-5 gap-1.5 rounded-full border-primary/25 bg-card px-3 py-1.5"
            >
              <Stethoscope className="size-3.5 text-primary" aria-hidden="true" />
              Healthcare-first Indian Sign Language platform
            </Badge>
            <h1 className="text-4xl font-bold text-foreground sm:text-5xl lg:text-[3.4rem]">
              Breaking the Communication Barrier in Healthcare
            </h1>
            <p className="mt-5 text-lg font-medium text-foreground/80">
              Learn Indian Sign Language, practice with AI, and communicate with confidence.
            </p>
            <p className="mt-4 max-w-xl text-muted-foreground">
              ISL Setu is a complete learning, communication and certification platform for
              healthcare teams — receptionists, nurses, pharmacists, ASHA and ANM workers, security
              staff, doctors and counsellors. Learn the signs, practise them, then use them where
              they matter.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/learn">
                  <GraduationCap aria-hidden="true" />
                  Start Learning
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/voicebridge">
                  <Mic aria-hidden="true" />
                  Try VoiceBridge
                </Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <HeroPipeline />
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="impact-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 id="impact-heading" className="sr-only">
          Platform context and scope
        </h2>
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <RevealItem key={stat.label} className="h-full">
              <Card className="h-full rounded-2xl border-border/70 shadow-soft">
                <CardContent className="flex h-full flex-col gap-2 p-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <stat.icon className="size-5" aria-hidden="true" />
                  </span>
                  <p className="font-display text-3xl font-bold text-foreground">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm font-medium text-foreground">{stat.label}</p>
                  <p className="mt-auto text-xs text-muted-foreground">{stat.note}</p>
                </CardContent>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section aria-labelledby="problem-heading" className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="The problem"
              title="Healthcare Communication Should Never Be a Barrier"
              description="Four gaps show up again and again when a Deaf patient enters a hospital."
            />
          </Reveal>
          <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {problems.map((problem) => (
              <RevealItem key={problem.title} className="h-full">
                <Card className="h-full rounded-2xl border-border/70 shadow-soft transition-shadow hover:shadow-lift">
                  <CardContent className="space-y-3 p-6">
                    <span className="grid size-11 place-items-center rounded-xl bg-destructive/10 text-destructive">
                      <problem.icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">{problem.title}</h3>
                    <p className="text-sm text-muted-foreground">{problem.body}</p>
                  </CardContent>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section aria-labelledby="solution-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="The platform"
            title="One Platform. Four Capabilities."
            description="Not a translator app — a full learning, practice, communication and certification journey."
          />
        </Reveal>
        <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((item) => (
            <RevealItem key={item.title} className="h-full">
              <Card className="group h-full rounded-2xl border-border/70 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
                <CardContent className="flex h-full flex-col gap-3 p-6">
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground">
                    <item.icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                  <Button
                    asChild
                    variant="ghost"
                    className="mt-auto justify-start px-0 text-primary hover:bg-transparent"
                  >
                    <Link to={item.to}>{item.cta} →</Link>
                  </Button>
                </CardContent>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section aria-labelledby="how-heading" className="bg-surface py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading eyebrow="How it works" title="From first sign to certified staff" />
          </Reveal>
          <ol className="relative mt-10 space-y-6 border-l border-border pl-6">
            {steps.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 0.06}>
                <span className="absolute -left-[13px] grid size-6 place-items-center rounded-full bg-gradient-brand text-[11px] font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <Card className="rounded-2xl border-border/70 shadow-soft">
                  <CardContent className="flex items-start gap-4 p-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal/10 text-teal">
                      <step.icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.body}</p>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="rural-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Reach"
            title="Designed for Every India"
            description="Built for district hospitals and community health workers, not only metro facilities. These are design commitments and planned capabilities, not deployments."
          />
        </Reveal>
        <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {rural.map((item) => (
            <RevealItem key={item.title} className="h-full">
              <Card className="h-full rounded-2xl border-border/70 shadow-soft">
                <CardContent className="space-y-3 p-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-teal/10 text-teal">
                    <item.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                  <Badge variant="secondary" className="gap-1.5 rounded-full">
                    <Rocket className="size-3.5" aria-hidden="true" />
                    Planned
                  </Badge>
                </CardContent>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal>
          <Card className="mt-10 rounded-2xl border-primary/20 bg-card shadow-soft">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Languages className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  ISL is not one uniform language
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  ISL Setu uses credible ISL learning resources and clearly labels regional
                  variations rather than presenting one form as universal. Where a sign differs
                  across regions, the lesson says so and asks you to confirm the local variant with
                  Deaf signers in your area.
                </p>
                <Button
                  asChild
                  variant="ghost"
                  className="mt-3 px-0 text-primary hover:bg-transparent"
                >
                  <Link to="/accessibility">
                    <Info aria-hidden="true" />
                    Read our Responsible AI &amp; accessibility statement
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground">
              <Globe2 className="size-6" aria-hidden="true" />
            </span>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Start with one sign. Change how your facility communicates.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Healthcare first, with the architecture ready for education, government, banking and
              workplace sectors next.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/signup">
                  <BadgeCheck aria-hidden="true" />
                  Create a free account
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/about">About ISL Setu</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
