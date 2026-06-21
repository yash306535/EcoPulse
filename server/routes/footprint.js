import { Router } from "express";
import { statements } from "../db.js";
import { computeBreakdown, computeTotals, topCategory, FACTORS } from "../../shared/carbon.js";

const router = Router();

// Clamp a numeric field to a sane, non-negative range.
function clampNum(v, max) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

// Whitelist an enum value against the engine's known keys.
function pickEnum(v, table, fallback) {
  return Object.prototype.hasOwnProperty.call(table, v) ? v : fallback;
}

// Validate and sanitize raw quiz answers before they reach the engine / DB.
function sanitizeAnswers(raw = {}, city = "") {
  return {
    commuteMode: pickEnum(raw.commuteMode, FACTORS.commute, "wfh"),
    kmPerDay: clampNum(raw.kmPerDay, 2000),
    daysPerWeek: clampNum(raw.daysPerWeek, 7),
    flightsDomestic: clampNum(raw.flightsDomestic, 500),
    flightsIntl: clampNum(raw.flightsIntl, 500),
    monthlyKwh: clampNum(raw.monthlyKwh, 100000),
    lpgPerMonth: clampNum(raw.lpgPerMonth, 100),
    diet: pickEnum(raw.diet, FACTORS.diet, "moderate"),
    shopping: pickEnum(raw.shopping, FACTORS.shopping, "monthly"),
    waste: pickEnum(raw.waste, FACTORS.waste, "sometimes"),
    city: String(city || raw.city || "").slice(0, 80),
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
    console.error("[footprint] db error:", err.message);
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
