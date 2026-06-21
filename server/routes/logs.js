import { Router } from "express";
import { statements } from "../db.js";
import { INPUT_LIMITS, TREND_DAYS } from "../config.js";
import { warn } from "../logger.js";

const router = Router();

const ALLOWED_CATEGORIES = ["transport", "energy", "food", "waste", "shopping", "other"];

/** @returns {string} today's date as YYYY-MM-DD */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** @returns {string} the date `n` days ago as YYYY-MM-DD */
function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Build a trend series (oldest -> newest) summing delta_kg per day.
 * @param {Array<{date:string, delta_kg:number}>} logs
 * @returns {Array<{date:string, total:number}>}
 */
function buildTrend(logs) {
  const days = [];
  const totalsByDay = {};
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const key = daysAgoStr(i);
    totalsByDay[key] = 0;
    days.push(key);
  }
  for (const log of logs) {
    if (log.date in totalsByDay) totalsByDay[log.date] += log.delta_kg;
  }
  return days.map((date) => ({ date, total: Math.round(totalsByDay[date] * 100) / 100 }));
}

/**
 * Sum delta_kg over the trailing TREND_DAYS window.
 * @param {Array<{date:string, delta_kg:number}>} logs
 * @returns {number}
 */
function weeklyTotal(logs) {
  const cutoffStr = daysAgoStr(TREND_DAYS - 1);
  return logs.filter((l) => l.date >= cutoffStr).reduce((s, l) => s + l.delta_kg, 0);
}

// POST /api/logs — insert dated row, return updated weekly total
router.post("/logs", (req, res) => {
  const clientId = req.clientId;
  if (!clientId) return res.status(400).json({ error: "missing X-Client-Id" });

  const body = req.body || {};
  // --- Validate & sanitize input ---
  const category = ALLOWED_CATEGORIES.includes(body.category) ? body.category : "other";
  const action = String(body.action ?? "Logged activity").slice(0, INPUT_LIMITS.actionLength);
  let delta = Number(body.deltaKg);
  if (!Number.isFinite(delta)) delta = 0;
  delta = Math.max(-INPUT_LIMITS.deltaKg, Math.min(INPUT_LIMITS.deltaKg, delta));

  const log = { clientId, date: todayStr(), category, action, delta_kg: delta };
  try {
    statements.insertLog.run(log);
  } catch (err) {
    warn("logs", `db error: ${err.message}`);
    return res.status(500).json({ error: "could not save log" });
  }

  const logs = statements.getLogs.all(clientId);
  res.json({ weeklyTotal: weeklyTotal(logs), log });
});

// GET /api/logs/:clientId — history + trend + weekly total
router.get("/logs/:clientId", (req, res) => {
  const logs = statements.getLogs.all(req.params.clientId);
  res.json({
    logs,
    trend: buildTrend(logs),
    weeklyTotal: weeklyTotal(logs),
  });
});

export default router;
