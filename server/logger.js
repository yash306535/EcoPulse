/**
 * Tiny logging helper so log formatting stays consistent and can be
 * swapped for a structured logger later without touching call sites.
 */

/**
 * Log an informational message.
 * @param {...unknown} args
 */
export function info(...args) {
  console.log(...args);
}

/**
 * Log an error/warning. Used for non-fatal failures that fall back gracefully.
 * @param {string} scope - the module or feature reporting the error
 * @param {string} message - a human-readable description
 */
export function warn(scope, message) {
  console.error(`[${scope}] ${message}`);
}
