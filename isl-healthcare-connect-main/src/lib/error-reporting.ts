/**
 * Application error reporting utility for ISL Setu.
 */
export function reportAppError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[ISL Setu Error]", error, context);
}
