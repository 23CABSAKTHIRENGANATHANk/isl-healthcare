import {
  BadgeCheck,
  BookOpen,
  Building2,
  ClipboardCheck,
  Hand,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type AdminSection =
  | "dashboard"
  | "users"
  | "hospitals"
  | "lessons"
  | "signs"
  | "assessments"
  | "certificates"
  | "analytics"
  | "settings";

export const ADMIN_SECTIONS: { id: AdminSection; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "hospitals", label: "Hospitals", icon: Building2 },
  { id: "lessons", label: "Lessons", icon: BookOpen },
  { id: "signs", label: "Signs", icon: Hand },
  { id: "assessments", label: "Assessments", icon: ClipboardCheck },
  { id: "certificates", label: "Certificates", icon: ScrollText },
  { id: "analytics", label: "Analytics", icon: LayoutDashboard },
  { id: "settings", label: "Settings", icon: Settings },
];

export function TrainerProfileCard() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        AR
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">Ananya Rao</p>
        <p className="flex items-center gap-1 text-xs font-medium text-teal">
          <BadgeCheck className="size-3.5" aria-hidden="true" />
          Certified Deaf ISL Trainer
        </p>
        <p className="flex items-center gap-1 text-xs text-success">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Verified trainer
        </p>
      </div>
    </div>
  );
}

export function AdminSidebar({
  active,
  onChange,
}: {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
}) {
  return (
    <nav aria-label="Admin sections" className="space-y-4">
      <TrainerProfileCard />
      <ul className="hidden flex-col gap-1 md:flex" role="list">
        {ADMIN_SECTIONS.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              onClick={() => onChange(section.id)}
              aria-current={active === section.id ? "page" : undefined}
              className={cn(
                "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active === section.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <section.icon className="size-4" aria-hidden="true" />
              {section.label}
            </button>
          </li>
        ))}
      </ul>

      <div
        role="tablist"
        aria-label="Admin sections"
        className="-mx-1 flex gap-1 overflow-x-auto pb-1 md:hidden"
      >
        {ADMIN_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={active === section.id}
            onClick={() => onChange(section.id)}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
              active === section.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            <section.icon className="size-4" aria-hidden="true" />
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
