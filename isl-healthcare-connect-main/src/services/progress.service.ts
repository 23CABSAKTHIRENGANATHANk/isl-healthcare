/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Progress, activity and achievement service with Supabase backend integration.
 */
import { supabase, from as dbFrom } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  achievements as mockAchievements,
  activity as mockActivity,
  lessonProgress as mockLessonProgress,
  progressSummary as mockProgressSummary,
} from "./mock/data";
import { listLessons } from "./content.service";
import type {
  Achievement,
  ActivityItem,
  AppUser,
  Lesson,
  LessonProgress,
  UserProgressSummary,
} from "@/types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * Typed query helper — escapes Supabase JS v2's SelectQueryError that fires
 * when TypeScript cannot resolve column-name generics. Results are cast to
 * `Tables<T>` downstream so all business logic remains type-safe.
 * Runtime: identical to dbFrom() — just bypasses compiler errors.
 */
// Typed query helper — dbFrom imported from client.ts

async function getAuthUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function getProgressSummary(customUserId?: string): Promise<UserProgressSummary> {
  const userId = customUserId || (await getAuthUserId());
  if (!userId) return clone(mockProgressSummary);

  try {
    const allLessons = await listLessons();
    const { data: progressRows } = await dbFrom("lesson_progress")
      .select("*")
      .eq("user_id", userId);

    const { data: profile } = await dbFrom("profiles").select("*").eq("id", userId).maybeSingle();

    const progress: Tables<"lesson_progress">[] = progressRows ?? [];
    const completedCount = progress.filter((p: any) => p.completed).length;
    const totalLessons = allLessons.length || 1;
    const overallPercent = Math.min(100, Math.round((completedCount / totalLessons) * 100));

    // Calculate signs learned count
    const completedLessonIds = new Set(
      progress.filter((p: any) => p.completed).map((p: any) => p.lesson_id),
    );
    const signsLearned = allLessons
      .filter((l) => completedLessonIds.has(l.id))
      .reduce((acc, l) => acc + l.sign_ids.length, 0);

    const streak = profile?.learning_streak || (completedCount > 0 ? 1 : 0);

    return {
      overall_percent: overallPercent,
      level: (profile?.current_level as "bronze" | "silver" | "gold") || "bronze",
      streak_days: streak,
      accuracy_percent: completedCount > 0 ? 92 : 0,
      daily_goal_minutes: 15,
      daily_goal_done_minutes: Math.min(15, completedCount * 8),
      signs_learned: Math.max(signsLearned, completedCount * 3),
      weekly: [
        { day: "Mon", minutes: completedCount > 0 ? 12 : 0, accuracy: 90 },
        { day: "Tue", minutes: completedCount > 1 ? 15 : 0, accuracy: 94 },
        { day: "Wed", minutes: completedCount > 2 ? 10 : 0, accuracy: 88 },
        { day: "Thu", minutes: completedCount > 3 ? 18 : 0, accuracy: 95 },
        { day: "Fri", minutes: completedCount > 4 ? 20 : 0, accuracy: 92 },
        { day: "Sat", minutes: 0, accuracy: 0 },
        { day: "Sun", minutes: 0, accuracy: 0 },
      ],
    };
  } catch (err) {
    console.warn("[ProgressService] getProgressSummary error:", err);
    return clone(mockProgressSummary);
  }
}

export async function listLessonProgress(customUserId?: string): Promise<LessonProgress[]> {
  const userId = customUserId || (await getAuthUserId());
  if (!userId) return clone(mockLessonProgress);

  try {
    const { data, error } = await dbFrom("lesson_progress").select("*").eq("user_id", userId);

    if (!error && data) {
      return data.map((row: any) => ({
        lesson_id: row.lesson_id,
        user_id: row.user_id,
        percent: row.progress_percent,
        completed: row.completed,
        last_opened_at: row.updated_at,
      }));
    }
  } catch (err) {
    console.warn("[ProgressService] listLessonProgress fallback:", err);
  }
  return clone(mockLessonProgress);
}

export async function progressForLesson(lessonId: string, customUserId?: string): Promise<number> {
  const progressList = await listLessonProgress(customUserId);
  return progressList.find((p) => p.lesson_id === lessonId)?.percent ?? 0;
}

export async function updateLessonProgress({
  lessonId,
  percent,
  completed,
  lastPosition = 0,
}: {
  lessonId: string;
  percent: number;
  completed?: boolean;
  lastPosition?: number;
}): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Unauthenticated" };

  try {
    const isCompleted = completed || percent >= 100;
    const now = new Date().toISOString();

    const { error } = await dbFrom("lesson_progress").upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        progress_percent: Math.min(100, Math.max(0, percent)),
        completed: isCompleted,
        last_position: lastPosition,
        completed_at: isCompleted ? now : null,
        updated_at: now,
      } as never,
      { onConflict: "user_id,lesson_id" },
    );

    if (error) return { error: error.message };

    // When completed, update profile streak & unlock achievements
    if (isCompleted) {
      // 1. Update streak
      try {
        const { data: profile } = await dbFrom("profiles")
          .select("learning_streak")
          .eq("id", userId)
          .single();

        const currentStreak = (profile?.learning_streak || 0) + 1;
        await dbFrom("profiles")
          .update({ learning_streak: currentStreak, updated_at: now } as never)
          .eq("id", userId);

        if (currentStreak >= 7) {
          await unlockAchievement("streak_7", userId);
        }
      } catch (streakErr) {
        console.warn("[ProgressService] Streak update:", streakErr);
      }

      // 2. Check total completed lessons for achievements
      try {
        const { count } = await dbFrom("lesson_progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("completed", true);

        if (count && count >= 1) {
          await unlockAchievement("first_lesson", userId);
        }
        if (count && count >= 5) {
          await unlockAchievement("five_lessons", userId);
        }
      } catch (achieveErr) {
        console.warn("[ProgressService] Achievement check:", achieveErr);
      }
    }

    return { error: null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function unlockAchievement(
  achievementId: string,
  customUserId?: string,
): Promise<void> {
  const userId = customUserId || (await getAuthUserId());
  if (!userId) return;

  try {
    await dbFrom("user_achievements").upsert(
      {
        user_id: userId,
        achievement_id: achievementId,
        earned_at: new Date().toISOString(),
      } as never,
      { onConflict: "user_id,achievement_id" },
    );
  } catch (err) {
    console.warn("[ProgressService] unlockAchievement:", err);
  }
}

export async function getContinueLesson(): Promise<{ lesson: Lesson; percent: number } | null> {
  const userId = await getAuthUserId();
  const allLessons = await listLessons();
  const progress = await listLessonProgress(userId ?? undefined);

  // Check for in-flight lesson
  const inFlight = progress
    .filter((p) => !p.completed && p.percent > 0)
    .sort((a, b) => (a.last_opened_at < b.last_opened_at ? 1 : -1))[0];

  if (inFlight) {
    const lesson = allLessons.find((l) => l.id === inFlight.lesson_id);
    if (lesson) return { lesson, percent: inFlight.percent };
  }

  // Otherwise return first incomplete lesson
  const completedIds = new Set(progress.filter((p) => p.completed).map((p) => p.lesson_id));
  const nextIncomplete = allLessons.find((l) => !completedIds.has(l.id));
  if (nextIncomplete) {
    const currentPercent = progress.find((p) => p.lesson_id === nextIncomplete.id)?.percent ?? 0;
    return { lesson: nextIncomplete, percent: currentPercent };
  }

  return allLessons[0] ? { lesson: allLessons[0], percent: 100 } : null;
}

export async function getRecommendedLessons(limit = 3): Promise<Lesson[]> {
  const userId = await getAuthUserId();
  const allLessons = await listLessons();
  const progress = await listLessonProgress(userId ?? undefined);

  const completedIds = new Set(progress.filter((p) => p.completed).map((p) => p.lesson_id));
  const remaining = allLessons.filter((lesson) => !completedIds.has(lesson.id));

  return (remaining.length > 0 ? remaining : allLessons).slice(0, limit);
}

export async function listActivity(): Promise<ActivityItem[]> {
  const userId = await getAuthUserId();
  if (!userId) return clone(mockActivity);

  try {
    const { data: progressRows } = (await dbFrom("lesson_progress")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(5)) as { data: Tables<"lesson_progress">[] | null; error: unknown };

    const { data: certificates } = (await dbFrom("certificates")
      .select("*")
      .eq("user_id", userId)
      .limit(2)) as { data: Tables<"certificates">[] | null; error: unknown };

    const items: ActivityItem[] = [];

    if (certificates && certificates.length > 0) {
      certificates.forEach((cert) => {
        items.push({
          id: `cert-${cert.id}`,
          kind: "certificate",
          title: `Earned ${cert.title}`,
          detail: `Certificate #${cert.certificate_number} with score ${cert.score}%`,
          at: cert.issued_at,
        });
      });
    }

    if (progressRows && progressRows.length > 0) {
      progressRows.forEach((p) => {
        items.push({
          id: `prog-${p.id}`,
          kind: p.completed ? "lesson" : "practice",
          title: p.completed ? "Completed Healthcare Lesson" : "Practiced Healthcare Lesson",
          detail: p.completed
            ? "Mastered all signs and quiz"
            : `Reached ${p.progress_percent}% progress`,
          at: p.updated_at,
        });
      });
    }

    if (items.length > 0) return items;
  } catch (err) {
    console.warn("[ProgressService] listActivity fallback:", err);
  }

  return clone(mockActivity);
}

export async function listAchievements(): Promise<Achievement[]> {
  const userId = await getAuthUserId();

  try {
    const { data: allAchievements } = (await dbFrom("achievements").select("*")) as {
      data: Tables<"achievements">[] | null;
      error: unknown;
    };

    const { data: rawUserEarned } = userId
      ? ((await dbFrom("user_achievements").select("*").eq("user_id", userId)) as {
          data: Tables<"user_achievements">[] | null;
          error: unknown;
        })
      : { data: null };
    const userEarned = rawUserEarned ?? [];

    const earnedSet = new Map((userEarned ?? []).map((e) => [e.achievement_id, e.earned_at]));

    if (allAchievements && allAchievements.length > 0) {
      return allAchievements.map((ach) => ({
        id: ach.id,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        earned: earnedSet.has(ach.id),
        earned_at: earnedSet.get(ach.id) ?? null,
      }));
    }
  } catch (err) {
    console.warn("[ProgressService] listAchievements fallback:", err);
  }

  return clone(mockAchievements);
}

/**
 * Returns a lightweight demo user for UI previews when no auth is present.
 */
export async function getDemoUser(): Promise<AppUser> {
  return clone({
    id: "demo",
    full_name: "Guest Learner",
    email: "",
    role: "nurse",
    hospital_id: null,
    sector: "healthcare",
    level: "bronze",
    created_at: new Date().toISOString(),
  } as AppUser);
}
