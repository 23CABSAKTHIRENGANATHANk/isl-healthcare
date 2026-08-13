import { motion, useReducedMotion } from "framer-motion";
import { Bot, Hand, Type, Volume2 } from "lucide-react";

const nodes = [
  { label: "Sign", icon: Hand, tone: "bg-primary/10 text-primary" },
  { label: "AI", icon: Bot, tone: "bg-teal/15 text-teal" },
  { label: "Text", icon: Type, tone: "bg-accent text-accent-foreground" },
  { label: "Voice", icon: Volume2, tone: "bg-success/10 text-success" },
] as const;

/** Animated Sign → AI → Text → Voice pipeline used in the hero. */
export function HeroPipeline() {
  const reduce = useReducedMotion();

  return (
    <div
      className="rounded-3xl border border-border/70 bg-card p-6 shadow-lift sm:p-8"
      role="img"
      aria-label="Pipeline: a sign is captured, interpreted by AI, converted to text, then spoken aloud."
    >
      <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        How VoiceBridge works
      </p>
      <ol className="flex items-center justify-between gap-1">
        {nodes.map((node, index) => (
          <li key={node.label} className="flex flex-1 items-center gap-1 last:flex-none">
            <motion.div
              className="flex flex-col items-center gap-2"
              {...(reduce
                ? {}
                : {
                    initial: { opacity: 0, scale: 0.85 },
                    animate: { opacity: 1, scale: 1 },
                    transition: { delay: 0.15 * index, duration: 0.4 },
                  })}
            >
              <span className={`grid size-14 place-items-center rounded-2xl ${node.tone}`}>
                <node.icon className="size-6" aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold text-foreground sm:text-sm">{node.label}</span>
            </motion.div>
            {index < nodes.length - 1 ? (
              <span className="relative mx-1 h-0.5 flex-1 overflow-hidden rounded-full bg-border" aria-hidden="true">
                {reduce ? (
                  <span className="absolute inset-0 bg-gradient-brand opacity-60" />
                ) : (
                  <motion.span
                    className="absolute inset-y-0 w-1/2 bg-gradient-brand"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.35, ease: "easeInOut" }}
                  />
                )}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="mt-6 rounded-xl bg-surface px-4 py-3 text-sm text-muted-foreground">
        Recognition currently runs in clearly labelled <strong className="text-foreground">Demo Mode</strong> — results
        are simulated, never presented as live AI predictions.
      </p>
    </div>
  );
}
