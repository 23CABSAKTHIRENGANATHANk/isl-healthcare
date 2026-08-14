import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Award, CheckCircle2, Clock, ListChecks, Repeat, Timer, XCircle } from "lucide-react";

import { CameraTaskQuestion } from "@/features/assessment/CameraTaskQuestion";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { signByGloss } from "@/services/content.service";
import { submitAssessment, scoreAssessment } from "@/services/assessment.service";
import type { Assessment, AssessmentResult } from "@/types";

const GLOSS_PATTERN = /\b([A-Z]{3,})\b/;

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

interface AssessmentRunnerProps {
  assessment: Assessment;
}

export function AssessmentRunner({ assessment }: AssessmentRunnerProps) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const totalSeconds = assessment.duration_minutes * 60;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const question = assessment.questions[index];
  const total = assessment.questions.length;

  const handleSubmit = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setIsSubmitting(true);
    const res = await submitAssessment({ assessment, answers });
    setResult(res);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (result) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [result]);

  useEffect(() => {
    if (secondsLeft === 0 && !result && !submittedRef.current) {
      void handleSubmit();
    }
  }, [secondsLeft, handleSubmit, result]);

  const gloss = useMemo(() => {
    if (!question) return null;
    if (question.kind === "camera_task") return question.target_sign ?? null;
    if (question.kind === "identify") {
      const match = question.prompt.match(GLOSS_PATTERN);
      return match ? match[1] : null;
    }
    return null;
  }, [question]);

  const { data: contextSign } = useQuery({
    queryKey: ["sign-by-gloss", gloss],
    queryFn: () => (gloss ? signByGloss(gloss) : null),
    enabled: Boolean(gloss),
  });

  if (result) {
    const passed = result.passed;
    return (
      <motion.div
        {...(reduceMotion ? {} : { initial: { opacity: 0, y: 16 } })}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-8"
      >
        <div className="rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Assessment Results
              </p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">{assessment.title}</h2>
            </div>
            <StatusBadge
              status={passed ? "completed" : "failed"}
              label={passed ? "Passed" : "Not Passed"}
            />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Score"
              value={result.score}
              suffix={`/${result.total}`}
              icon={ListChecks}
              tone="primary"
            />
            <StatCard
              label="Accuracy"
              value={result.accuracy_percent}
              suffix="%"
              icon={Award}
              tone="teal"
            />
            <StatCard
              label="Correct Answers"
              value={result.score}
              icon={CheckCircle2}
              tone={passed ? "success" : "muted"}
              helper={`Pass mark: ${assessment.pass_percent}%`}
            />
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-foreground">Question review</h3>
            <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
              {assessment.questions.map((q, i) => {
                const given = answers[q.id];
                const correct = given === q.answer;
                return (
                  <li key={q.id} className="flex items-start gap-3 p-4">
                    <span className="mt-0.5">
                      {correct ? (
                        <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
                      ) : (
                        <XCircle className="size-5 text-destructive" aria-hidden="true" />
                      )}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {i + 1}. {q.prompt}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Your answer:{" "}
                        <span className="font-medium text-foreground">{given || "No answer"}</span>
                        {!correct ? (
                          <>
                            {" "}
                            · Correct answer:{" "}
                            <span className="font-medium text-foreground">{q.answer}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              variant="hero"
              size="lg"
              onClick={() => void navigate({ to: "/certification" })}
            >
              <Award aria-hidden="true" />
              View Certification
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                submittedRef.current = false;
                setResult(null);
                setAnswers({});
                setIndex(0);
                setSecondsLeft(totalSeconds);
              }}
            >
              <Repeat aria-hidden="true" />
              Retake Assessment
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!question) return null;

  const progressPercent = Math.round(((index + 1) / total) * 100);
  const timeCritical = secondsLeft <= 60;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              className="rounded-full bg-bronze/20 px-3 py-1 font-semibold text-bronze"
              variant="outline"
            >
              Bronze Level
            </Badge>
            <span className="text-sm text-muted-foreground">{total} Questions</span>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">
              {assessment.duration_minutes} minutes
            </span>
          </div>
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
              timeCritical ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
            }`}
            role="timer"
            aria-live="polite"
          >
            <Timer className="size-4" aria-hidden="true" />
            {formatTime(secondsLeft)}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm font-medium text-foreground">
          <span aria-live="polite">
            Question {index + 1} / {total}
          </span>
          <span className="text-muted-foreground">{progressPercent}% complete</span>
        </div>
        <Progress
          value={progressPercent}
          className="mt-2 h-2"
          aria-label={`Progress: ${progressPercent}%`}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {question.kind === "identify"
            ? "Identify the sign"
            : question.kind === "match"
              ? "Match sign to meaning"
              : question.kind === "camera_task"
                ? "Show the sign"
                : "Multiple choice"}
        </p>
        <h2 className="mt-2 text-xl font-bold text-foreground sm:text-2xl">{question.prompt}</h2>

        {contextSign && question.kind !== "camera_task" ? (
          <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4">
            <p className="text-sm font-semibold text-foreground">
              Sign context: {contextSign.gloss}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{contextSign.region_note}</p>
            {contextSign.steps && contextSign.steps.length > 0 ? (
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                {contextSign.steps.map((step: string, i: number) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6">
          {question.kind === "camera_task" ? (
            <CameraTaskQuestion
              targetSign={question.target_sign ?? question.answer}
              value={answers[question.id] ?? ""}
              onAnswer={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
            />
          ) : (
            <RadioGroup
              value={answers[question.id] ?? ""}
              onValueChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
              aria-label={question.prompt}
              className="gap-3"
            >
              {question.options.map((option) => {
                const optionId = `${question.id}-${option}`;
                return (
                  <div
                    key={option}
                    className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <RadioGroupItem value={option} id={optionId} className="size-5" />
                    <Label
                      htmlFor={optionId}
                      className="min-h-11 flex-1 cursor-pointer py-1 text-base font-medium"
                    >
                      {option}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          Previous
        </Button>
        {index === total - 1 ? (
          <Button
            variant="hero"
            size="lg"
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            <CheckCircle2 aria-hidden="true" />
            {isSubmitting ? "Calculating Results…" : "Submit Assessment"}
          </Button>
        ) : (
          <Button
            variant="default"
            size="lg"
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
          >
            Next
          </Button>
        )}
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="size-3.5" aria-hidden="true" />
        The assessment auto-submits when the timer reaches zero.
      </p>
    </div>
  );
}
