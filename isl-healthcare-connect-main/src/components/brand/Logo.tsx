import { Link } from "@tanstack/react-router";

import logo from "@/assets/isl-setu-logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  asLink?: boolean;
}

const sizes = {
  sm: { box: "h-8 w-8", title: "text-base", tagline: "text-[11px]" },
  md: { box: "h-10 w-10", title: "text-lg", tagline: "text-xs" },
  lg: { box: "h-14 w-14", title: "text-2xl", tagline: "text-sm" },
};

export function Logo({ className, showTagline = false, size = "md", asLink = true }: LogoProps) {
  const s = sizes[size];
  const content = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        width={512}
        height={512}
        loading="lazy"
        className={cn(s.box, "shrink-0 object-contain")}
      />
      <span className="flex flex-col leading-tight">
        <span className={cn("font-display font-bold tracking-tight text-foreground", s.title)}>
          ISL <span className="text-gradient-brand">Setu</span>
        </span>
        {showTagline ? (
          <span className={cn("text-muted-foreground", s.tagline)}>
            Learn ISL. Practice with AI. Communicate without barriers.
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!asLink) return content;

  return (
    <Link to="/" aria-label="ISL Setu home" className="rounded-md">
      {content}
    </Link>
  );
}
