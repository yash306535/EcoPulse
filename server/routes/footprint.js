import { Router } from "express";
import { statements } from "../db.js";
import { computeBreakdown, computeTotals, topCategory, FACTORS } from "../../shared/carbon.js";
import { INPUT_LIMITS } from "../config.js";
import { warn } from "../logger.js";

const router = Router();

/**
 * Clamp a numeric field to a sane, non-negative range.
 * @param {unknown} v
 * @param {number} max
 * @returns {number}
 */
function clampNum(v, max) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

/**
 * Whitelist an enum value against the engine's known keys.
 * @param {unknown} v
 * @param {Record<string, unknown>} table
 * @param {string} fallback
 * @returns {string}
 */
function pickEnum(v, table, fallback) {
  return Object.prototype.hasOwnProperty.call(table, v) ? v : fallback;
}

/**
 * Validate and sanitize raw quiz answers before they reach the engine / DB.
 * @param {Record<string, unknown>} raw
 * @param {string} city
 * @returns {object} sanitized answers
 */
function sanitizeAnswers(raw = {}, city = "") {
  return {
    commuteMode: pickEnum(raw.commuteMode, FACTORS.commute, "wfh"),
    kmPerDay: clampNum(raw.kmPerDay, INPUT_LIMITS.kmPerDay),
    daysPerWeek: clampNum(raw.daysPerWeek, INPUT_LIMITS.daysPerWeek),
    flightsDomestic: clampNum(raw.flightsDomestic, INPUT_LIMITS.flights),
    flightsIntl: clampNum(raw.flightsIntl, INPUT_LIMITS.flights),
    monthlyKwh: clampNum(raw.monthlyKwh, INPUT_LIMITS.monthlyKwh),
    lpgPerMonth: clampNum(raw.lpgPerMonth, INPUT_LIMITS.lpgPerMonth),
    diet: pickEnum(raw.diet, FACTORS.diet, "moderate"),
    shopping: pickEnum(raw.shopping, FACTORS.shopping, "monthly"),
    waste: pickEnum(raw.waste, FACTORS.waste, "sometimes"),
    city: String(city || raw.city || "").slice(0, INPUT_LIMITS.cityLength),
  };
}

// POST /api/footprint — compute, upsert profile, return breakdown + totals
router.post("/footprint", (req, res) => {
  const clientId = req.clientId;
  if (!clientId) return res.status(400).json({ error: "missing X-Client-Id" });

  const { answers = {}, city = "" } = req.body || {};
  const fullAnswers = sanitizeAnswers(answers, city);
  const breakdown = computeBreakdown(fullAnswers);
  const totals = computeTotals(breakdown);
  const top = topCategory(breakdown);

  try {
    statements.upsertProfile.run({
      clientId,
      city: fullAnswers.city,
      quiz_answers: JSON.stringify(fullAnswers),
      breakdown: JSON.stringify(breakdown),
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    warn("footprint", `db error: ${err.message}`);
  }

  res.json({ breakdown, totals, topCategory: top, city: fullAnswers.city });
});

// GET /api/footprint/:clientId — return saved profile
router.get("/footprint/:clientId", (req, res) => {
  const row = statements.getProfile.get(req.params.clientId);
  if (!row) return res.status(404).json({ error: "not found" });
  const breakdown = JSON.parse(row.breakdown || "{}");
  res.json({
    city: row.city,
    answers: JSON.parse(row.quiz_answers || "{}"),
    breakdown,
    totals: computeTotals(breakdown),
    topCategory: topCategory(breakdown),
  });
});

export default router;
