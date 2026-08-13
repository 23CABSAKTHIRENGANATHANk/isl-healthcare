import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Repeat, Sparkles, Volume2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { SignCard } from "@/components/common/SignCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLessonBySlug, listSignsForLesson } from "@/services/content.service";
import { getRecommendedLessons, updateLessonProgress } from "@/services/progress.service";
import { speak } from "@/services/ai.service";

export const Route = createFileRoute("/learn/$lesson")({
  loader: async ({ params }) => {
    const lesson = await getLessonBySlug(params.lesson);
    if (!lesson) throw notFound();
    return { lesson };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Lesson not found — ISL Setu" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.lesson.title} — ISL lesson`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.lesson.summary },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.lesson.summary },
      ],
    };
  },
  component: LessonPlayerWrapper,
});

function LessonPlayerWrapper() {
  return (
    <ProtectedRoute>
      <LessonPlayer />
    </ProtectedRoute>
  );
}

function LessonPlayer() {
  const { lesson } = Route.useLoaderData();
  const signs = useQuery({ queryKey: ["lesson-signs", lesson.id], queryFn: () => listSignsForLesson(lesson.id) });
  const recommendedQuery = useQuery({ queryKey: ["recommended-lessons"], queryFn: () => getRecommendedLessons(2) });

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const items = signs.data ?? [];
  const current = items[step];
  const percent = items.length > 0 ? Math.min(100, Math.round(((step + 1) / items.length) * 100)) : 0;

  const handleFinishLesson = async () => {
    setSaving(true);
    setDone(true);
    setStep(items.length);

    const res = await updateLessonProgress({
      lessonId: lesson.id,
      percent: 100,
      completed: true,
    });

    setSaving(false);
    if (!res.error) {
      toast.success("Lesson completed! 🎉", {
        description: "Your progress and learning streak have been recorded.",
      });
    }
  };

  const handleStepForward = () => {
    if (step + 1 >= items.length) {
      void handleFinishLesson();
    } else {
      const nextStep = step + 1;
      setStep(nextStep);
      const intermediatePercent = Math.round(((nextStep + 1) / items.length) * 100);
      void updateLessonProgress({
        lessonId: lesson.id,
        percent: intermediatePercent,
        completed: false,
        lastPosition: nextStep,
      });
    }
  };

  const nextLesson = (recommendedQuery.data ?? []).find((l) => l.id !== lesson.id);

  return (
    <PageShell>
      <Button asChild variant="ghost" className="mb-2 -ml-2">
        <Link to="/learn">
          <ArrowLeft aria-hidden="true" />
          Back to lessons
        </Link>
      </Button>

      <PageHeader eyebrow={lesson.code} title={lesson.title} description={lesson.summary} />

      <div className="mt-6">
        <Progress value={done ? 100 : percent} className="h-2" aria-label={`Lesson progress: ${done ? 100 : percent}%`} />
        <p className="mt-2 text-sm text-muted-foreground">
          {done ? "Completed 100%" : `Sign ${items.length === 0 ? 0 : step + 1} of ${items.length}`} · {lesson.duration_minutes} min lesson
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden rounded-2xl border-border/70 shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{current ? current.gloss : "Lesson complete"}</CardTitle>
          </CardHeader>
          <CardContent>
            {current && !done ? (
              <>
                <div className="grid aspect-video w-full place-items-center rounded-2xl bg-gradient-brand text-center text-primary-foreground">
                  <div className="px-6">
                    <p className="text-3xl font-bold sm:text-5xl">{current.gloss}</p>
                    <p className="mt-2 text-sm opacity-90">Demo Mode: illustrative sign playback</p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-foreground">{current.meaning}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Regional note: {current.region_note}
                </p>

                {current.steps && current.steps.length > 0 ? (
                  <div className="mt-4 rounded-xl bg-muted/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Sign Steps</p>
                    <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-foreground">
                      {current.steps.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => speak(current.gloss)}>
                    <Volume2 aria-hidden="true" />
                    Hear the word
                  </Button>
                  <Button variant="outline" onClick={() => setStep(step)}>
                    <Repeat aria-hidden="true" />
                    Replay
                  </Button>
                </div>
                <div className="mt-6 flex justify-between gap-3">
                  <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                    <ArrowLeft aria-hidden="true" />
                    Previous
                  </Button>
                  <Button variant="hero" onClick={handleStepForward} disabled={saving}>
                    {step + 1 >= items.length ? (saving ? "Saving…" : "Finish lesson") : "Next sign"}
                    <ArrowRight aria-hidden="true" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-6 text-center">
                <CheckCircle2 className="mx-auto size-14 text-success" aria-hidden="true" />
                <h2 className="mt-3 text-2xl font-bold text-foreground">
                  Lesson completed! 🎉
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  You've mastered all signs in this lesson. Your progress and daily learning streak have been recorded.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {nextLesson ? (
                    <Button asChild variant="hero">
                      <Link to={`/learn/${nextLesson.slug}`}>
                        Next lesson: {nextLesson.title}
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : null}
                  <Button asChild variant="teal">
                    <Link to="/practice">
                      <Sparkles aria-hidden="true" />
                      Practise with AI
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/learn">Back to all lessons</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Signs in this lesson</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((sign, index) => (
              <button
                key={sign.id}
                type="button"
                onClick={() => {
                  setDone(false);
                  setStep(index);
                }}
                className={
                  index === step && !done
                    ? "min-h-11 w-full rounded-xl border border-primary bg-primary/10 px-4 py-2 text-left text-sm font-semibold text-primary"
                    : "min-h-11 w-full rounded-xl border border-border px-4 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent"
                }
              >
                {index + 1}. {sign.gloss}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="sign-refs" className="mt-12">
        <h2 id="sign-refs" className="text-xl font-semibold text-foreground">
          Sign reference cards
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((sign) => (
            <SignCard key={sign.id} sign={sign} />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
