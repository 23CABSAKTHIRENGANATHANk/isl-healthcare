import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Repeat, Sparkles, Volume2, Lightbulb } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { SignCard } from "@/components/common/SignCard";
import { VideoPlayer } from "@/components/common/VideoPlayer";
import { Quiz } from "@/components/common/Quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
      return {
        meta: [{ title: "Lesson not found — ISL Setu" }, { name: "robots", content: "noindex" }],
      };
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
  const signs = useQuery({
    queryKey: ["lesson-signs", lesson.id],
    queryFn: () => listSignsForLesson(lesson.id),
  });
  const recommendedQuery = useQuery({
    queryKey: ["recommended-lessons"],
    queryFn: () => getRecommendedLessons(2),
  });

  const [step, setStep] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null);

  const items = signs.data ?? [];
  const current = items[step];
  const percent =
    items.length > 0 ? Math.min(100, Math.round(((step + 1) / items.length) * 100)) : 0;

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
    setShowQuiz(false);
    setQuizScore(null);
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

  const handleQuizComplete = (score: number, total: number) => {
    setQuizScore({ score, total });
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
        <Progress
          value={done ? 100 : percent}
          className="h-2"
          aria-label={`Lesson progress: ${done ? 100 : percent}%`}
        />
        <p className="mt-2 text-sm text-muted-foreground">
          {done ? "Completed 100%" : `Sign ${items.length === 0 ? 0 : step + 1} of ${items.length}`}{" "}
          · {lesson.duration_minutes} min lesson
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden rounded-2xl border-border/70 shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{current ? current.gloss : "Lesson complete"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {current && !done ? (
              <>
                {/* Video Player */}
                <div>
                  <VideoPlayer
                    src={current.video_url}
                    title={current.gloss}
                    controls={true}
                    captions={lesson.captions}
                  />
                </div>

                {/* Sign Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{current.gloss}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{current.meaning}</p>
                  </div>

                  {current.region_note && (
                    <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 border border-blue-200 dark:border-blue-800">
                      <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        <strong>Regional Note:</strong> {current.region_note}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sign Steps */}
                {current.steps && current.steps.length > 0 && (
                  <div className="rounded-xl bg-muted/40 p-4 border border-muted">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      How to perform this sign
                    </p>
                    <ol className="space-y-2">
                      {current.steps.map((step_text, idx) => (
                        <li key={idx} className="flex gap-3 text-sm">
                          <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                            {idx + 1}
                          </span>
                          <span className="text-foreground leading-relaxed pt-0.5">{step_text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button asChild variant="teal" className="gap-1.5 shadow-sm">
                    <Link to="/practice" search={{ sign: current.id } as never}>
                      <Sparkles className="h-4 w-4" />
                      Practice this sign
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={() => speak(current.gloss)} size="sm">
                    <Volume2 className="h-4 w-4" />
                    Hear the word
                  </Button>
                </div>

                {/* Quiz Section */}
                {lesson.quiz && lesson.quiz.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    {!showQuiz ? (
                      <Button
                        onClick={() => setShowQuiz(true)}
                        variant="outline"
                        className="w-full justify-center"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Test your understanding
                      </Button>
                    ) : (
                      <Quiz
                        questions={lesson.quiz}
                        title="Quick Check"
                        onComplete={handleQuizComplete}
                      />
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-3 pt-4 border-t">
                  <Button
                    variant="ghost"
                    disabled={step === 0}
                    onClick={() => {
                      setShowQuiz(false);
                      setStep((s) => Math.max(0, s - 1));
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous sign
                  </Button>
                  <Button
                    variant="hero"
                    onClick={handleStepForward}
                    disabled={saving || (showQuiz && !quizScore)}
                    className="flex-1"
                  >
                    {step + 1 >= items.length
                      ? saving
                        ? "Saving…"
                        : "Finish lesson"
                      : "Next sign"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <CheckCircle2 className="mx-auto h-16 w-16 text-success mb-4" aria-hidden="true" />
                <h2 className="text-3xl font-bold text-foreground">Lesson completed! 🎉</h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                  You've learned all {items.length} signs in this lesson. Your progress and daily
                  learning streak have been recorded.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {nextLesson ? (
                    <Button asChild variant="hero">
                      <Link to="/learn/$lesson" params={{ lesson: nextLesson.slug }}>
                        Next: {nextLesson.title}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null}
                  <Button asChild variant="teal">
                    <Link to="/practice">
                      <Sparkles className="h-4 w-4" />
                      Practice with AI
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/learn">Back to lessons</Link>
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
