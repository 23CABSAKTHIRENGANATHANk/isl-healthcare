import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Award,
  BookOpen,
  Flame,
  Gauge,
  PlayCircle,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

// Dynamic import of recharts — defers loading the chart chunk until
// the dashboard is first visited, keeping initial JS bundle smaller.
const DashboardAreaChart = lazy(() =>
  import("@/components/charts/DashboardAreaChart").then((m) => ({ default: m.DashboardAreaChart })),
);

import { PageShell } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/common/EmptyState";
import { LessonCard } from "@/components/common/LessonCard";
import { LessonGridSkeleton, StatGridSkeleton } from "@/components/common/LoadingStates";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { listCertificates } from "@/services/assessment.service";
import {
  getContinueLesson,
  getProgressSummary,
  getRecommendedLessons,
  listAchievements,
  listActivity,
  listLessonProgress,
} from "@/services/progress.service";

import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My ISL dashboard — ISL Setu" },
      {
        name: "description",
        content:
          "Track your ISL learning progress, streak, practice accuracy, achievements and certification progress.",
      },
      { property: "og:title", content: "My ISL dashboard — ISL Setu" },
      {
        property: "og:description",
        content: "Your ISL learning progress, streak and certification path.",
      },
    ],
  }),
  component: DashboardPageWrapper,
});

function DashboardPageWrapper() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function DashboardPage() {
  const { displayName } = useAuth();
  const summary = useQuery({ queryKey: ["progress-summary"], queryFn: () => getProgressSummary() });
  const continueLesson = useQuery({
    queryKey: ["continue-lesson"],
    queryFn: () => getContinueLesson(),
  });
  const recommended = useQuery({
    queryKey: ["recommended"],
    queryFn: () => getRecommendedLessons(3),
  });
  const activity = useQuery({ queryKey: ["activity"], queryFn: () => listActivity() });
  const achievements = useQuery({ queryKey: ["achievements"], queryFn: () => listAchievements() });
  const certificates = useQuery({ queryKey: ["certificates"], queryFn: () => listCertificates() });
  const progressList = useQuery({
    queryKey: ["lesson-progress"],
    queryFn: () => listLessonProgress(),
  });

  return (
    <PageShell>
      <PageHeader
        eyebrow="Your dashboard"
        title={`${greeting()}, ${displayName} 👋`}
        description="Ready to continue your ISL journey?"
        actions={
          <Button asChild variant="hero">
            <Link to="/practice">
              <Sparkles aria-hidden="true" />
              Practise a sign
            </Link>
          </Button>
        }
      />

      <section aria-labelledby="summary-heading" className="mt-8">
        <h2 id="summary-heading" className="sr-only">
          Progress summary
        </h2>
        {summary.isLoading || !summary.data ? (
          <StatGridSkeleton />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Learning Progress"
              value={summary.data.overall_percent}
              suffix="%"
              icon={TrendingUp}
              progress={summary.data.overall_percent}
              helper={`${summary.data.signs_learned} signs learned so far`}
            />
            <StatCard
              label="Current Level"
              value={
                summary.data.level === "bronze"
                  ? "Bronze"
                  : summary.data.level === "silver"
                    ? "Silver"
                    : "Gold"
              }
              icon={Award}
              tone="gold"
              animate={false}
              helper="ISL Setu platform credential tier"
            />
            <StatCard
              label="Daily Streak"
              value={summary.data.streak_days}
              suffix=" days"
              icon={Flame}
              tone="teal"
              helper={`Daily goal: ${summary.data.daily_goal_done_minutes}/${summary.data.daily_goal_minutes} min`}
            />
            <StatCard
              label="Accuracy"
              value={summary.data.accuracy_percent}
              suffix="%"
              icon={Gauge}
              tone="success"
              progress={summary.data.accuracy_percent}
              helper="Across simulated Demo Mode practice"
            />
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Reveal>
            <Card className="overflow-hidden rounded-2xl border-border/70 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Continue Learning</CardTitle>
              </CardHeader>
              <CardContent>
                {continueLesson.isLoading ? (
                  <Progress value={0} className="h-2" />
                ) : continueLesson.data ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground">
                      <BookOpen className="size-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {continueLesson.data.lesson.code}
                      </p>
                      <h3 className="truncate text-lg font-semibold text-foreground">
                        {continueLesson.data.lesson.title}
                      </h3>
                      <Progress
                        value={continueLesson.data.percent}
                        className="mt-2 h-2"
                        aria-label={`${continueLesson.data.lesson.title} progress: ${continueLesson.data.percent}%`}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {continueLesson.data.percent}% complete
                      </p>
                    </div>
                    <Button asChild variant="hero">
                      <Link
                        to="/learn/$lesson"
                        params={{ lesson: continueLesson.data.lesson.slug }}
                      >
                        <PlayCircle aria-hidden="true" />
                        Resume
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <EmptyState
                    icon={BookOpen}
                    title="No lesson in progress"
                    description="Pick a category and start your first healthcare ISL lesson."
                    action={
                      <Button asChild variant="hero">
                        <Link to="/learn">Browse lessons</Link>
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          </Reveal>

          <Reveal>
            <Card className="rounded-2xl border-border/70 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Weekly progress</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.data ? (
                  <>
                    <div className="h-64 w-full">
                      <Suspense
                        fallback={<div className="h-64 animate-pulse rounded-xl bg-muted/50" />}
                      >
                        <DashboardAreaChart data={summary.data.weekly} />
                      </Suspense>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      You practised on {summary.data.weekly.filter((d) => d.minutes > 0).length} of
                      7 days this week, for{" "}
                      {summary.data.weekly.reduce((total, d) => total + d.minutes, 0)} minutes in
                      total.
                    </p>
                  </>
                ) : (
                  <Progress value={0} className="h-2" />
                )}
              </CardContent>
            </Card>
          </Reveal>

          <Reveal>
            <Card className="rounded-2xl border-border/70 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Recommended lessons</CardTitle>
              </CardHeader>
              <CardContent>
                {recommended.isLoading || !recommended.data ? (
                  <LessonGridSkeleton count={3} />
                ) : recommended.data.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="All caught up"
                    description="You have completed every available lesson."
                  />
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {recommended.data.map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        percent={
                          progressList.data?.find((p) => p.lesson_id === lesson.id)?.percent ?? 0
                        }
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.data && activity.data.length > 0 ? (
                <ul className="space-y-4">
                  {activity.data.map((item) => (
                    <li key={item.id} className="flex gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Activity className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                        <p className="text-xs text-muted-foreground">
                          {(() => {
                            const d = new Date(item.at);
                            return isNaN(d.getTime())
                              ? item.at
                              : d.toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                });
                          })()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Activity}
                  title="No activity yet"
                  description="Your lessons and practice sessions will appear here."
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-3 gap-3">
                {(achievements.data ?? []).map((badge) => (
                  <li key={badge.id} className="text-center">
                    <span
                      className={
                        badge.earned
                          ? "mx-auto grid size-12 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground"
                          : "mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground"
                      }
                    >
                      <Target className="size-5" aria-hidden="true" />
                    </span>
                    <p className="mt-1.5 text-xs font-medium text-foreground">{badge.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {badge.earned ? "Earned" : "Locked"}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Certification progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(certificates.data ?? []).map((certificate) => (
                <div key={certificate.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{certificate.title}</p>
                    <StatusBadge status={certificate.status} />
                  </div>
                  <Progress
                    value={Math.round(
                      (certificate.signs_completed / certificate.signs_required) * 100,
                    )}
                    className="h-2"
                    aria-label={`${certificate.title}: ${certificate.signs_completed} of ${certificate.signs_required} signs`}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {certificate.signs_completed} / {certificate.signs_required} signs
                  </p>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link to="/certification">View certifications</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
