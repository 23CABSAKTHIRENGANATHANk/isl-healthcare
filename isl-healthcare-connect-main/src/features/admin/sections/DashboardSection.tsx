import { Award, BookOpen, Hand, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { StatCard } from "@/components/common/StatCard";
import { StatGridSkeleton } from "@/components/common/LoadingStates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Lessons" value={lessons.length} icon={BookOpen} tone="primary" />
        <StatCard label="Total Signs" value={signs.length} icon={Hand} tone="teal" />
        <StatCard label="Registered Users" value={staff.length} icon={Users} tone="success" />
        <StatCard label="Certificates Issued" value={issued} icon={Award} tone="gold" />
      </div>
      {analytics ? (
        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle>Certification progress</CardTitle>
            <p className="text-sm text-muted-foreground">
              Monthly count of staff certified at each tier across the platform.
            </p>
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
