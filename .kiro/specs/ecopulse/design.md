# Design — EcoPulse

## Overview

EcoPulse is a zero-login, three-tier carbon-footprint tracker. This document defines the architecture, shared calculation engine, data models, API contract, frontend components, correctness properties, error handling, and build/run setup. The design prioritizes a fully-working core loop (quiz → dashboard → logger) that functions even without OpenAI or Serper keys, with live AI and search features layered on top as graceful enhancements.

## Architecture

EcoPulse is a three-tier app. A React/Vite single-page app renders the landing, quiz, dashboard, logger, and (P1) live/gamification/chat features. It talks only to an Express backend over HTTP, attaching an `X-Client-Id` header generated once per browser. Express owns all persistence (SQLite via `better-sqlite3`), all OpenAI calls (`gpt-4o-mini`), and all Serper calls. A deterministic carbon-calculation engine is shared by client (instant feedback) and server (authoritative persistence) so both produce identical numbers.

Key design principle: **the core loop never depends on an external API.** The client computes the footprint locally and persists in the background. OpenAI and Serper power only the Insights, Pulse, and Local Resources panels, each wrapped in try/catch with a cache and hardcoded fallback so the demo never shows a broken state.

```
React (Vite) ──HTTP + X-Client-Id──▶ Express
                                       ├─▶ SQLite (profiles, logs, cache)
                                       ├─▶ OpenAI gpt-4o-mini (coach, chat)
                                       └─▶ Serper (/news, /search)
```

## Repository Structure

```
ecopulse/
  package.json            # root: concurrently dev script, build, start
  .env.example            # OPENAI_API_KEY=, SERPER_API_KEY=
  .gitignore              # node_modules, .env, *.sqlite, client/dist
  README.md
  shared/
    carbon.js             # deterministic engine + constants (used by client & server)
  server/
    index.js              # express app, cors, static serve, route mount
    db.js                 # better-sqlite3 init + schema + prepared statements
    cache.js              # get/set with TTL using cache table
    openai.js             # coach() + chat() with fallbacks
    serper.js             # news() + localResources() with cache + fallbacks
    routes/
      footprint.js        # POST /api/footprint, GET /api/footprint/:clientId
      logs.js             # POST /api/logs, GET /api/logs/:clientId
      coach.js            # POST /api/coach
      chat.js             # POST /api/chat
      live.js             # GET /api/news, GET /api/local-resources
  client/
    index.html
    vite.config.js        # dev proxy /api -> localhost:5000
    tailwind.config.js
    postcss.config.js
    src/
      main.jsx
      App.jsx             # router/state machine: landing | quiz | dashboard
      index.css           # tailwind + theme tokens
      lib/
        api.js            # fetch wrapper injecting X-Client-Id
        clientId.js       # uuid in localStorage
        carbon.js         # re-export of shared engine (or import via alias)
        actions.js        # daily logger preset actions -> {category, deltaKg}
      components/
        Landing.jsx
        Quiz.jsx
        Dashboard.jsx
        FootprintHero.jsx
        BreakdownCharts.jsx     # donut + bar (Recharts)
        ComparisonStrip.jsx
        InsightsPanel.jsx       # /api/coach + skeleton + fallback
        ActivityLogger.jsx      # quick-add + 7-day trend line
        Skeleton.jsx
        # P1
        NewsPulse.jsx
        LocalResources.jsx
        Gamification.jsx        # EcoScore + streak + badges
        GoalCard.jsx
        ChatWidget.jsx
```

Note: `shared/carbon.js` is plain ESM imported by both `server/` and `client/`. Vite resolves it via a path alias (`@shared`). Server imports it directly with a relative path.

## Shared Carbon Engine (`shared/carbon.js`)

Single source of truth. Pure functions, no I/O.

```js
export const FACTORS = {
  commute: { car: 0.17, twoWheeler: 0.07, busMetro: 0.07, walkCycle: 0, wfh: 0 },
  flight: { domestic: 250, international: 900 },
  grid: 0.82,            // kg CO2e / kWh
  lpgCylinder: 42,       // kg CO2e / cylinder
  weeksPerMonth: 4.33,
  diet: { heavy: 30, moderate: 21, vegetarian: 14, vegan: 10 },
  shopping: { rarely: 2, monthly: 8, weekly: 20 },
  waste: { always: 3, sometimes: 6, never: 10 },
};

export const REFERENCES = {        // tonnes CO2e / year
  india: 1.9, world: 4.7, eu: 6.8, usa: 14.9, parisLow: 2.0, parisHigh: 2.3,
};

// answers shape:
// { commuteMode, kmPerDay, daysPerWeek, flightsDomestic, flightsIntl,
//   monthlyKwh, lpgPerMonth, diet, shopping, waste, city }
export function computeBreakdown(a) { /* returns {transport,energy,food,waste,shopping} */ }
export function computeTotals(breakdown) {
  // { weekly, annualKg, annualTonnes }
}
export function topCategory(breakdown) { /* 'transport' | ... */ }
```

`computeBreakdown` coerces missing/invalid numbers to 0 (Requirement 2.4). All rounding for display happens in the UI, not in the engine, to keep values consistent.

## Daily Logger Action Map (`client/src/lib/actions.js`)

Preset quick-add actions reuse engine factors so the dashboard updates without an API call. `deltaKg` is the weekly-equivalent impact (positive = adds emissions, negative = a reduction/saving). Examples:

| Action | category | deltaKg |
|---|---|---|
| Took the bus instead of car (10km) | transport | -1.0 |
| Ate vegetarian today | food | -2.3 |
| Worked from home | transport | -1.7 |
| AC on for 6 hrs | energy | +4.9 |
| Recycled / segregated waste | waste | -1.0 |
| Bought second-hand | shopping | -1.7 |

Stored exactly as posted; the weekly total is the sum of `delta_kg` over the trailing 7 days plus the baseline weekly from the profile breakdown.

## Data Models

### Database (`server/db.js`)

`better-sqlite3`, synchronous, file `server/ecopulse.sqlite` (created on first run). Schema:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  clientId TEXT PRIMARY KEY,
  city TEXT,
  quiz_answers TEXT,     -- JSON
  breakdown TEXT,        -- JSON
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clientId TEXT,
  date TEXT,             -- YYYY-MM-DD
  category TEXT,
  action TEXT,
  delta_kg REAL
);
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  payload TEXT,          -- JSON
  expires_at INTEGER     -- epoch ms
);
```

Prepared statements exported for upsert profile, get profile, insert log, get logs (last N days), and cache get/set. Coach results are cached in-process (Map with timestamp) per `clientId` for a few minutes (Requirement 5.5); live data uses the SQLite `cache` table (shared across restarts).

## Components and Interfaces

### Backend API Contract

All routes are mounted under `/api`. `clientId` comes from `X-Client-Id` header (falls back to body/param where noted). All external calls are wrapped in try/catch.

| Method | Route | Body / Params | Returns |
|---|---|---|---|
| POST | `/api/footprint` | `{answers, city}` | `{breakdown, totals, topCategory}` (upserts profile) |
| GET | `/api/footprint/:clientId` | – | saved `{city, answers, breakdown, totals, topCategory}` or 404 |
| POST | `/api/logs` | `{category, action, deltaKg}` | `{weeklyTotal, log}` |
| GET | `/api/logs/:clientId` | – | `{logs:[...], trend:[{date, total}], weeklyTotal}` |
| POST | `/api/coach` | – (reads stored breakdown) | `{tips:[{category,action,impact}×3], encouragement}` |
| POST | `/api/chat` | `{message}` | `{reply}` |
| GET | `/api/news?category=` | query | `{items:[{title,link,source,date}]}` |
| GET | `/api/local-resources?category=&city=` | query | `{items:[{title,link,snippet,domain}]}` |

### `/api/coach` behavior
1. Look up profile breakdown for `clientId`. If absent, use a neutral default breakdown.
2. Check per-client in-memory cache (TTL ~3 min) — return if fresh.
3. Call OpenAI with the verbatim EcoCoach system prompt and the breakdown JSON as the user message; request JSON response.
4. Parse and validate the shape (exactly 3 tips, encouragement < 25 words best-effort). On any error → return `FALLBACK_TIPS` (hardcoded, category-aware where possible).
5. Cache and return.

### `/api/chat` behavior
- Verbatim EcoBot system prompt, `gpt-4o-mini`, message from body. On error → `{reply: "<friendly fallback>"}`.

### `/api/news` and `/api/local-resources` behavior
- Build query from category (news) or category+city (resources).
- Cache key e.g. `news:transport` / `local:transport:Bengaluru`. If fresh cache → return it.
- Else call Serper (`/news` or `/search`) with `X-API-KEY` header. Map results to the return shape, store in cache with TTL (~30 min). On error → return last cached payload if any, else hardcoded fallback list.

## OpenAI Client (`server/openai.js`)

Uses the official `openai` SDK with `OPENAI_API_KEY`. Model `gpt-4o-mini`. `coach()` uses `response_format: { type: 'json_object' }` to force valid JSON. Both functions: if `process.env.OPENAI_API_KEY` is missing, immediately return the fallback (so the app runs with no key configured). Verbatim system prompts stored as constants:

- `COACH_SYSTEM_PROMPT` and `CHAT_SYSTEM_PROMPT` exactly as specified in the brief Section 8.

`FALLBACK_TIPS` (hardcoded, used on any failure):
```json
{
  "tips": [
    {"category":"transport","action":"Swap 2 car commutes this week for bus or cycling","impact":"~3 kg CO2e saved"},
    {"category":"food","action":"Make 3 dinners vegetarian this week","impact":"~5 kg CO2e saved"},
    {"category":"energy","action":"Set AC to 26°C and cut 1 hour of daily use","impact":"~4 kg CO2e saved"}
  ],
  "encouragement": "Small swaps add up fast — you've got this!"
}
```

## Serper Client (`server/serper.js`)

POSTs to `https://google.serper.dev/news` and `/search` with headers `X-API-KEY` + `Content-Type: application/json`, body `{ q, gl: 'in' }`. Query templates:

- news: transport→"transport emissions India news", energy→"renewable energy India news", food→"sustainable diet news", waste→"recycling waste management India news", shopping→"sustainable fashion India news".
- resources: transport→"EV charging stations near {city}", energy→"solar rooftop subsidy {city}", food→"organic local produce market {city}", waste→"recycling center near {city}", shopping→"second hand thrift store {city}".

Hardcoded fallback arrays for both, used when no key/no cache/error.

## Frontend

### State machine (`App.jsx`)
`view` ∈ {`landing`, `quiz`, `dashboard`}. On mount: ensure `clientId`; attempt `GET /api/footprint/:clientId` — if found, allow jumping to dashboard. Quiz submit → compute locally → set dashboard data → switch view → fire-and-forget POST.

### API wrapper (`lib/api.js`)
Single `request()` injecting `X-Client-Id` and base URL. In dev, Vite proxies `/api` to `http://localhost:5000`; in prod, same origin. Every call is `try/catch`; callers handle fallbacks.

### Components
- **Landing** — hero copy, problem statement, CTA, "view my dashboard" if profile exists.
- **Quiz** — 7-step (or single scroll) form with reference hints, validation-to-0, city field.
- **Dashboard** — composes FootprintHero, BreakdownCharts (Recharts donut + bar), ComparisonStrip, InsightsPanel, ActivityLogger; (P1) NewsPulse, LocalResources, Gamification, GoalCard, ChatWidget.
- **InsightsPanel** — calls `/api/coach`, shows `Skeleton` during load, renders 3 tips + encouragement, falls back silently.
- **ActivityLogger** — preset chips + custom add; posts log, refetches trend, renders Recharts line over 7 days; optimistic weekly-total update.

### Theme (`index.css` / `tailwind.config.js`)
Light theme only. Tokens:
- background `#FAF9F6` (warm off-white)
- surface `#FFFFFF` cards with soft shadow, rounded-2xl
- primary accent `#1B7F6E` (teal) / `#2F6B4F` (forest green) for CTAs + hero number + chart highlight
- secondary muted sand/amber `#E0B橙`-style muted (`#D9A86C`) for badges
- text charcoal `#2B2B2B`, never pure black
No dark mode, no neon, no glassmorphism.

## Build & Run

- Root `package.json` scripts:
  - `dev`: `concurrently "npm:dev:server" "npm:dev:client"`
  - `dev:server`: `nodemon server/index.js`
  - `dev:client`: `vite` (in client) — implemented as `npm --prefix client run dev`
  - `build`: `npm --prefix client run build`
  - `start`: `node server/index.js` (serves `client/dist` statically)
- Express: `cors()` in dev; if `client/dist` exists, `express.static` it and send `index.html` for non-`/api` routes.
- SQLite file auto-created by `db.js` on import.

## Correctness Properties

### Property 1: Determinism
For identical quiz answers, `computeBreakdown`/`computeTotals` SHALL return identical results on client and server (same shared constants).
**Validates: Requirements 3.1, 3.7**

### Property 2: No-NaN
Any missing or non-numeric input is coerced to 0; totals are always finite numbers ≥ 0.
**Validates: Requirements 2.4, 3.7**

### Property 3: Engine/logger consistency
Daily logger `deltaKg` values are derived from the same `FACTORS`, so dashboard updates stay consistent with the quiz baseline.
**Validates: Requirements 6.1, 6.2**

### Property 4: Graceful degradation
For every external call (OpenAI, Serper), a failure path returns a valid, schema-correct fallback; the UI never renders undefined/blank where data is expected.
**Validates: Requirements 5.4, 8.4, 9.3, 12.3, 15.4**

### Property 5: Identity isolation
All reads/writes are scoped to `clientId`; one user's logs or profile never leak into another's queries.
**Validates: Requirements 7.1, 7.2**

### Property 6: Cache safety
Expired cache entries are never returned as "fresh"; on live-call failure the last cached payload (even if expired) may be used as a fallback, clearly preferred over a hard error.
**Validates: Requirements 8.3, 8.4, 9.3**

## Error Handling

### Error Handling & Degradation
- Core loop (quiz→dashboard→logger) uses client compute + local state; fully functional offline of external APIs.
- Every OpenAI/Serper call wrapped in try/catch returning fallbacks.
- Missing env keys → fallbacks, not crashes.
- Frontend network errors → skeletons resolve into fallback content or friendly empty states.

## Testing Strategy
- Unit-test `shared/carbon.js` against the worked examples (commute, flights, electricity, LPG, diet, shopping, waste, totals, topCategory).
- Manual/integration check of each route with a sample `X-Client-Id` (footprint upsert+get, logs insert+trend, coach fallback when no key, news/resources fallback when no key).
- Smoke test the full loop in the browser with keys absent (must work) and present (must enrich).
