import { Router } from "express";
import { statements } from "../db.js";
import { computeTotals } from "../../shared/carbon.js";
import { coach, FALLBACK_TIPS } from "../openai.js";
import { COACH_CACHE_TTL_MS } from "../config.js";

const router = Router();

/** Per-client in-memory cache (clientId -> { at, data }) to avoid re-spending. */
const cache = new Map();

const EMPTY_BREAKDOWN = { transport: 0, energy: 0, food: 0, waste: 0, shopping: 0 };

/**
 * POST /api/coach
 * Reads the stored breakdown for the client, asks the AI coach for ranked tips,
 * and caches the result briefly. Always resolves to a valid payload (fallback on error).
 */
router.post("/coach", async (req, res) => {
  const clientId = req.clientId;
  if (!clientId) return res.json(FALLBACK_TIPS);

  const cached = cache.get(clientId);
  if (cached && Date.now() - cached.at < COACH_CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  let breakdown = { ...EMPTY_BREAKDOWN };
  const row = statements.getProfile.get(clientId);
  if (row?.breakdown) {
    try {
      breakdown = JSON.parse(row.breakdown);
    } catch {
      /* keep default */
    }
  }
  const totals = computeTotals(breakdown);

  const data = await coach(breakdown, totals);
  cache.set(clientId, { at: Date.now(), data });
  res.json(data);
});

export default router;
