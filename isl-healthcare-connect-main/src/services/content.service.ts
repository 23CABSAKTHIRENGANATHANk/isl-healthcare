/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Content service: lessons, signs and categories with Supabase backend.
 */
import { supabase, from as dbFrom } from "@/integrations/supabase/client";
import { categories, lessons as mockLessons, signs as mockSigns } from "./mock/data";
import type { Lesson, QuizQuestion, Sign, SignCategory } from "@/types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

import { SIGN_VIDEO_URLS } from "@/config/video-mapping";

/** Enrich any sign with guaranteed video URL from canonical dataset */
function enrichSign(s: Sign): Sign {
  const glossKey = s.gloss.toLowerCase().trim();
  const idKey = s.id.toLowerCase().trim();
  const exactMappedVideo = SIGN_VIDEO_URLS[glossKey] || SIGN_VIDEO_URLS[idKey];

  const canonical = mockSigns.find(
    (m) =>
      m.id.toLowerCase() === idKey ||
      m.gloss.toLowerCase() === glossKey,
  );

  const fallbackCapitalized = `/videos/signs/${s.gloss.charAt(0).toUpperCase() + s.gloss.slice(1).toLowerCase()}.mp4`;
  const videoUrl = exactMappedVideo || canonical?.video_url || s.video_url || fallbackCapitalized;

  return {
    ...s,
    video_url: videoUrl,
    steps: (s.steps && s.steps.length > 0) ? s.steps : (canonical?.steps || []),
    region_note: s.region_note || canonical?.region_note || "",
  };
}

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
      const dbLessons = data.map((row: any) => {
        const canonical = mockLessons.find((ml) => ml.slug === row.slug || ml.id === row.id);
        return {
          id: row.id,
          slug: row.slug,
          code: row.code || canonical?.code || "CLN-101",
          title: row.title || canonical?.title,
          summary: row.summary || canonical?.summary,
          category_id: row.category_id || canonical?.category_id || "clinical",
          duration_minutes: row.duration_minutes || canonical?.duration_minutes || 15,
          difficulty: (row.difficulty || canonical?.difficulty || "beginner") as Lesson["difficulty"],
          sign_ids: canonical?.sign_ids || (Array.isArray(row.sign_ids) ? row.sign_ids : []),
          thumbnail_tone: (row.thumbnail_tone || canonical?.thumbnail_tone || "primary") as Lesson["thumbnail_tone"],
          captions: (Array.isArray(row.captions) && row.captions.length > 0) ? row.captions : (canonical?.captions || []),
          quiz: (Array.isArray(row.quiz) && row.quiz.length > 0) ? row.quiz : (canonical?.quiz || []),
        };
      });

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
    if (matching.length === 0) {
      const fallback = mockLessons.filter((l) => l.category_id === category.id);
      return { category, lessons: clone(fallback) };
    }
    return { category, lessons: matching };
  });
}

export async function getLesson(slug: string): Promise<Lesson | null> {
  const canonical = mockLessons.find((l) => l.slug === slug || l.id === slug);

  try {
    const { data, error } = await dbFrom("lessons")
      .select("*")
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        slug: data.slug,
        code: data.code || canonical?.code || "CLN-101",
        title: data.title || canonical?.title || "Healthcare Lesson",
        summary: data.summary || canonical?.summary || "",
        category_id: data.category_id || canonical?.category_id || "clinical",
        duration_minutes: data.duration_minutes || canonical?.duration_minutes || 15,
        difficulty: (data.difficulty || canonical?.difficulty || "beginner") as Lesson["difficulty"],
        sign_ids: canonical?.sign_ids || (Array.isArray(data.sign_ids) ? data.sign_ids : []),
        thumbnail_tone: (data.thumbnail_tone || canonical?.thumbnail_tone || "primary") as Lesson["thumbnail_tone"],
        captions: canonical?.captions || (Array.isArray(data.captions) ? data.captions : []),
        quiz: canonical?.quiz || (Array.isArray(data.quiz) ? data.quiz : []),
      };
    }
  } catch (err) {
    console.warn("[ContentService] Supabase getLesson fallback:", err);
  }

  return canonical ? clone(canonical) : null;
}

export const getLessonBySlug = getLesson;

export async function listSigns(): Promise<Sign[]> {
  try {
    const { data, error } = await dbFrom("signs").select("*").eq("is_published", true);

    if (!error && data && data.length > 0) {
      const dbSigns = data.map((row: any) =>
        enrichSign({
          id: row.id,
          gloss: row.gloss,
          meaning: row.meaning,
          category_id: row.category_id,
          difficulty: row.difficulty as Sign["difficulty"],
          region_note: row.region_note,
          video_url: row.video_url,
          steps: (Array.isArray(row.steps) ? row.steps : []) as string[],
        }),
      );
      // Merge with mock signs so all 61 verified signs are always included
      const existingIds = new Set(dbSigns.map((s: Sign) => s.id.toLowerCase()));
      const missingMock = mockSigns.filter((ms) => !existingIds.has(ms.id.toLowerCase()));
      return [...dbSigns, ...clone(missingMock)];
    }
  } catch (err) {
    console.warn("[ContentService] Supabase listSigns exception:", err);
  }
  return clone(mockSigns).map(enrichSign);
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
    const found = allSigns.find(
      (s) =>
        s.id.toLowerCase() === clean ||
        s.id.toLowerCase() === withSpace ||
        s.id.toLowerCase() === withHyphen ||
        s.gloss.toLowerCase() === clean ||
        s.gloss.toLowerCase() === withSpace,
    );
    return found ? enrichSign(found) : null;
  }).filter(Boolean) as Sign[];
}

export async function listSignsForLesson(lessonId: string): Promise<Sign[]> {
  const lesson = await getLesson(lessonId);
  if (!lesson) return [];
  return getSignsForLesson(lesson);
}

export async function signByGloss(gloss: string): Promise<Sign | null> {
  const allSigns = await listSigns();
  const found = allSigns.find((s) => s.gloss.toUpperCase() === gloss.toUpperCase()) ?? null;
  return found ? enrichSign(found) : null;
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
        category_id: lesson.category_id || "clinical",
        duration_minutes: lesson.duration_minutes || 10,
        difficulty: lesson.difficulty || "beginner",
        sign_ids: lesson.sign_ids || [],
        thumbnail_tone: lesson.thumbnail_tone || "primary",
        captions: lesson.captions || [],
        quiz: lesson.quiz || [],
        is_published: true,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Failed to create lesson" };
  }
}

export async function updateLesson(
  id: string,
  updates: Partial<Lesson>,
): Promise<{ error: string | null }> {
  try {
    const { error } = await dbFrom("lessons").update(updates).eq("id", id);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || "Failed to update lesson" };
  }
}

export async function deleteLesson(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await dbFrom("lessons").delete().eq("id", id);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || "Failed to delete lesson" };
  }
}

export async function createSign(
  sign: Partial<Sign>,
): Promise<{ error: string | null; data?: Sign }> {
  try {
    const id = sign.id || (sign.gloss ? sign.gloss.toLowerCase().replace(/\s+/g, "-") : `sign-${Date.now()}`);
    const { data, error } = await dbFrom("signs")
      .insert({
        id,
        gloss: sign.gloss || "NEW SIGN",
        meaning: sign.meaning || "",
        category_id: sign.category_id || "clinical",
        difficulty: sign.difficulty || "beginner",
        region_note: sign.region_note || null,
        video_url: sign.video_url || null,
        steps: sign.steps || [],
        is_published: true,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { error: null, data };
  } catch (err: any) {
    return { error: err.message || "Failed to create sign" };
  }
}

export async function updateSign(
  id: string,
  updates: Partial<Sign>,
): Promise<{ error: string | null }> {
  try {
    const { error } = await dbFrom("signs").update(updates).eq("id", id);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || "Failed to update sign" };
  }
}

export async function deleteSign(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await dbFrom("signs").delete().eq("id", id);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || "Failed to delete sign" };
  }
}
