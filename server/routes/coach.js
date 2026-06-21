import { Router } from "express";
import { statements } from "../db.js";
import { computeTotals } from "../../shared/carbon.js";
import { coach, FALLBACK_TIPS } from "../openai.js";

const router = Router();

// Per-client in-memory cache (a few minutes) to avoid re-spending.
const CACHE_TTL_MS = 3 * 60 * 1000;
const cache = new Map(); // clientId -> { at, data }

// POST /api/coach — read stored breakdown, call OpenAI, return tips + encouragement
router.post("/coach", async (req, res) => {
  const clientId = req.clientId;
  if (!clientId) return res.json(FALLBACK_TIPS);

  const cached = cache.get(clientId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  let breakdown = { transport: 0, energy: 0, food: 0, waste: 0, shopping: 0 };
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
