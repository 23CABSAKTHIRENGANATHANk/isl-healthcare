/**
 * Content service: lessons, signs and categories.
 * Mock-backed today; each function maps 1:1 to a future table query.
 */
import { categories, lessons, signs } from "./mock/data";
import type { Lesson, Sign, SignCategory } from "@/types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const latency = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listCategories(): Promise<SignCategory[]> {
  await latency();
  return clone(categories);
}

export async function listLessons(): Promise<Lesson[]> {
  await latency();
  return clone(lessons);
}

export async function listLessonsByCategory(): Promise<{ category: SignCategory; lessons: Lesson[] }[]> {
  await latency();
  return clone(
    categories.map((category) => ({
      category,
      lessons: lessons.filter((lesson) => lesson.category_id === category.id),
    })),
  );
}

export async function getLesson(slug: string): Promise<Lesson | null> {
  await latency();
  return clone(lessons.find((lesson) => lesson.slug === slug) ?? null);
}

export async function listSigns(): Promise<Sign[]> {
  await latency();
  return clone(signs);
}

export async function listSignsByCategory(categoryId: string): Promise<Sign[]> {
  await latency();
  return clone(signs.filter((s) => s.category_id === categoryId));
}

export async function getSignsForLesson(lesson: Lesson): Promise<Sign[]> {
  await latency(120);
  return clone(lesson.sign_ids.map((id) => signs.find((s) => s.id === id)).filter(Boolean) as Sign[]);
}

export const getLessonBySlug = getLesson;

export async function listSignsForLesson(lessonId: string): Promise<Sign[]> {
  await latency(120);
  const target = lessons.find((l) => l.id === lessonId || l.slug === lessonId);
  if (!target) return [];
  return clone(target.sign_ids.map((id) => signs.find((s) => s.id === id)).filter(Boolean) as Sign[]);
}

export function signByGloss(gloss: string): Sign | null {
  return clone(signs.find((s) => s.gloss === gloss) ?? null);
}

