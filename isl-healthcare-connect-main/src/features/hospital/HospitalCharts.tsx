import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { HospitalAnalytics } from "@/types";

const certConfig = {
  bronze: { label: "Bronze", color: "var(--color-chart-1)" },
  silver: { label: "Silver", color: "var(--color-chart-2)" },
  gold: { label: "Gold", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

const coverageConfig = {
  covered: { label: "Staff certified", color: "var(--color-chart-4)" },
} satisfies ChartConfig;

const trainingConfig = {
  hours: { label: "Training hours", color: "var(--color-chart-5)" },
} satisfies ChartConfig;

export function HospitalCharts({ analytics }: { analytics: HospitalAnalytics }) {
  const latest = analytics.certification_progress[analytics.certification_progress.length - 1];
  const totalHours = analytics.monthly_training.reduce((sum, m) => sum + m.hours, 0);
  const topDept = [...analytics.department_coverage].sort((a, b) => b.covered - a.covered)[0];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="rounded-2xl border-border/70 shadow-soft lg:col-span-2">
        <CardHeader>
          <CardTitle>Certification progress over time</CardTitle>
          <p className="text-sm text-muted-foreground">
            Bronze, Silver and Gold certified staff counted by month.
            {latest
              ? ` As of ${latest.month}: ${latest.bronze} bronze, ${latest.silver} silver, ${latest.gold} gold.`
              : ""}
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={certConfig} className="h-72 w-full aspect-auto">
            <BarChart data={analytics.certification_progress}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="bronze" stackId="cert" fill="var(--color-bronze)" radius={[0, 0, 4, 4]} />
              <Bar dataKey="silver" stackId="cert" fill="var(--color-silver)" />
              <Bar dataKey="gold" stackId="cert" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70 shadow-soft">
        <CardHeader>
          <CardTitle>Department coverage</CardTitle>
          <p className="text-sm text-muted-foreground">
            Certified staff per department.
            {topDept ? ` ${topDept.department} leads with ${topDept.covered} certified staff.` : ""}
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={coverageConfig} className="h-72 w-full aspect-auto">
            <BarChart data={analytics.department_coverage} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="department"
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="covered" fill="var(--color-covered)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70 shadow-soft">
        <CardHeader>
          <CardTitle>Monthly training hours</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total training hours logged by staff each month. {totalHours} hours logged in total.
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trainingConfig} className="h-72 w-full aspect-auto">
            <LineChart data={analytics.monthly_training}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="var(--color-hours)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
