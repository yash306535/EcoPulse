import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import "./db.js"; // ensure DB + tables are created on boot
import footprintRoutes from "./routes/footprint.js";
import logsRoutes from "./routes/logs.js";
import coachRoutes from "./routes/coach.js";
import chatRoutes from "./routes/chat.js";
import liveRoutes from "./routes/live.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // --- Security headers (helmet) ---
  // CSP is tuned to allow the built client + Google Fonts while staying strict.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(cors());
  // Cap request body size to limit abuse.
  app.use(express.json({ limit: "64kb" }));

  // Attach clientId from header to every request.
  app.use((req, _res, next) => {
    req.clientId = req.header("X-Client-Id") || null;
    next();
  });

  // Rate limit the API surface (generous enough for a live demo).
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please slow down." },
  });
  app.use("/api", apiLimiter);

  // API routes
  app.use("/api", footprintRoutes);
  app.use("/api", logsRoutes);
  app.use("/api", coachRoutes);
  app.use("/api", chatRoutes);
  app.use("/api", liveRoutes);

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // In production, serve the built client as static files (one URL, one port).
  const distPath = path.join(__dirname, "../client/dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Centralized error handler — never leak stack traces to clients.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error("[error]", err.message);
    res.status(err.status || 500).json({ error: "Something went wrong." });
  });

  return app;
}

export default createApp;
