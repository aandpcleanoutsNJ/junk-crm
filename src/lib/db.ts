import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cached: NeonQueryFunction<false, false> | null = null;

/**
 * Returns a ready-to-use SQL query function, or null if DATABASE_URL hasn't
 * been set yet. Callers must handle the null case with a friendly message
 * instead of crashing (the app must build and run before Neon is connected).
 */
export function getDb(): NeonQueryFunction<false, false> | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!cached) {
    cached = neon(url);
  }
  return cached;
}
