import {
  Activity,
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  ClipboardCheck,
  Hand,
  History,
  LayoutDashboard,
  LineChart,
  ScrollText,
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
  | "audit"
  | "health";

export const ADMIN_SECTIONS: { id: AdminSection; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "hospitals", label: "Hospitals", icon: Building2 },
  { id: "lessons", label: "Lessons", icon: BookOpen },
  { id: "signs", label: "ISL Signs", icon: Hand },
  { id: "assessments", label: "Assessments", icon: ClipboardCheck },
  { id: "certificates", label: "Certificates", icon: ScrollText },
  { id: "analytics", label: "Analytics", icon: LineChart },
  { id: "audit", label: "Audit Logs", icon: History },
  { id: "health", label: "System Health", icon: Activity },
];

export function TrainerProfileCard() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-soft">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-brand text-sm font-bold text-primary-foreground shadow-sm">
        AR
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">Ananya Rao</p>
        <p className="flex items-center gap-1 text-[11px] font-semibold text-teal-400">
          <BadgeCheck className="size-3.5" aria-hidden="true" />
          Certified Deaf ISL Trainer
        </p>
        <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Super Admin Access
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
    <nav aria-label="Admin Control Center" className="space-y-4">
      <TrainerProfileCard />

      <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-soft">
        <div className="px-2 py-1.5 mb-1.5 border-b border-border/40">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            ADMIN CONTROL CENTER
          </p>
          <p className="text-xs font-semibold text-foreground">Overview</p>
        </div>

        {/* Desktop Vertical Menu */}
        <ul className="hidden flex-col gap-1 md:flex" role="list">
          {ADMIN_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = active === section.id;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onChange(section.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all text-left",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      isActive ? "text-primary-foreground" : "text-muted-foreground",
                    )}
                    aria-hidden="true"
                  />
                  <span>{section.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Mobile Horizontal Scroll Tabs */}
        <div
          role="tablist"
          aria-label="Admin sections"
          className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x md:hidden pt-1"
        >
          {ADMIN_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = active === section.id;
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(section.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 border border-border/60 text-muted-foreground",
                )}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
