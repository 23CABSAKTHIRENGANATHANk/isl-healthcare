import { Activity, Award, Building2, CalendarClock, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { Hospital } from "@/types";

export function ReadyCard({
  hospital,
  certifiedTotal,
}: {
  hospital: Hospital;
  certifiedTotal: number;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 shadow-lift">
      <div className="bg-gradient-brand p-6 text-primary-foreground sm:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em]">
          <ShieldCheck className="size-4" aria-hidden="true" />
          ISL-Ready Facility Status
        </div>
        <p className="mt-2 max-w-2xl text-sm text-primary-foreground/90">
          This badge reflects an ISL Setu platform status based on staff training progress. It is
          not a government or official accreditation.
        </p>
      </div>
      <CardContent className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Award className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Certified staff</p>
            <p className="text-lg font-semibold text-foreground">{certifiedTotal}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal/10 text-teal">
            <Building2 className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Departments covered</p>
            <p className="text-lg font-semibold text-foreground">
              {hospital.departments_covered} of {hospital.departments_total}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
            <CalendarClock className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Last training</p>
            <p className="text-lg font-semibold text-foreground">
              {new Date(hospital.last_training_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success/10 text-success">
            <Activity className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Active status</p>
            <p className="text-lg font-semibold text-foreground capitalize">
              {hospital.readiness.replace("_", " ")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
