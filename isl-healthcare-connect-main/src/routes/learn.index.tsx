import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  Filter,
  Flame,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Video,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { LessonCard } from "@/components/common/LessonCard";
import { LessonGridSkeleton, StatGridSkeleton } from "@/components/common/LoadingStates";
import { PageHeader } from "@/components/common/PageHeader";
import { SignCard } from "@/components/common/SignCard";
import { StatCard } from "@/components/common/StatCard";
import { PageShell } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Reveal } from "@/components/motion/Reveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listLessonsByCategory, listSigns } from "@/services/content.service";
import { getProgressSummary, listLessonProgress } from "@/services/progress.service";

export const Route = createFileRoute("/learn/")({
  head: () => ({
    meta: [
      { title: "Learn Indian Sign Language for Healthcare — ISL Setu" },
      {
        name: "description",
        content:
          "Healthcare ISL curriculum: clinical triage, emergency signs, intake communication, pediatric reassurance, and dietary nutrition with HD video demonstrations.",
      },
      { property: "og:title", content: "Learn Indian Sign Language for Healthcare — ISL Setu" },
      {
        property: "og:description",
        content: "Structured ISL lessons for healthcare teams with video demonstrations, step breakdowns and quizzes.",
      },
    ],
  }),
  component: LearnPageWrapper,
});

function LearnPageWrapper() {
  return (
    <ProtectedRoute>
      <LearnPage />
    </ProtectedRoute>
  );
}

function LearnPage() {
  const grouped = useQuery({ queryKey: ["lessons-by-category"], queryFn: listLessonsByCategory });
  const summary = useQuery({ queryKey: ["progress-summary"], queryFn: () => getProgressSummary() });
  const progressQuery = useQuery({
    queryKey: ["all-lesson-progress"],
    queryFn: () => listLessonProgress(),
  });
  const signs = useQuery({ queryKey: ["signs"], queryFn: listSigns });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [videoOnly, setVideoOnly] = useState(false);

  const progressMap = new Map((progressQuery.data ?? []).map((p) => [p.lesson_id, p.percent]));

  // Filtered signs based on search query, difficulty and video flag
  const allSigns = signs.data ?? [];
  const filteredSigns = useMemo(() => {
    return allSigns.filter((sign) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        sign.gloss.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sign.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sign.region_note.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDifficulty =
        selectedDifficulty === "all" || sign.difficulty === selectedDifficulty;

      const matchesVideo = !videoOnly || Boolean(sign.video_url);

      return matchesSearch && matchesDifficulty && matchesVideo;
    });
  }, [allSigns, searchQuery, selectedDifficulty, videoOnly]);

  const defaultCategory = grouped.data?.[0]?.category.id ?? "clinical";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Clinical Curriculum"
        title="Learn Indian Sign Language"
        description="Comprehensive healthcare-focused curriculum with HD video demonstrations, step-by-step gesture breakdowns, and interactive quizzes."
      />

      {/* Summary Stats */}
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
            <StatCard
              label="Current Level"
              value={summary.data.level.toUpperCase()}
              icon={Trophy}
              tone="gold"
              animate={false}
              helper="ISL Setu platform tier"
            />
            <StatCard
              label="Daily Goal"
              value={summary.data.daily_goal_done_minutes}
              suffix={` / ${summary.data.daily_goal_minutes} min`}
              icon={Target}
              tone="teal"
              progress={Math.round(
                (summary.data.daily_goal_done_minutes / summary.data.daily_goal_minutes) * 100,
              )}
            />
            <StatCard
              label="Learning Streak"
              value={summary.data.streak_days}
              suffix=" days"
              icon={Flame}
              tone="success"
            />
          </div>
        )}
      </section>

      {/* Lesson Modules Section */}
      <section aria-labelledby="categories-heading" className="mt-14">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="categories-heading" className="font-display text-2xl font-bold text-foreground">
              Core Healthcare Lessons
            </h2>
            <p className="text-sm text-muted-foreground">
              Interactive clinical modules covering emergency triage, intake, dietary care, and pediatric engagement.
            </p>
          </div>
          <Badge variant="outline" className="w-fit gap-1.5 px-3 py-1 font-semibold text-primary">
            <Sparkles className="size-3.5" />
            {allSigns.length} Verified Medical Signs
          </Badge>
        </div>

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
                <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {group.category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{group.category.description}</p>
                  </div>
                  <span className="text-xs font-semibold text-teal">
                    {group.lessons.length} {group.lessons.length === 1 ? "Module" : "Modules"}
                  </span>
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
                        <LessonCard lesson={lesson} percent={progressMap.get(lesson.id) ?? 0} />
                      </div>
                    ))}
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Comprehensive Sign Library with Search & Video Filters */}
      <section aria-labelledby="sign-library" className="mt-16 rounded-3xl border border-border/70 bg-card/40 p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="sign-library" className="font-display text-2xl font-bold text-foreground">
              Interactive Sign Dictionary & Video Demonstrations
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Watch real ISL video demonstrations, inspect step cues, and launch instant camera practice.
            </p>
          </div>

          {/* Video Demonstration Counter */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-teal/10 px-3 py-1.5 text-xs font-bold text-teal">
              <Video className="size-4" />
              61 HD Videos Available
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search sign by name, clinical meaning or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-xl pl-10 pr-9 text-sm"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={videoOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setVideoOnly(!videoOnly)}
              className="h-11 gap-1.5 rounded-xl text-xs font-semibold"
            >
              <Video className="size-3.5" />
              {videoOnly ? "Showing Videos Only" : "Video Demos"}
            </Button>

            <div className="flex items-center gap-1 rounded-xl border border-input bg-background p-1 text-xs">
              <Filter className="ml-2 size-3.5 text-muted-foreground" />
              {(["all", "beginner", "intermediate", "advanced"] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`rounded-lg px-2.5 py-1.5 font-semibold capitalize transition-colors ${
                    selectedDifficulty === diff
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categorized Tabs or Search Results */}
        {searchQuery.trim() !== "" || videoOnly || selectedDifficulty !== "all" ? (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Found {filteredSigns.length} {filteredSigns.length === 1 ? "sign" : "signs"} matching filters
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDifficulty("all");
                  setVideoOnly(false);
                }}
                className="text-xs text-muted-foreground"
              >
                Reset filters
              </Button>
            </div>

            {filteredSigns.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No signs found"
                description="Try adjusting your search terms or clearing difficulty filters."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filteredSigns.map((sign) => (
                  <SignCard key={sign.id} sign={sign} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue={defaultCategory} className="mt-8">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
              {(grouped.data ?? []).map((group) => {
                const count = allSigns.filter((s) => s.category_id === group.category.id).length;
                return (
                  <TabsTrigger
                    key={group.category.id}
                    value={group.category.id}
                    className="min-h-11 rounded-xl border border-border/70 bg-card px-4 py-2 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {group.category.name}
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground group-data-[state=active]:bg-primary-foreground/20 group-data-[state=active]:text-primary-foreground">
                      {count}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {(grouped.data ?? []).map((group) => {
              const categorySigns = allSigns.filter((sign) => sign.category_id === group.category.id);
              return (
                <TabsContent key={group.category.id} value={group.category.id} className="mt-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {categorySigns.map((sign) => (
                      <SignCard key={sign.id} sign={sign} />
                    ))}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </section>
    </PageShell>
  );
}
