import { Router } from "express";
import { news, localResources } from "../serper.js";

const router = Router();

// GET /api/news?category=transport
router.get("/news", async (req, res) => {
  const items = await news(req.query.category || "transport");
  res.json({ items });
});

// GET /api/local-resources?category=transport&city=Bengaluru
router.get("/local-resources", async (req, res) => {
  const items = await localResources(
    req.query.category || "transport",
    req.query.city || ""
  );
  res.json({ items });
});

export default router;
