import { getClientId } from "./clientId.js";

// Single fetch wrapper that injects X-Client-Id. Callers handle their own fallbacks.
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
