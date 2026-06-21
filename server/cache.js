// Generic TTL cache backed by the SQLite `cache` table.
import { statements } from "./db.js";

// Returns { fresh, payload } where payload is the parsed value (or null).
// `fresh` is true only if the entry exists and has not expired.
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
