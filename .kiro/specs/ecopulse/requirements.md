# Requirements Document

## Introduction

EcoPulse is a zero-login web app that helps an individual understand, track, and reduce their personal carbon footprint. The core loop is: take a 2-minute 7-question quiz → see a results dashboard with totals, breakdowns, and reference comparisons → receive AI-personalized next actions → log daily activities that update a live weekly trend. Live, location-aware news and local resources (via real-time search) layer on top to turn awareness into a daily habit.

The system is a genuine three-tier architecture: React/Vite frontend, Express backend (the only component that talks to external APIs), and a file-based SQLite database. Identity is handled with a localStorage UUID sent as `X-Client-Id`, giving real per-user persistence with no auth UI. The app must degrade gracefully: the quiz → dashboard → logger loop works even if OpenAI and Serper are both down.

Priorities: **P0** is the core loop and must be complete and correct before anything else. **P1** adds live data, gamification, goals, and chat. **P2** is polish only if time remains.

## Glossary

- **clientId**: A UUID generated on first load, stored in localStorage, and sent as the `X-Client-Id` header. Used as the per-user primary key (no login).
- **Breakdown**: The five-category split of weekly emissions — transport, energy, food, waste, shopping — each in kg CO2e.
- **Top category**: The single highest-emitting category, used to drive AI coaching and live data queries.
- **Deterministic engine**: The shared, no-API carbon calculation module used identically on client and server.
- **Serper**: A real-time Google search API (`/search` and `/news`) used for live local resources and news.
- **EcoScore**: A 0–100 engagement/impact score computed from log history.

## Requirements

### Requirement 1: Landing Screen
**User Story:** As a first-time visitor, I want a clear landing screen explaining the problem and a single call-to-action, so that I immediately understand the value and how to start.

#### Acceptance Criteria
1. WHEN a user opens the app for the first time THEN the system SHALL display the problem statement and a primary "Calculate My Footprint" CTA.
2. WHEN the app loads AND no `clientId` exists in localStorage THEN the system SHALL generate a UUID and persist it as `clientId`.
3. WHEN a user clicks "Calculate My Footprint" THEN the system SHALL navigate to the onboarding quiz.
4. WHEN a user already has a saved profile THEN the system SHALL offer a path directly to their dashboard.
5. The landing screen SHALL follow the light-theme UI direction (warm off-white background, green/teal accent, no dark mode).

### Requirement 2: Onboarding Quiz
**User Story:** As a new user, I want a short 7-question quiz, so that I can estimate my footprint in about 2 minutes.

#### Acceptance Criteria
1. The quiz SHALL present exactly 7 questions: (Q1) commute mode + round-trip km/day + days/week, (Q2) domestic + international flight counts in the last year, (Q3) estimated monthly kWh, (Q4) LPG cylinders/month, (Q5) diet type, (Q6) shopping habits, (Q7) waste & recycling habits, plus a free-text city field.
2. WHEN a user submits the quiz THEN the system SHALL compute the footprint breakdown client-side immediately using the shared deterministic engine and navigate to the dashboard without waiting on the network.
3. WHEN the client-side calculation completes THEN the system SHALL fire-and-forget `POST /api/footprint` with the answers + city to persist authoritatively, without blocking the UI.
4. IF a required numeric field is empty THEN the system SHALL treat it as 0 rather than producing NaN.
5. Each question SHALL show the reference hints described in the calculation engine (e.g. small/medium/large home kWh).
6. The quiz SHALL be mobile-responsive and keyboard-navigable.

### Requirement 3: Carbon Calculation Engine
**User Story:** As a user, I want a consistent, transparent footprint estimate, so that I can trust the numbers without any external dependency.

#### Acceptance Criteria
1. The engine SHALL exist as a shared module with identical constants used on both client and server.
2. Transport weekly SHALL = (commute: km/day × days/week × mode factor) + (flights: (domestic×250 + international×900) ÷ 52). Mode factors: Car 0.17, Two-wheeler 0.07, Bus/Metro 0.07, Walk/Cycle 0, WFH 0.
3. Energy weekly SHALL = (monthly kWh × 0.82 ÷ 4.33) + (LPG cylinders/month × 42 ÷ 4.33).
4. Food weekly SHALL map diet: Heavy meat 30, Moderate meat 21, Vegetarian 14, Vegan 10.
5. Shopping weekly SHALL map: Rarely 2, Monthly 8, Weekly 20.
6. Waste weekly SHALL map: Always segregate 3, Sometimes 6, Never 10.
7. Weekly total SHALL = sum of the five categories; annualized SHALL = weekly × 52, shown in kg and tonnes.
8. The engine SHALL expose reference comparison values: India ≈1.9 t, World ≈4.7 t, EU ≈6.8 t, USA ≈14.9 t, Paris budget ≈2.0–2.3 t/year.
9. All displayed figures SHALL be labeled "estimated".

### Requirement 4: Results Dashboard
**User Story:** As a user, I want a clear dashboard of my footprint, so that I can see where my emissions come from and how I compare.

#### Acceptance Criteria
1. The dashboard SHALL display the weekly total and annualized total (kg and tonnes) with the annual hero number visually emphasized.
2. The dashboard SHALL render a donut chart and a bar chart of the five-category breakdown (transport, energy, food, waste, shopping).
3. The dashboard SHALL render a comparison strip against the reference averages from Requirement 3.8.
4. WHEN the dashboard loads AND a `clientId` profile exists on the server THEN the system MAY hydrate from `GET /api/footprint/:clientId`; the dashboard SHALL still render from client-computed values if the server is unavailable.
5. The dashboard SHALL identify and surface the user's highest-emission category (used by AI and live features).

### Requirement 5: AI Insights Panel
**User Story:** As a user, I want personalized, concrete next actions, so that I know what to do this week instead of generic advice.

#### Acceptance Criteria
1. WHEN the dashboard renders THEN the system SHALL call `POST /api/coach` and show a loading skeleton during the round trip.
2. The backend SHALL build the prompt from the stored breakdown and call OpenAI `gpt-4o-mini` with the exact EcoCoach system prompt.
3. The response SHALL contain exactly 3 ranked tips (each with `category`, `action`, `impact`) and one `encouragement` line under 25 words.
4. IF the OpenAI call fails for any reason OR returns invalid JSON THEN the system SHALL display a hardcoded 3-tip fallback and SHALL NOT show a blank or broken state.
5. The backend SHALL cache the coach result per `clientId` for a few minutes to avoid repeated spend.

### Requirement 6: Daily Activity Logger
**User Story:** As a returning user, I want to quickly log daily activities, so that my footprint stays current and I build a habit.

#### Acceptance Criteria
1. The logger SHALL provide a quick-add form with preset actions (e.g. "Took the bus today", "Ate vegetarian", "AC on for 6 hrs") that map to a category and a `deltaKg` using the same engine factors.
2. WHEN a user adds a log THEN the system SHALL `POST /api/logs` and update the running weekly total.
3. The system SHALL render a 7-day trend line chart from `GET /api/logs/:clientId`.
4. IF the logs request fails THEN the logger SHALL show a friendly empty/error state rather than crashing.
5. Logs SHALL be dated to "today" on insert and associated with the `clientId` from the header.

### Requirement 7: Persistence and Identity
**User Story:** As a user, I want my data to persist across visits without signing up, so that I can return and continue tracking.

#### Acceptance Criteria
1. The frontend SHALL send `X-Client-Id` on every backend request.
2. The backend SHALL use `clientId` as the primary key for the user's `profiles` row and as the foreign key for `logs`.
3. The SQLite database file SHALL be created automatically on first run with no manual setup.
4. `POST /api/footprint` SHALL upsert (insert or replace) the profile keyed by `clientId`.

### Requirement 8: Live Sustainability Pulse
**User Story:** As a user, I want fresh, relevant news about my top emission category, so that the app feels live and connected to the real world.

#### Acceptance Criteria
1. WHEN the dashboard loads THEN the system SHALL call `GET /api/news?category=<top category>`.
2. The backend SHALL build a category-appropriate query and call Serper `/news`, returning the 3 most recent headlines (title + link + source + date).
3. The backend SHALL cache results in the SQLite `cache` table keyed by category with ~30 minute TTL.
4. IF the live call fails THEN the system SHALL fall back to the last cached batch, OR to 3 hardcoded headlines if nothing is cached.

### Requirement 9: Local Eco Resources Finder
**User Story:** As a user, I want real, nearby resources tied to my top category and city, so that I can act on advice immediately.

#### Acceptance Criteria
1. The system SHALL map the top category to a query template using the user's city (transport→EV charging, energy→solar rooftop subsidy, food→organic produce market, waste→recycling center, shopping→thrift store).
2. WHEN requested THEN the backend SHALL call `GET /api/local-resources?category=&city=` → Serper `/search` and return the top 3–5 organic results as link cards (title, snippet, domain).
3. The backend SHALL use the same cache + fallback pattern as Requirement 8.

### Requirement 10: Gamification
**User Story:** As a user, I want scores, streaks, and badges, so that staying engaged feels rewarding.

#### Acceptance Criteria
1. The system SHALL compute an EcoScore (0–100) from log history.
2. The system SHALL display a streak counter based on consecutive days with logs.
3. The system SHALL define 4–5 unlockable badges with clear criteria and display locked/unlocked state.

### Requirement 11: Goal Setting
**User Story:** As a user, I want to set a reduction goal, so that I can track progress over the month.

#### Acceptance Criteria
1. The system SHALL let the user set "Reduce footprint by X% this month".
2. The system SHALL display a progress bar reflecting current progress toward the goal.

### Requirement 12: AI Chat Widget (Ask EcoBot)
**User Story:** As a user, I want to ask climate questions, so that I can learn without leaving the app.

#### Acceptance Criteria
1. The widget SHALL `POST /api/chat` with `{message}` and render `{reply}`.
2. The backend SHALL use the exact EcoBot system prompt and `gpt-4o-mini`.
3. IF the call fails THEN the widget SHALL show a graceful fallback message.

### Requirement 13: Shareable Results Card

**User Story:** As a user, I want to share my results as an image, so that I can post my footprint and invite others.

#### Acceptance Criteria
1. The system SHALL render the results to a canvas/image the user can download/share.

### Requirement 14: Micro-animations

**User Story:** As a user, I want subtle motion on key numbers and charts, so that the app feels polished and alive.

#### Acceptance Criteria
1. The system MAY add subtle animations on the hero number and chart transitions. Light theme only; no dark mode toggle.

### Requirement 15: Non-Functional Requirements

**User Story:** As a judge/demo operator, I want the app to start with one command and never show a broken state, so that I can try it cold and reliably.

#### Acceptance Criteria
1. One root command (`npm run dev`) SHALL start client + server concurrently.
2. No manual DB setup; SQLite file created on first run.
3. No sign-up/login.
4. The quiz → dashboard → logger loop SHALL work even if OpenAI and Serper are down; only Insights, Pulse, and Local Resources depend on them and all degrade gracefully.
5. Loading skeletons SHALL appear wherever there is a network round trip.
6. CORS SHALL be enabled on Express for local dev; in production Express SHALL serve the built client as static files on one port.
7. OpenAI and Serper SHALL only be called from the backend; keys SHALL never reach the browser.
8. The UI SHALL follow the light-theme direction in Section 10 of the brief.
9. The repo SHALL include a README per Section 12 and a `.env.example` (never commit real keys).
