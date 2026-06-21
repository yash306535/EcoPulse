// Generic TTL cache backed by the SQLite `cache` table.
import { statements } from "./db.js";

/**
 * @typedef {Object} CacheResult
 * @property {boolean} fresh - true only if the entry exists and is not expired
 * @property {unknown} payload - the parsed cached value, or null when absent
 */

/**
 * Read a cached value by key.
 * A stale (expired) entry is still returned in `payload` so callers can use it
 * as a last-resort fallback, but `fresh` will be false.
 * @param {string} key
 * @returns {CacheResult}
 */
export function cacheGet(key) {
  try {
    const row = statements.cacheGet.get(key);
    if (!row) return { fresh: false, payload: null };
    const payload = JSON.parse(row.payload);
    const fresh = Date.now() < row.expires_at;
    return { fresh, payload };
  } catch {
    return { fresh: false, payload: null };
  }
}

/**
 * Write a value to the cache with a time-to-live. Best-effort: failures are ignored.
 * @param {string} key
 * @param {unknown} payload - JSON-serializable value to store
 * @param {number} ttlMs - time-to-live in milliseconds
 */
export function cacheSet(key, payload, ttlMs) {
  try {
    statements.cacheSet.run({
      key,
      payload: JSON.stringify(payload),
      expires_at: Date.now() + ttlMs,
    });
  } catch {
    // caching is best-effort; ignore failures
  }
}
