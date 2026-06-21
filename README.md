# 🌱 EcoPulse

**Know your carbon footprint. Shrink it, one day at a time.**

A zero-login web app that helps anyone understand, track, and reduce their personal carbon footprint through a 2-minute quiz, a daily activity log, AI-generated personalized action plans, and live, location-aware suggestions pulled from real-time search.

---

## Problem Statement

Most people have no idea what their actual carbon footprint is, generic "go green" advice doesn't tell them what to do today, and existing calculators are one-time, static, and forgettable. EcoPulse turns footprint awareness into a daily habit loop with AI-personalized next actions and real, live, nearby resources instead of vague tips.

## Solution Overview

EcoPulse pairs a deterministic carbon-calculation engine with two independent live integrations:

- A **personalized AI coach** (OpenAI `gpt-4o-mini`) that reads your category breakdown and returns 3 concrete, do-this-week actions ranked by impact.
- A **live Serper layer** that surfaces fresh news and real, nearby resources tied to your single biggest emission source.

The core loop — quiz → dashboard → daily logger — works fully even if both external APIs are down. AI and live features degrade gracefully to cached data or hardcoded fallbacks, so the app never shows a blank or broken state.

## Key Features

- **Landing → 7-question quiz** with instant client-side results, persisted to the backend in the background.
- **Results dashboard**: emphasized annual footprint, donut + bar category breakdown, and a comparison strip vs. India / World / EU / USA / Paris-budget reference averages.
- **AI Insights panel**: 3 ranked, concrete actions + an encouraging line, with a loading skeleton and a hardcoded 3-tip fallback.
- **Daily activity logger**: quick-add presets that update a running 7-day net total and trend line in real time using the same engine factors.
- **Live Sustainability Pulse** (Serper `/news`): 3 fresh headlines for your top category, cached ~30 min.
- **Local Eco Resources** (Serper `/search`): real, nearby, clickable resources tied to your top category + city.
- **Gamification**: EcoScore (0–100), streak counter, and 5 unlockable badges.
- **Goal setting**: "reduce by X% this month" with a live progress bar.
- **Ask EcoBot**: an AI chat widget for carbon-literacy questions.

## Tech Stack

- **Frontend**: React + Vite, Tailwind CSS, Recharts, lucide-react
- **Backend**: Node.js + Express (owns all persistence + all external API calls)
- **Database**: SQLite via `better-sqlite3` (file-based, zero setup)
- **AI**: OpenAI API, model `gpt-4o-mini` (backend only)
- **Live data**: Serper API `/search` + `/news` (backend only)

## Architecture

React frontend → HTTP (with an `X-Client-Id` header) → Express backend → three things: (1) a SQLite file for all persistence, (2) the OpenAI API for personalized insights and chat, and (3) the Serper API for live news and local-resource search. The backend is the only component that ever talks to OpenAI or Serper, so API keys never reach the browser. Identity is a UUID generated on first load and stored in `localStorage`, sent as `X-Client-Id` and used as the per-user primary key in SQLite — real per-user persistence with zero auth UI.

```
React (Vite) ──HTTP + X-Client-Id──▶ Express
                                       ├─▶ SQLite (profiles, logs, cache)
                                       ├─▶ OpenAI gpt-4o-mini (coach, chat)
                                       └─▶ Serper (/news, /search)
```

## Setup & Run

```bash
# 1. Install (also installs the client via postinstall)
npm install

# 2. Add your keys (optional — the app runs with fallbacks if absent)
cp .env.example .env
#   then edit .env and fill OPENAI_API_KEY / SERPER_API_KEY

# 3. Dev: starts Express (nodemon) + Vite client concurrently
npm run dev
#   client: http://localhost:5173  (proxies /api to the server)
#   server: http://localhost:5000

# Production: build the client, then serve everything from one port
npm run build
npm start
#   open http://localhost:5000
```

The SQLite database file (`server/ecopulse.sqlite`) is created automatically on first run — no manual setup.

## Testing

Unit and integration tests run with [Vitest](https://vitest.dev) + Supertest:

```bash
npm test          # run once
npm run test:watch
```

- `tests/carbon.test.js` — exhaustive coverage of the deterministic engine: every Q1–Q7 formula, annualization, `topCategory`, determinism, and no-NaN robustness against garbage input.
- `tests/api.test.js` — integration tests against the Express app on an isolated in-memory SQLite DB: footprint compute/persist/retrieve, input sanitization + clamping, per-client log isolation, the 7-day trend, and security headers.

The API tests use `ECOPULSE_DB_PATH=":memory:"` so they never touch your real data and require no API keys.

## Security

- **No secrets in the browser**: OpenAI and Serper are only ever called server-side; keys live in `.env` (gitignored).
- **Hardened HTTP headers** via `helmet`, including a tuned Content-Security-Policy, HSTS, `X-Content-Type-Options: nosniff`, and `X-Frame-Options`.
- **Rate limiting** (`express-rate-limit`) on the `/api` surface.
- **Input validation & sanitization**: quiz answers are clamped to sane ranges and enums are whitelisted; log entries clamp `deltaKg` and whitelist categories; request bodies are size-capped (64 kb).
- **Per-user isolation**: all reads/writes are scoped to the `X-Client-Id`.
- **No leaked stack traces**: a centralized error handler returns generic messages.
- Production dependencies carry no known vulnerabilities (`npm audit`); the only advisories are in dev-only build/test tooling that never ships.

## Accessibility

- Semantic landmarks (`header`/`main`/`footer`), a "skip to content" link, and visible keyboard focus outlines.
- All form inputs are associated with labels; the quiz uses `fieldset`/`legend` and ARIA `radiogroup` semantics.
- Charts expose text alternatives via `role="img"` + `aria-label`, with a textual legend.
- Icon-only buttons have `aria-label`s; decorative icons are `aria-hidden`; dynamic regions use `aria-live`.

## Environment Variables

Backend only, in `.env` (never committed):

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | AI coach + chat. If absent, hardcoded fallbacks are used. |
| `SERPER_API_KEY` | Live news + local resources. If absent, cached/hardcoded fallbacks are used. |
| `PORT` | Server port (default `5000`). |

## Screenshots

_Placeholder — add screenshots of the landing, quiz, and dashboard here._

## Demo Video

_Placeholder — add demo video link here._

## Future Scope

- Real authentication and multi-device sync
- Country-specific grid factors and localized reference averages
- Push notifications for streaks and goals
- Historical analytics and month-over-month trends

## Built With / Team

Built with React, Vite, Tailwind CSS, Express, SQLite, OpenAI, and Serper.

_Add your team members here._

---

> All figures are illustrative reference values typical of consumer carbon calculators and are labeled "estimated" in the UI — they are for awareness, not audited measurement.
