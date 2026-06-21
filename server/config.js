/**
 * Centralized server configuration constants.
 * Keeping these in one place avoids magic numbers scattered across modules
 * and makes tuning (TTLs, limits, ports) a single-file change.
 */

/** HTTP port the Express server listens on. */
export const PORT = Number(process.env.PORT) || 5000;

/** Maximum accepted JSON request body size. */
export const JSON_BODY_LIMIT = "64kb";

/** Rate limiting for the /api surface. */
export const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  max: 120, // requests per window per IP
};

/** Time-to-live for the per-client in-memory AI coach cache (milliseconds). */
export const COACH_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

/** Time-to-live for cached live (Serper) responses (milliseconds). */
export const LIVE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** OpenAI model used for coaching and chat. */
export const OPENAI_MODEL = "gpt-4o-mini";

/** Number of days shown in the activity trend chart. */
export const TREND_DAYS = 7;

/** Bounds used when sanitizing user-supplied numeric input. */
export const INPUT_LIMITS = {
  deltaKg: 1000,
  kmPerDay: 2000,
  daysPerWeek: 7,
  flights: 500,
  monthlyKwh: 100000,
  lpgPerMonth: 100,
  cityLength: 80,
  actionLength: 120,
};
