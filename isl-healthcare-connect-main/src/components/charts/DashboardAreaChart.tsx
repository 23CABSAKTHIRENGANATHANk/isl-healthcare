/**
 * Lazy-loaded recharts wrapper for the dashboard weekly activity area chart.
 * Importing this file triggers a dynamic import of the `recharts` chunk only
 * when the component is first rendered — reducing the initial JS parse cost.
 */

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WeekDataPoint {
  day: string;
  minutes: number;
  accuracy: number;
}

interface DashboardAreaChartProps {
  data: WeekDataPoint[];
}

export function DashboardAreaChart({ data }: DashboardAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <ChartTooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="minutes"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#areaGrad)"
          name="Minutes"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
