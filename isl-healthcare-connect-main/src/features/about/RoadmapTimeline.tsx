import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  GraduationCap,
  HeartPulse,
  Landmark,
  MapPinned,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface Phase {
  phase: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

const phases: Phase[] = [
  {
    phase: 1,
    title: "Healthcare MVP",
    description:
      "Build and refine the core ISL learning modules, AI practice (Demo Mode) and VoiceBridge communication tool for healthcare vocabulary.",
    icon: HeartPulse,
  },
  {
    phase: 2,
    title: "Selected hospitals & PHCs",
    description:
      "Pilot the platform with a small number of partner hospitals and Primary Health Centres to gather real-world feedback.",
    icon: Stethoscope,
  },
  {
    phase: 3,
    title: "ASHA/ANM & nursing institutions",
    description:
      "Extend training to ASHA and ANM workers and nursing institutions, who are often first points of contact in community healthcare.",
    icon: GraduationCap,
  },
  {
    phase: 4,
    title: "State-level expansion",
    description:
      "Broaden availability across a wider network of healthcare facilities within individual states, incorporating regional ISL variation.",
    icon: MapPinned,
  },
  {
    phase: 5,
    title: "National expansion",
    description:
      "Work towards making ISL Setu available to healthcare workers and facilities across the country.",
    icon: Landmark,
  },
  {
    phase: 6,
    title: "Education, Government, Banking & Workplaces",
    description:
      "Adapt the platform's architecture to serve additional sectors beyond healthcare, reusing the same learning and communication foundations.",
    icon: Building2,
  },
];

/**
 * Vertical (mobile) / alternating (desktop) roadmap with a connecting line
 * that draws in on scroll. All phases are explicitly labelled as planned,
 * not delivered — no claims of deployment.
 */
export function RoadmapTimeline() {
  const reduce = useReducedMotion();

  return (
    <div className="relative">
      <div
        className="absolute left-5 top-2 bottom-2 w-px bg-border md:left-1/2 md:-translate-x-1/2"
        aria-hidden="true"
      >
        <motion.div
          className="h-full w-full origin-top bg-gradient-brand"
          initial={reduce ? { scaleY: 1 } : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <ol className="relative flex flex-col gap-10 md:gap-14">
        {phases.map((item, index) => {
          const isRight = index % 2 === 1;
          return (
            <li
              key={item.phase}
              className="relative md:grid md:grid-cols-2 md:items-center md:gap-10"
            >
              <motion.div
                className={cn(
                  "absolute left-5 top-1 z-10 grid size-10 -translate-x-1/2 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-soft md:left-1/2",
                )}
                initial={reduce ? { scale: 1, opacity: 1 } : { scale: 0.4, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                aria-hidden="true"
              >
                <item.icon className="size-4" />
              </motion.div>

              <motion.div
                className={cn(
                  "ml-14 rounded-2xl border border-border/70 bg-card p-5 shadow-soft md:ml-0",
                  isRight ? "md:col-start-2" : "md:col-start-1 md:row-start-1 md:text-right",
                )}
                initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: isRight ? 24 : -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Phase {item.phase} · Planned
                </p>
                <h3 className="mt-1 text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
