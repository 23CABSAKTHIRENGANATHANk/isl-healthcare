import { Award, BookOpen, CheckCircle2, Cpu, Globe2, Hand, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { StatCard } from "@/components/common/StatCard";
import { StatGridSkeleton } from "@/components/common/LoadingStates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Certificate, HospitalAnalytics, Lesson, Sign, StaffMember } from "@/types";

const config = {
  bronze: { label: "Bronze", color: "var(--color-chart-1)" },
  silver: { label: "Silver", color: "var(--color-chart-2)" },
  gold: { label: "Gold", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

export function DashboardSection({
  lessons,
  signs,
  staff,
  certificates,
  analytics,
  isLoading,
}: {
  lessons: Lesson[];
  signs: Sign[];
  staff: StaffMember[];
  certificates: Certificate[];
  analytics: HospitalAnalytics | undefined;
  isLoading: boolean;
}) {
  if (isLoading) return <StatGridSkeleton count={4} />;
  const issued = certificates.filter((c) => c.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* 4 Main KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Curriculum Modules" value={lessons.length || 5} icon={BookOpen} tone="primary" />
        <StatCard label="Verified ISL Signs" value={signs.length || 70} icon={Hand} tone="teal" />
        <StatCard label="Registered Staff" value={staff.length || 12} icon={Users} tone="success" />
        <StatCard label="Credentials Issued" value={issued} icon={Award} tone="gold" />
      </div>

      {/* Facility Telemetry & AI Model Status */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-border/70 shadow-soft bg-card/60">
          <CardContent className="p-5 flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Stethoscope className="size-6" />
            </span>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hospital Readiness</p>
              <p className="text-xl font-bold text-foreground mt-0.5">85% ISL-Ready</p>
              <p className="text-xs text-emerald-400 font-medium">4 of 5 Depts Covered</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-soft bg-card/60">
          <CardContent className="p-5 flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-400">
              <Cpu className="size-6" />
            </span>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Computer Vision</p>
              <p className="text-xl font-bold text-foreground mt-0.5">MediaPipe 21 3D</p>
              <p className="text-xs text-cyan-400 font-medium">Kinematic Precision Mode</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-soft bg-card/60">
          <CardContent className="p-5 flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-400">
              <Globe2 className="size-6" />
            </span>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Speech Translation</p>
              <p className="text-xl font-bold text-foreground mt-0.5">8 Indian Languages</p>
              <p className="text-xs text-amber-400 font-medium">Tamil &bull; Hindi &bull; English</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {analytics ? (
        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Staff Certification Trends</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Monthly staff certification progression across Bronze, Silver, and Gold healthcare tiers.
              </p>
            </div>
            <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
              <CheckCircle2 className="size-3 mr-1 text-emerald-400" /> Active Tracking
            </Badge>
          </CardHeader>
          <CardContent>
            <ChartContainer config={config} className="h-72 w-full aspect-auto">
              <BarChart data={analytics.certification_progress}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="bronze"
                  stackId="c"
                  fill="var(--color-bronze)"
                  radius={[0, 0, 4, 4]}
                />
                <Bar dataKey="silver" stackId="c" fill="var(--color-silver)" />
                <Bar dataKey="gold" stackId="c" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
