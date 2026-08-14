/**
 * Video System Utilities & Verification
 * Provides utilities for video loading, verification, and quality checks
 */

import { VIDEO_INVENTORY, SIGN_VIDEO_URLS, LESSON_VIDEO_MAPPING } from "@/config/video-mapping";

/**
 * Video loading result with fallback chains
 */
export interface VideoLoadResult {
  url: string;
  priority: number; // 0 = primary, 1 = fallback, 2 = secondary, etc
  available: boolean;
  checktime: number; // milliseconds
}

/**
 * Generate optimized video URL candidates in priority order
 */
const normalizeVideoToken = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function generateVideoUrlCandidates(gloss: string, signId?: string): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  const addUnique = (url: string) => {
    if (url && !seen.has(url)) {
      candidates.push(url);
      seen.add(url);
    }
  };

  const normalizedGloss = normalizeVideoToken(gloss || "");
  const normalizedSignId = normalizeVideoToken(signId || "");

  // Priority 1: explicit direct map by sign ID
  if (signId) {
    const mapped = SIGN_VIDEO_URLS[signId.toLowerCase()];
    if (mapped) addUnique(mapped);
  }

  // Priority 2: exact gloss mapping by known canonical names
  const glossKey = gloss.toLowerCase();
  if (SIGN_VIDEO_URLS[glossKey]) {
    addUnique(SIGN_VIDEO_URLS[glossKey]);
  }

  // Priority 3: match the real inventory keys and values using normalized names
  Object.entries(VIDEO_INVENTORY).forEach(([key, value]) => {
    const normalizedKey = normalizeVideoToken(key);
    const normalizedValue = normalizeVideoToken(value);
    const shouldMatch =
      normalizedKey === normalizedGloss ||
      normalizedKey === normalizedSignId ||
      normalizedValue.includes(normalizedGloss) ||
      normalizedValue.includes(normalizedSignId) ||
      normalizedGloss.includes(normalizedKey) ||
      normalizedSignId.includes(normalizedKey);

    if (shouldMatch) addUnique(value);
  });

  // Priority 4: Generate candidates from gloss variations using the actual file naming conventions
  const cleanGloss = gloss.trim();
  const variants = new Set<string>([
    cleanGloss,
    cleanGloss.replace(/\s+/g, " "),
    cleanGloss.replace(/\s+/g, "-"),
    cleanGloss
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" "),
    cleanGloss.charAt(0).toUpperCase() + cleanGloss.slice(1).toLowerCase(),
    cleanGloss.toUpperCase(),
    cleanGloss.toLowerCase(),
  ]);

  variants.forEach((variant) => {
    const encoded = encodeURI(variant);
    addUnique(`/videos/signs/${encoded}.mp4`);
    addUnique(`/videos/signs/${variant}.mp4`);
    addUnique(`/videos/dataset-videos/${encoded}.mp4`);
    addUnique(`/videos/dataset-videos/${variant}.mp4`);
    addUnique(`/dataset-videos/${encoded}.mp4`);
    addUnique(`/dataset-videos/${variant}.mp4`);
  });

  return candidates;
}

/**
 * Get the best available video URL for a sign
 */
export async function getBestVideoUrl(
  gloss: string,
  signId?: string
): Promise<VideoLoadResult | null> {
  const candidates = generateVideoUrlCandidates(gloss, signId);

  for (let i = 0; i < candidates.length; i++) {
    const url = candidates[i];
    try {
      const start = performance.now();
      const response = await fetch(url, { method: "HEAD" });
      const checktime = Math.round(performance.now() - start);

      if (response.ok) {
        return {
          url,
          priority: i,
          available: true,
          checktime,
        };
      }
    } catch (error) {
      // Continue to next candidate
    }
  }

  return null;
}

/**
 * Verify that all videos in a lesson are available
 */
export async function verifyLessonVideos(
  lessonId: string,
  signIds: string[]
): Promise<{
  complete: boolean;
  available: number;
  total: number;
  missing: string[];
  status: "ok" | "partial" | "failed";
}> {
  const results = await Promise.all(
    signIds.map(async (signId) => {
      const result = await getBestVideoUrl(signId, signId);
      return { signId, available: result !== null };
    })
  );

  const available = results.filter((r) => r.available).length;
  const total = results.length;
  const missing = results.filter((r) => !r.available).map((r) => r.signId);
  const complete = missing.length === 0;

  let status: "ok" | "partial" | "failed" = "ok";
  if (missing.length > 0) {
    status = available >= Math.ceil(total * 0.8) ? "partial" : "failed";
  }

  return {
    complete,
    available,
    total,
    missing,
    status,
  };
}

/**
 * Video coverage report for the entire system
 */
export async function generateVideoCoverageReport(): Promise<{
  totalSigns: number;
  signsCovered: number;
  coveragePercent: number;
  lessons: {
    id: string;
    coverage: number;
  }[];
}> {
  const signs = Object.keys(SIGN_VIDEO_URLS);
  let signsCovered = 0;

  for (const signId of signs) {
    const result = await getBestVideoUrl(signId);
    if (result) signsCovered++;
  }

  const lessons = await Promise.all(
    Object.entries(LESSON_VIDEO_MAPPING).map(async ([lessonId, videos]) => {
      const signIds = Object.keys(videos);
      const results = await Promise.all(
        signIds.map((signId) => getBestVideoUrl(signId))
      );
      const coverage = Math.round((results.filter((r) => r).length / signIds.length) * 100);
      return { id: lessonId, coverage };
    })
  );

  return {
    totalSigns: signs.length,
    signsCovered,
    coveragePercent: Math.round((signsCovered / signs.length) * 100),
    lessons,
  };
}

/**
 * Quick validation without async checks
 * Returns true if video system appears healthy
 */
export function isVideoSystemConfigured(): boolean {
  return (
    Object.keys(SIGN_VIDEO_URLS).length > 50 &&
    Object.keys(LESSON_VIDEO_MAPPING).length >= 10
  );
}

export default {
  generateVideoUrlCandidates,
  getBestVideoUrl,
  verifyLessonVideos,
  generateVideoCoverageReport,
  isVideoSystemConfigured,
};
