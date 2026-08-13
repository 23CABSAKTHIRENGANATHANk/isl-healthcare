/**
 * Progress, activity and achievement service.
 */
import { achievements, activity, currentUser, lessonProgress, lessons, progressSummary } from "./mock/data";
import type { Achievement, ActivityItem, AppUser, Lesson, LessonProgress, UserProgressSummary } from "@/types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const latency = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getDemoUser(): Promise<AppUser> {
  await latency(80);
  return clone(currentUser);
}

export async function getProgressSummary(): Promise<UserProgressSummary> {
  await latency();
  return clone(progressSummary);
}

export async function listLessonProgress(): Promise<LessonProgress[]> {
  await latency();
  return clone(lessonProgress);
}

export function progressForLesson(lessonId: string): number {
  return lessonProgress.find((p) => p.lesson_id === lessonId)?.percent ?? 0;
}

export async function getContinueLesson(): Promise<{ lesson: Lesson; percent: number } | null> {
  await latency();
  const inFlight = [...lessonProgress]
    .filter((p) => !p.completed && p.percent > 0)
    .sort((a, b) => (a.last_opened_at < b.last_opened_at ? 1 : -1))[0];
  if (!inFlight) return null;
  const lesson = lessons.find((l) => l.id === inFlight.lesson_id);
  return lesson ? { lesson: clone(lesson), percent: inFlight.percent } : null;
}

export async function getRecommendedLessons(limit = 3): Promise<Lesson[]> {
  await latency();
  return clone(
    lessons
      .filter((lesson) => progressForLesson(lesson.id) < 100)
      .slice(0, limit),
  );
}

export async function listActivity(): Promise<ActivityItem[]> {
  await latency();
  return clone(activity);
}

export async function listAchievements(): Promise<Achievement[]> {
  await latency();
  return clone(achievements);
}
