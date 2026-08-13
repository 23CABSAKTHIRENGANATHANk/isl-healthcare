import {
  AlertTriangle,
  Database,
  Eye,
  EyeOff,
  Lock,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Card, CardContent } from "@/components/ui/card";

const vocabulary = ["HELP", "PAIN", "DOCTOR", "MEDICINE", "EMERGENCY", "WAIT", "WATER", "YES", "NO"];

export function ResponsibleAiSection() {
  const points = [
    "AI is an assistance tool, not a replacement for qualified human interpreters.",
    `The current MVP recognises a limited healthcare vocabulary: ${vocabulary.join(", ")}.`,
    "Sign recognition today runs in a clearly labelled Demo Mode simulation — it is not a live trained model prediction.",
    "Like any AI system, recognition can make mistakes and should not be relied on for critical decisions.",
    "Critical clinical communication must always follow appropriate professional procedures and, where needed, a qualified interpreter.",
    "ISL Setu does not diagnose disease or provide medical advice of any kind.",
    "Camera data is not stored by default, and video frames are not uploaded from the practice screens.",
    "Sign content is reviewed with Deaf ISL users and instructors before it is published.",
  ];

  return (
    <Card className="rounded-2xl border-primary/20 shadow-soft">
      <CardContent className="flex flex-col gap-4 p-7">
        <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-bold text-foreground">Responsible AI</h2>
        <ul className="flex flex-col gap-3">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
        <div className="mt-2 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <p className="flex items-start gap-2 text-sm font-medium text-foreground">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            Demo Mode: recognition results shown during practice are simulated for demonstration purposes and do
            not reflect a deployed, clinically validated model.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function HumanOversightSection() {
  const scenarios = [
    "Any discussion of diagnosis, treatment options, consent, or medication changes.",
    "Emergency or high-risk situations where miscommunication could affect safety.",
    "Legal, financial or administrative matters that require precise, verified communication.",
    "Any time the patient or staff member is unsure whether a message has been understood correctly.",
  ];
  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardContent className="flex flex-col gap-4 p-7">
        <span className="grid size-11 place-items-center rounded-xl bg-info/10 text-info">
          <PhoneCall className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-bold text-foreground">Human oversight &amp; escalation</h2>
        <p className="text-muted-foreground">
          ISL Setu is designed to support basic, everyday communication. Please escalate to a qualified human
          interpreter in situations such as:
        </p>
        <ul className="flex flex-col gap-2">
          {scenarios.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <Stethoscope className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function DataPrivacySection() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card className="rounded-2xl border-success/20 bg-success/5 shadow-soft">
        <CardContent className="flex flex-col gap-3 p-7">
          <span className="grid size-11 place-items-center rounded-xl bg-success/10 text-success">
            <Database className="size-5" aria-hidden="true" />
          </span>
          <h3 className="text-lg font-semibold text-foreground">What is stored</h3>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li>Account details (such as name, role and login information).</li>
            <li>Learning progress, lesson completion and assessment results.</li>
          </ul>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-destructive/20 bg-destructive/5 shadow-soft">
        <CardContent className="flex flex-col gap-3 p-7">
          <span className="grid size-11 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <EyeOff className="size-5" aria-hidden="true" />
          </span>
          <h3 className="text-lg font-semibold text-foreground">What is not stored</h3>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li>Camera footage from practice screens is not stored by default.</li>
            <li>Video frames are not uploaded from the practice screens.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

interface ChecklistItem {
  icon: LucideIcon;
  title: string;
  note: string;
}

const checklist: ChecklistItem[] = [
  {
    icon: Eye,
    title: "WCAG-aware colour contrast",
    note: "Text and interactive elements are checked against accessible contrast ratios using our design tokens.",
  },
  {
    icon: Lock,
    title: "Full keyboard navigation",
    note: "Every interactive control, including custom components, can be operated without a mouse.",
  },
  {
    icon: ShieldCheck,
    title: "Visible focus states",
    note: "Focused elements show a clear visible outline so keyboard users always know where they are.",
  },
  {
    icon: Sparkles,
    title: "ARIA labels",
    note: "Icon-only buttons and custom controls carry descriptive aria-labels for screen reader users.",
  },
  {
    icon: Eye,
    title: "Image alt text",
    note: "Meaningful images include descriptive alt text; decorative icons are hidden from assistive tech.",
  },
  {
    icon: ShieldCheck,
    title: "Captions & subtitles",
    note: "Lesson videos include captions so content is accessible without audio.",
  },
  {
    icon: ShieldCheck,
    title: "Large touch targets",
    note: "Interactive elements keep a minimum 44px tap target for easier use on touch devices.",
  },
  {
    icon: EyeOff,
    title: "Reduced-motion support",
    note: "Animations respect the operating system's reduced-motion preference and fall back to static content.",
  },
  {
    icon: AlertTriangle,
    title: "Never colour alone for status",
    note: "Status is always paired with an icon and text label, never conveyed by colour alone.",
  },
];

export function AccessibilityChecklistSection() {
  return (
    <RevealGroup className="grid gap-4 sm:grid-cols-2">
      {checklist.map((item) => (
        <RevealItem key={item.title}>
          <Card className="h-full rounded-2xl border-border/70 shadow-soft">
            <CardContent className="flex h-full flex-col gap-2 p-5">
              <div className="flex items-center gap-2">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal/10 text-teal">
                  <item.icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{item.note}</p>
            </CardContent>
          </Card>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

export function KnownLimitationsSection() {
  const limitations = [
    "Sign recognition is currently a Demo Mode simulation and does not reflect a validated real-time model.",
    "The recognised vocabulary is intentionally small and healthcare-focused, not comprehensive ISL.",
    "Regional variation in ISL means some signs shown may differ from local usage in your area.",
    "The platform does not yet support every assistive technology or device configuration.",
  ];
  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardContent className="flex flex-col gap-3 p-7">
        <span className="grid size-11 place-items-center rounded-xl bg-warning/10 text-warning">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-bold text-foreground">Known limitations</h2>
        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
          {limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
