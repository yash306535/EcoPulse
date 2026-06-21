# Implementation Plan — EcoPulse

## Overview

This plan sequences the EcoPulse build by priority. **P0 (tasks 1–9)** delivers the complete core loop — scaffold, shared engine, database, Express, footprint/logs/coach routes, and the frontend quiz → dashboard → logger — and must work fully even with no API keys. **P1 (tasks 10–14)** adds Serper live data, gamification, goals, and chat. **P2 (task 15)** is polish. Task 16 finalizes README and demo verification.

## Tasks

> Build order is strict: complete all **P0** tasks (1–9) fully and correctly before starting **P1** (10–14). Do **P2** (15) only if time remains. If you run out of time, stop and report exactly what's left rather than leaving a screen half-broken.

### P0 — Core Loop

- [ ] 1. Scaffold the monorepo and run pipeline
  - Create root `package.json` with `concurrently` + `nodemon` and scripts: `dev`, `dev:server`, `dev:client`, `build`, `start`.
  - Create `.gitignore` (node_modules, `.env`, `*.sqlite`, `client/dist`) and `.env.example` with `OPENAI_API_KEY=` and `SERPER_API_KEY=`.
  - Scaffold `client/` with Vite + React, Tailwind, PostCSS; configure dev proxy `/api → http://localhost:5000` and `@shared` alias.
  - Install deps: server (`express`, `cors`, `better-sqlite3`, `openai`, `dotenv`), client (`recharts`, `lucide-react`, `uuid`).
  - _Requirements: NFR 1, 6, 9_

- [ ] 2. Implement the shared deterministic carbon engine
  - Create `shared/carbon.js` with `FACTORS`, `REFERENCES`, `computeBreakdown`, `computeTotals`, `topCategory`; coerce invalid numbers to 0.
  - Write unit tests covering each Q1–Q7 formula, totals, annualization, and `topCategory`.
  - _Requirements: 3.1–3.9, 2.4_

- [ ] 3. Implement the database layer
  - Create `server/db.js`: init `better-sqlite3` (auto-create file), create `profiles`, `logs`, `cache` tables, export prepared statements (upsert/get profile, insert/get logs, cache get/set).
  - Create `server/cache.js` wrapping cache table with TTL get/set.
  - _Requirements: 7.2, 7.3, 7.4, 9 (schema)_

- [ ] 4. Build the Express app shell
  - Create `server/index.js`: `dotenv`, `cors`, JSON body parser, mount `/api` routes, serve `client/dist` statically with SPA fallback when present, listen on port 5000.
  - Add a middleware/helper to read `clientId` from `X-Client-Id`.
  - _Requirements: NFR 6, 7.1, 7.7_

- [ ] 5. Implement footprint routes
  - `server/routes/footprint.js`: `POST /api/footprint` computes breakdown via shared engine, upserts profile, returns `{breakdown, totals, topCategory}`; `GET /api/footprint/:clientId` returns saved profile or 404.
  - _Requirements: 2.3, 4.4, 7.2, 7.4_

- [ ] 6. Implement logs routes
  - `server/routes/logs.js`: `POST /api/logs` inserts dated row for `clientId`, returns updated weekly total; `GET /api/logs/:clientId` returns logs + 7-day trend + weekly total.
  - _Requirements: 6.2, 6.3, 6.5_

- [ ] 7. Implement the OpenAI coach route with fallback
  - `server/openai.js`: `coach()` using `gpt-4o-mini` with verbatim EcoCoach prompt and `json_object` response format; validate shape; return `FALLBACK_TIPS` on any error or missing key.
  - `server/routes/coach.js`: `POST /api/coach` reads stored breakdown, per-client in-memory cache (~3 min), returns tips + encouragement.
  - _Requirements: 5.1–5.5, NFR 4, 7_

- [ ] 8. Build the frontend core loop
  - `lib/clientId.js` (uuid in localStorage), `lib/api.js` (fetch wrapper with `X-Client-Id`), `lib/actions.js` (preset action→{category,deltaKg}).
  - `App.jsx` state machine (landing/quiz/dashboard) + hydrate from `GET /api/footprint/:clientId`.
  - `Landing.jsx`, `Quiz.jsx` (7 questions + city, reference hints, compute client-side on submit, fire-and-forget POST), `Skeleton.jsx`.
  - `Dashboard.jsx` composing `FootprintHero`, `BreakdownCharts` (Recharts donut + bar), `ComparisonStrip`, `InsightsPanel` (coach + skeleton + fallback).
  - Apply the light theme tokens (warm off-white bg, teal/green accent, charcoal text) in `index.css`/`tailwind.config.js`.
  - _Requirements: 1.1–1.5, 2.1–2.6, 4.1–4.5, 5.1, 5.4, NFR 5, 8_

- [ ] 9. Build the Daily Activity Logger UI
  - `ActivityLogger.jsx`: preset quick-add chips + custom add, POST `/api/logs`, optimistic weekly-total update, 7-day Recharts trend line from `GET /api/logs/:clientId`, friendly empty/error state.
  - Wire it into the dashboard so the weekly total updates live.
  - _Requirements: 6.1–6.4_

> ✅ Checkpoint: P0 must be a fully working quiz → dashboard → logger loop that runs even with NO OpenAI/Serper keys before continuing.

### P1 — Live & Engagement Features

- [ ] 10. Implement Serper client + live routes
  - `server/serper.js`: `news()` and `localResources()` with query templates, `cache` table TTL ~30 min, last-cache + hardcoded fallbacks.
  - `server/routes/live.js`: `GET /api/news?category=`, `GET /api/local-resources?category=&city=`.
  - _Requirements: 8.1–8.4, 9.1–9.3_

- [ ] 11. Live Sustainability Pulse UI
  - `NewsPulse.jsx`: fetch `/api/news` for top category on dashboard load, skeleton, render 3 headlines as links, fallback content.
  - _Requirements: 8.1, 8.4, NFR 5_

- [ ] 12. Local Eco Resources UI
  - `LocalResources.jsx`: fetch `/api/local-resources` for top category + city, render 3–5 link cards (title, snippet, domain), skeleton + fallback.
  - _Requirements: 9.1–9.3_

- [ ] 13. Gamification + Goal setting
  - `Gamification.jsx`: compute EcoScore (0–100) and streak from log history; define + display 4–5 badges with locked/unlocked state.
  - `GoalCard.jsx`: set "reduce by X% this month" (persist in localStorage), progress bar.
  - _Requirements: 10.1–10.3, 11.1–11.2_

- [ ] 14. AI Chat widget
  - `server/routes/chat.js` + `openai.chat()` (verbatim EcoBot prompt, fallback reply).
  - `ChatWidget.jsx`: floating widget, POST `/api/chat`, render reply, graceful fallback.
  - _Requirements: 12.1–12.3_

### P2 — Polish (only if time remains)

- [ ] 15. Shareable results card + micro-animations
  - Render results to canvas/image for download/share.
  - Subtle animations on hero number and chart transitions (light theme only).
  - _Requirements: 13.1, 14.1_

### Finalization

- [ ] 16. Write README and verify the demo
  - README per brief Section 12 (problem, solution, features, stack, architecture, setup/run, env vars, screenshot/demo placeholders, future scope, built-with).
  - Verify: `npm install` + `npm run dev` starts both; full loop works with keys absent and enriches with keys present; `npm run build` + `npm start` serves on one port.
  - _Requirements: NFR 1–9_

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1], "description": "Scaffold monorepo and run pipeline" },
    { "wave": 2, "tasks": [2, 3], "description": "Shared engine and database layer (parallel)" },
    { "wave": 3, "tasks": [4], "description": "Express app shell" },
    {
      "wave": 4,
      "tasks": [5, 6, 7],
      "description": "Footprint, logs, and coach routes (parallel)"
    },
    {
      "wave": 5,
      "tasks": [8],
      "description": "Frontend core loop (landing, quiz, dashboard, insights)"
    },
    { "wave": 6, "tasks": [9], "description": "Daily activity logger UI — P0 checkpoint" },
    { "wave": 7, "tasks": [10], "description": "Serper client and live routes" },
    {
      "wave": 8,
      "tasks": [11, 12, 13, 14],
      "description": "News, local resources, gamification/goals, chat (parallel)"
    },
    { "wave": 9, "tasks": [15], "description": "P2 polish — shareable card and animations" },
    { "wave": 10, "tasks": [16], "description": "README and demo verification" }
  ]
}
```

Textual view:

```
1 (scaffold)
├─▶ 2 (shared engine)
├─▶ 3 (db layer) ─▶ 4 (express shell)
│                    ├─▶ 5 (footprint routes)   [needs 2,3]
│                    ├─▶ 6 (logs routes)         [needs 3]
│                    └─▶ 7 (coach route)         [needs 3]
└─▶ 8 (frontend core loop) [needs 2,5,7]
        └─▶ 9 (logger UI)   [needs 6,8]

  [P0 checkpoint passes]

10 (serper client + live routes) [needs 4]
├─▶ 11 (news UI)        [needs 8,10]
└─▶ 12 (local resources UI) [needs 8,10]
13 (gamification + goals) [needs 9]
14 (chat widget)          [needs 4,8]

15 (P2 polish)            [needs 8]
16 (README + verify)      [needs all attempted]
```

Parallelizable once their prerequisites are met: tasks 5, 6, 7 can run concurrently after 4; tasks 11 and 12 after 10; tasks 13 and 14 after the P0 checkpoint.

## Notes

- **Hard time limit**: P0 (1–9) is the priority. A smaller fully-working app beats a bigger broken one.
- **No keys required for P0**: tasks 7 and 8 must verify the coach fallback works with `OPENAI_API_KEY` absent.
- **Secrets**: never commit `.env`; only `.env.example` is checked in.
- **Verbatim prompts**: the EcoCoach and EcoBot system prompts must be copied exactly from the brief.
- **Light theme only**: no dark mode toggle; follow the warm off-white + teal/green palette.
- **Stop-and-report**: if time runs out mid-task, leave the last completed task in a working state and report exactly what remains.
