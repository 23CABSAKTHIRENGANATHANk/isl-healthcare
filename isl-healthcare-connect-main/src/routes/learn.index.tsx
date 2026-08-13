import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Flame, Target, TrendingUp, Trophy } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { LessonCard } from "@/components/common/LessonCard";
import { LessonGridSkeleton, StatGridSkeleton } from "@/components/common/LoadingStates";
import { PageHeader } from "@/components/common/PageHeader";
import { SignCard } from "@/components/common/SignCard";
import { StatCard } from "@/components/common/StatCard";
import { PageShell } from "@/components/layout/AppLayout";
import { Reveal } from "@/components/motion/Reveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listLessonsByCategory, listSigns } from "@/services/content.service";
import { getProgressSummary, progressForLesson } from "@/services/progress.service";

export const Route = createFileRoute("/learn/")({
  head: () => ({
    meta: [
      { title: "Learn Indian Sign Language for healthcare" },
      {
        name: "description",
        content:
          "Healthcare ISL lesson categories: basic communication, clinical vocabulary, hospital navigation and patient needs.",
      },
      { property: "og:title", content: "Learn Indian Sign Language for healthcare" },
      { property: "og:description", content: "Structured ISL lessons for hospital teams, with captions and quizzes." },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  const grouped = useQuery({ queryKey: ["lessons-by-category"], queryFn: listLessonsByCategory });
  const summary = useQuery({ queryKey: ["progress-summary"], queryFn: getProgressSummary });
  const signs = useQuery({ queryKey: ["signs"], queryFn: listSigns });

  return (
    <PageShell>
      <PageHeader
        eyebrow="Learning"
        title="Learn Indian Sign Language"
        description="Four healthcare-first categories, each with short lessons, sign breakdowns, captions and a quick quiz."
      />

      <section aria-labelledby="learn-summary" className="mt-8">
        <h2 id="learn-summary" className="sr-only">
          Your learning summary
        </h2>
        {summary.isLoading || !summary.data ? (
          <StatGridSkeleton />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Overall Progress"
              value={summary.data.overall_percent}
              suffix="%"
              icon={TrendingUp}
              progress={summary.data.overall_percent}
            />
            <StatCard label="Current Level" value="Bronze" icon={Trophy} tone="gold" animate={false} helper="ISL Setu platform tier" />
            <StatCard
              label="Daily Goal"
              value={summary.data.daily_goal_done_minutes}
              suffix={` / ${summary.data.daily_goal_minutes} min`}
              icon={Target}
              tone="teal"
              progress={Math.round((summary.data.daily_goal_done_minutes / summary.data.daily_goal_minutes) * 100)}
            />
            <StatCard label="Learning Streak" value={summary.data.streak_days} suffix=" days" icon={Flame} tone="success" />
          </div>
        )}
      </section>

      <section aria-labelledby="categories-heading" className="mt-12">
        <h2 id="categories-heading" className="text-2xl font-bold text-foreground">
          Lesson categories
        </h2>
        {grouped.isLoading || !grouped.data ? (
          <div className="mt-6">
            <LessonGridSkeleton count={3} />
          </div>
        ) : grouped.data.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={BookOpen}
            title="No lessons available yet"
            description="Lessons will appear here as soon as content is published for your sector."
          />
        ) : (
          <div className="mt-6 space-y-12">
            {grouped.data.map((group) => (
              <Reveal key={group.category.id} as="section">
                <div className="mb-5">
                  <h3 className="text-xl font-semibold text-foreground">{group.category.name}</h3>
                  <p className="text-sm text-muted-foreground">{group.category.description}</p>
                </div>
                {group.lessons.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="Lessons coming to this category"
                    description="Signs for this category are published, with guided lessons on the way."
                  />
                ) : (
                  <div className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
                    {group.lessons.map((lesson) => (
                      <div key={lesson.id} className="min-w-[78vw] snap-start sm:min-w-0">
                        <LessonCard lesson={lesson} percent={progressForLesson(lesson.id)} />
                      </div>
                    ))}
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="sign-library" className="mt-14">
        <h2 id="sign-library" className="text-2xl font-bold text-foreground">
          Sign library
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Every sign lists its regional variation note — ISL varies across India and no single form is presented as
          universal.
        </p>
        <Tabs defaultValue="basic" className="mt-6">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            {(grouped.data ?? []).map((group) => (
              <TabsTrigger key={group.category.id} value={group.category.id} className="min-h-11">
                {group.category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {(grouped.data ?? []).map((group) => (
            <TabsContent key={group.category.id} value={group.category.id} className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(signs.data ?? [])
                  .filter((sign) => sign.category_id === group.category.id)
                  .map((sign) => (
                    <SignCard key={sign.id} sign={sign} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </PageShell>
  );
}
