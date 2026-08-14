/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Content service: lessons, signs and categories with Supabase backend.
 */
import { supabase, from as dbFrom } from "@/integrations/supabase/client";
import { categories, lessons as mockLessons, signs as mockSigns } from "./mock/data";
import type { Lesson, QuizQuestion, Sign, SignCategory } from "@/types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export async function listCategories(): Promise<SignCategory[]> {
  return clone(categories);
}

export async function listLessons(): Promise<Lesson[]> {
  try {
    const { data, error } = await dbFrom("lessons")
      .select("*")
      .eq("is_published", true)
      .order("order_index", { ascending: true });

    if (!error && data && data.length > 0) {
      console.log("[ContentService] Loaded lessons from Supabase:", data.length);
      const dbLessons = data.map((row: any) => ({
        id: row.id,
        slug: row.slug,
        code: row.code,
        title: row.title,
        summary: row.summary,
        category_id: row.category_id,
        duration_minutes: row.duration_minutes,
        difficulty: row.difficulty as Lesson["difficulty"],
        sign_ids: (Array.isArray(row.sign_ids) ? row.sign_ids : []) as string[],
        thumbnail_tone: (row.thumbnail_tone as Lesson["thumbnail_tone"]) || "primary",
        captions: (Array.isArray(row.captions) ? row.captions : []) as {
          at: number;
          text: string;
        }[],
        quiz: (Array.isArray(row.quiz) ? row.quiz : []) as QuizQuestion[],
      }));

      // Combine with mockLessons so all 5 categories are always fully populated
      const existingSlugs = new Set(dbLessons.map((l: Lesson) => l.slug));
      const missingMock = mockLessons.filter((ml) => !existingSlugs.has(ml.slug));
      return [...dbLessons, ...clone(missingMock)];
    }
  } catch (err) {
    console.warn("[ContentService] Supabase listLessons exception:", err);
  }
  return clone(mockLessons);
}

export async function listLessonsByCategory(): Promise<
  { category: SignCategory; lessons: Lesson[] }[]
> {
  const allLessons = await listLessons();
  return categories.map((category) => {
    const matching = allLessons.filter((lesson) => lesson.category_id === category.id);
    // If a category somehow has 0 matching, fallback to mockLessons for that category
    if (matching.length === 0) {
      const fallback = mockLessons.filter((l) => l.category_id === category.id);
      return { category, lessons: clone(fallback) };
    }
    return { category, lessons: matching };
  });
}

export async function getLesson(slug: string): Promise<Lesson | null> {
  try {
    const { data, error } = await dbFrom("lessons")
      .select("*")
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        slug: data.slug,
        code: data.code,
        title: data.title,
        summary: data.summary,
        category_id: data.category_id,
        duration_minutes: data.duration_minutes,
        difficulty: data.difficulty as Lesson["difficulty"],
        sign_ids: (Array.isArray(data.sign_ids) ? data.sign_ids : []) as string[],
        thumbnail_tone: (data.thumbnail_tone as Lesson["thumbnail_tone"]) || "primary",
        captions: (Array.isArray(data.captions) ? data.captions : []) as {
          at: number;
          text: string;
        }[],
        quiz: (Array.isArray(data.quiz) ? data.quiz : []) as QuizQuestion[],
      };
    }
  } catch (err) {
    console.warn("[ContentService] Supabase getLesson fallback:", err);
  }

  const fallback = mockLessons.find((l) => l.slug === slug || l.id === slug);
  return fallback ? clone(fallback) : null;
}

export const getLessonBySlug = getLesson;

export async function listSigns(): Promise<Sign[]> {
  try {
    const { data, error } = await dbFrom("signs").select("*").eq("is_published", true);

    if (!error && data && data.length > 0) {
      const dbSigns = data.map((row: any) => ({
        id: row.id,
        gloss: row.gloss,
        meaning: row.meaning,
        category_id: row.category_id,
        difficulty: row.difficulty as Sign["difficulty"],
        region_note: row.region_note,
        video_url: row.video_url,
        steps: (Array.isArray(row.steps) ? row.steps : []) as string[],
      }));
      // Merge with mock signs so all 71 signs are always available
      const existingIds = new Set(dbSigns.map((s: Sign) => s.id.toLowerCase()));
      const missingMock = mockSigns.filter((ms) => !existingIds.has(ms.id.toLowerCase()));
      return [...dbSigns, ...clone(missingMock)];
    }
  } catch (err) {
    console.warn("[ContentService] Supabase listSigns exception:", err);
  }
  return clone(mockSigns);
}

export async function listSignsByCategory(categoryId: string): Promise<Sign[]> {
  const allSigns = await listSigns();
  return allSigns.filter((s) => s.category_id === categoryId);
}

export async function getSignsForLesson(lesson: Lesson): Promise<Sign[]> {
  const allSigns = await listSigns();
  return (lesson.sign_ids || []).map((id) => {
    const clean = id.trim().toLowerCase();
    const withSpace = clean.replace(/-/g, " ");
    const withHyphen = clean.replace(/\s+/g, "-");
    return allSigns.find(
      (s) =>
        s.id.toLowerCase() === clean ||
        s.id.toLowerCase() === withSpace ||
        s.id.toLowerCase() === withHyphen ||
        s.gloss.toLowerCase() === clean ||
        s.gloss.toLowerCase() === withSpace,
    );
  }).filter(Boolean) as Sign[];
}

export async function listSignsForLesson(lessonId: string): Promise<Sign[]> {
  const lesson = await getLesson(lessonId);
  if (!lesson) return [];
  return getSignsForLesson(lesson);
}

export async function signByGloss(gloss: string): Promise<Sign | null> {
  const allSigns = await listSigns();
  return allSigns.find((s) => s.gloss.toUpperCase() === gloss.toUpperCase()) ?? null;
}

// -----------------------------------------------------------------------------
// Admin CRUD helpers
// -----------------------------------------------------------------------------

export async function createLesson(
  lesson: Partial<Lesson>,
): Promise<{ error: string | null; data?: Lesson }> {
  try {
    const id = lesson.slug || `lesson-${Date.now()}`;
    const { data, error } = await dbFrom("lessons")
      .insert({
        id,
        slug: lesson.slug || id,
        code: lesson.code || "MED-NEW",
        title: lesson.title || "New Lesson",
        summary: lesson.summary || "",
        category_id: lesson.category_id || "healthcare",
        duration_minutes: lesson.duration_minutes || 10,
        difficulty: lesson.difficulty || "beginner",
        thumbnail_tone: lesson.thumbnail_tone || "primary",
        sign_ids: (lesson.sign_ids || []) as never,
        quiz: (lesson.quiz || []) as never,
        is_published: true,
      } as never)
      .select()
      .single();

    if (error) return { error: error.message };
    return { error: null, data: data as unknown as Lesson };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function updateLesson(
  id: string,
  updates: Partial<Lesson>,
): Promise<{ error: string | null }> {
  try {
    const { error } = await dbFrom("lessons")
      .update({
        title: updates.title,
        summary: updates.summary,
        category_id: updates.category_id,
        duration_minutes: updates.duration_minutes,
        difficulty: updates.difficulty,
        sign_ids: updates.sign_ids as never,
      } as never)
      .eq("id", id);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function deleteLesson(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await dbFrom("lessons").delete().eq("id", id);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function createSign(
  sign: Partial<Sign>,
): Promise<{ error: string | null; data?: Sign }> {
  try {
    const id = (sign.gloss || "new-sign").toLowerCase().replace(/\s+/g, "-");
    const { data, error } = await dbFrom("signs")
      .insert({
        id,
        gloss: (sign.gloss || "NEW SIGN").toUpperCase(),
        meaning: sign.meaning || "",
        category_id: sign.category_id || "healthcare",
        difficulty: sign.difficulty || "beginner",
        region_note: sign.region_note || "Consistent across regions",
        steps: (sign.steps || []) as never,
        is_published: true,
      } as never)
      .select()
      .single();

    if (error) return { error: error.message };
    return { error: null, data: data as unknown as Sign };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function deleteSign(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await dbFrom("signs").delete().eq("id", id);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
