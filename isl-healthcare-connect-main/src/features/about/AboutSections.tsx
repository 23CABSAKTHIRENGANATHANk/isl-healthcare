import { Link } from "@tanstack/react-router";
import {
  Cloud,
  HeartHandshake,
  Landmark,
  MapPin,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Card, CardContent } from "@/components/ui/card";

interface IconCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "primary" | "teal" | "gold" | "success";
}

const toneClasses: Record<NonNullable<IconCardProps["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  teal: "bg-teal/10 text-teal",
  gold: "bg-gold/15 text-gold",
  success: "bg-success/10 text-success",
};

export function IconCard({ icon: Icon, title, description, tone = "primary" }: IconCardProps) {
  return (
    <Card className="h-full rounded-2xl border-border/70 shadow-soft transition-shadow hover:shadow-lift">
      <CardContent className="flex h-full flex-col gap-3 p-6">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-xl ${toneClasses[tone]}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

/** Mission and Vision, presented as two visually distinct statement cards. */
export function MissionVisionSection() {
  return (
    <RevealGroup className="grid gap-5 md:grid-cols-2">
      <RevealItem>
        <Card className="h-full rounded-2xl border-primary/20 bg-primary/5 shadow-soft">
          <CardContent className="flex h-full flex-col gap-3 p-7">
            <span className="grid size-12 place-items-center rounded-xl bg-primary/15 text-primary">
              <Target className="size-6" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-bold text-foreground">Our mission</h2>
            <p className="text-muted-foreground">
              To make basic Indian Sign Language communication more accessible across healthcare
              services.
            </p>
          </CardContent>
        </Card>
      </RevealItem>
      <RevealItem>
        <Card className="h-full rounded-2xl border-teal/20 bg-teal/5 shadow-soft">
          <CardContent className="flex h-full flex-col gap-3 p-7">
            <span className="grid size-12 place-items-center rounded-xl bg-teal/15 text-teal">
              <Sparkles className="size-6" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-bold text-foreground">Our vision</h2>
            <p className="text-muted-foreground">
              A healthcare system where communication is not a barrier to receiving essential care.
            </p>
          </CardContent>
        </Card>
      </RevealItem>
    </RevealGroup>
  );
}

const problems: { title: string; description: string }[] = [
  {
    title: "Communication gap in healthcare",
    description:
      "Deaf and hard-of-hearing patients often struggle to communicate symptoms, history and consent clearly with healthcare staff.",
  },
  {
    title: "Interpreter scarcity",
    description:
      "Qualified ISL interpreters are in short supply, and are rarely available on demand in everyday clinical settings.",
  },
  {
    title: "Rural access",
    description:
      "Rural and semi-urban facilities have even less access to interpreters or ISL-aware staff than urban hospitals.",
  },
  {
    title: "Professional skill gaps",
    description:
      "Most doctors, nurses and front-desk staff have had no structured opportunity to learn basic healthcare ISL.",
  },
];

export function ProblemSection() {
  return (
    <RevealGroup className="grid gap-5 sm:grid-cols-2">
      {problems.map((item) => (
        <RevealItem key={item.title}>
          <IconCard icon={Users} title={item.title} description={item.description} tone="gold" />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

const solutionSteps = ["Learn", "Practice", "Communicate", "Assess", "Certify", "Adopt"];

export function SolutionSection() {
  return (
    <RevealGroup
      className="flex flex-wrap items-stretch justify-center gap-3"
      aria-label="ISL Setu solution pathway"
    >
      {solutionSteps.map((step, index) => (
        <RevealItem key={step} className="flex items-center gap-3">
          <div className="flex min-w-[9rem] flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card px-5 py-4 text-center shadow-soft">
            <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {index + 1}
            </span>
            <p className="text-sm font-semibold text-foreground">{step}</p>
          </div>
          {index < solutionSteps.length - 1 ? (
            <span className="hidden text-muted-foreground sm:inline" aria-hidden="true">
              →
            </span>
          ) : null}
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

const roles = [
  "Nurses",
  "Receptionists",
  "Pharmacists",
  "ASHA / ANM workers",
  "Security staff",
  "Doctors",
  "Counsellors",
];

export function HealthcareFocusSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <Card className="rounded-2xl border-border/70 shadow-soft">
        <CardContent className="flex flex-col gap-3 p-7">
          <span className="grid size-11 place-items-center rounded-xl bg-success/10 text-success">
            <Stethoscope className="size-5" aria-hidden="true" />
          </span>
          <h3 className="text-lg font-semibold text-foreground">Why healthcare first</h3>
          <p className="text-muted-foreground">
            Healthcare interactions are frequent, high-stakes and time-sensitive. Even a small
            shared vocabulary of signs — like HELP, PAIN or DOCTOR — can meaningfully improve a
            patient's experience and safety. Starting here lets us prove the model where the need is
            most urgent before expanding elsewhere.
          </p>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border/70 shadow-soft">
        <CardContent className="flex flex-col gap-3 p-7">
          <span className="grid size-11 place-items-center rounded-xl bg-teal/10 text-teal">
            <UserRound className="size-5" aria-hidden="true" />
          </span>
          <h3 className="text-lg font-semibold text-foreground">Roles ISL Setu serves</h3>
          <ul className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <li
                key={role}
                className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground"
              >
                {role}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export function TechnologySection() {
  return (
    <RevealGroup className="grid gap-5 md:grid-cols-3">
      <RevealItem>
        <IconCard
          icon={Cloud}
          title="Web front end & cloud backend"
          description="A React-based web front end paired with a cloud backend that handles authentication, the learning database and content storage."
          tone="primary"
        />
      </RevealItem>
      <RevealItem>
        <IconCard
          icon={ScanFace}
          title="Recognition service boundary (Demo Mode)"
          description="Sign practice runs through a single predictSign service boundary. Today this is a clearly labelled Demo Mode simulation, not a live trained model — built this way so a real recognition model can be swapped in later without reworking the app."
          tone="gold"
        />
      </RevealItem>
      <RevealItem>
        <IconCard
          icon={Landmark}
          title="Built to extend beyond healthcare"
          description="The architecture separates learning content, practice and communication tools so Education, Government, Banking and Workplace sectors can be added later without a rewrite."
          tone="teal"
        />
      </RevealItem>
    </RevealGroup>
  );
}

export function AccessibilitySection() {
  const items = [
    "WCAG-aware colour contrast throughout the interface",
    "Full keyboard navigation for every interactive control",
    "Visible focus states on all focusable elements",
    "ARIA labels on icon-only buttons and controls",
    "Captions on lesson videos",
    "Large, comfortable touch targets (minimum 44px)",
    "Support for reduced-motion preferences",
  ];
  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardContent className="flex flex-col gap-4 p-7">
        <span className="grid size-11 place-items-center rounded-xl bg-info/10 text-info">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <p className="text-muted-foreground">
          Accessibility is a product requirement, not an afterthought. ISL Setu is designed around:
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <Link
          to="/accessibility"
          className="mt-1 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Read our full Responsible AI &amp; Accessibility statement →
        </Link>
      </CardContent>
    </Card>
  );
}

export function DeafCommunitySection() {
  const points = [
    "Sign content is reviewed together with Deaf ISL users and instructors before it is published.",
    "Indian Sign Language varies by region — content is labelled with this in mind rather than presented as one universal standard.",
    "We draw on credible, established ISL learning resources rather than inventing signs ourselves.",
  ];
  return (
    <Card className="rounded-2xl border-border/70 bg-surface shadow-soft">
      <CardContent className="flex flex-col gap-4 p-7">
        <span className="grid size-11 place-items-center rounded-xl bg-teal/10 text-teal">
          <HeartHandshake className="size-5" aria-hidden="true" />
        </span>
        <h3 className="text-lg font-semibold text-foreground">Deaf community involvement</h3>
        <ul className="flex flex-col gap-3">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
