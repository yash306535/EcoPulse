import { getClientId } from "./clientId.js";

/**
 * Internal fetch wrapper that injects the X-Client-Id header and parses JSON.
 * Callers are expected to catch and handle their own fallbacks.
 * @param {string} path - API path beginning with /api
 * @param {{ method?: string, body?: unknown }} [options]
 * @returns {Promise<unknown>} the parsed JSON response
 * @throws {Error} when the response status is not ok
 */
async function request(path, { method = "GET", body } = {}) {
  const headers = { "X-Client-Id": getClientId() };
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}`);
  return res.json();
}

/** Typed-ish client for the EcoPulse backend. Each method returns a Promise of parsed JSON. */
export const api = {
  saveFootprint: (answers, city) =>
    request("/api/footprint", { method: "POST", body: { answers, city } }),
  getFootprint: () => request(`/api/footprint/${getClientId()}`),
  addLog: (category, action, deltaKg) =>
    request("/api/logs", { method: "POST", body: { category, action, deltaKg } }),
  getLogs: () => request(`/api/logs/${getClientId()}`),
  coach: () => request("/api/coach", { method: "POST", body: {} }),
  chat: (message) => request("/api/chat", { method: "POST", body: { message } }),
  news: (category) => request(`/api/news?category=${encodeURIComponent(category)}`),
  localResources: (category, city) =>
    request(
      `/api/local-resources?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city || "")}`
    ),
};
