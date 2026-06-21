import { Router } from "express";
import { chat } from "../openai.js";

const router = Router();

// POST /api/chat — { message } -> { reply }
router.post("/chat", async (req, res) => {
  const { message } = req.body || {};
  const reply = await chat(message);
  res.json({ reply });
});

export default router;
