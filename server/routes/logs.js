import { Router } from "express";
import { statements } from "../db.js";

const router = Router();

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// Build a 7-day trend (oldest -> newest) summing delta_kg per day.
function buildTrend(logs) {
  const days = [];
  const map = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map[key] = 0;
    days.push(key);
  }
  for (const log of logs) {
    if (log.date in map) map[log.date] += log.delta_kg;
  }
  return days.map((date) => ({ date, total: Math.round(map[date] * 100) / 100 }));
}

function weeklyTotal(logs) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return logs
    .filter((l) => l.date >= cutoffStr)
    .reduce((s, l) => s + l.delta_kg, 0);
}

// POST /api/logs — insert dated row, return updated weekly total
router.post("/logs", (req, res) => {
  const clientId = req.clientId;
  if (!clientId) return res.status(400).json({ error: "missing X-Client-Id" });

  const body = req.body || {};
  // --- Validate & sanitize input ---
  const allowedCategories = ["transport", "energy", "food", "waste", "shopping", "other"];
  const category = allowedCategories.includes(body.category) ? body.category : "other";
  const action = String(body.action ?? "Logged activity").slice(0, 120);
  let delta = Number(body.deltaKg);
  if (!Number.isFinite(delta)) delta = 0;
  delta = Math.max(-1000, Math.min(1000, delta)); // clamp to a sane range

  const log = {
    clientId,
    date: todayStr(),
    category,
    action,
    delta_kg: delta,
  };
  try {
    statements.insertLog.run(log);
  } catch (err) {
    console.error("[logs] db error:", err.message);
    return res.status(500).json({ error: "could not save log" });
  }

  const logs = statements.getLogs.all(clientId);
  res.json({ weeklyTotal: weeklyTotal(logs), log });
});

// GET /api/logs/:clientId — history + 7-day trend + weekly total
router.get("/logs/:clientId", (req, res) => {
  const logs = statements.getLogs.all(req.params.clientId);
  res.json({
    logs,
    trend: buildTrend(logs),
    weeklyTotal: weeklyTotal(logs),
  });
});

export default router;
