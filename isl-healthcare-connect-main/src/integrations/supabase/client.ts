// Supabase typed client — ISL Setu
// Import the supabase client like this:
//   import { supabase } from "@/integrations/supabase/client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

// Read credentials at module load time — Vite replaces import.meta.env at build time.
const SUPABASE_URL =
  (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ||
  (typeof process !== "undefined" ? (process.env["SUPABASE_URL"] ?? "") : "") ||
  "";

const SUPABASE_KEY =
  (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ||
  (typeof process !== "undefined" ? (process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "") : "") ||
  "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. " +
      "Database queries will fail until these are set in .env",
  );
}

/**
 * Typed Supabase client.
 *
 * Uses a direct `createClient<Database>()` (no Proxy) so TypeScript can
 * fully propagate the generic through query builder chains.
 *
 * NOTE: If you see 'never' type errors in service files, use the `from()`
 * re-export below which bypasses Supabase JS v2's strict type inference.
 */
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes("placeholder") && !SUPABASE_KEY.includes("placeholder"),
);

export const supabase = createClient<Database>(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_KEY || "placeholder",
  {
    global: {
      fetch: SUPABASE_KEY ? createSupabaseFetch(SUPABASE_KEY) : undefined,
    },
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);

/**
 * Type-safe query helper that bypasses Supabase JS v2's strict generic
 * inference — call `from("tableName")` and cast the result to `Tables<T>`.
 * This is equivalent to supabase.from() at runtime.
 *
 * Usage:
 *   const { data } = await from("lessons").select("*").eq("id", id);
 *   const row = data as Tables<"lessons"> | null;
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const from = (table: string) => (supabase as any).from(table);
