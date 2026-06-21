import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

// Use an isolated in-memory DB for the API tests (must be set before importing the app).
process.env.ECOPULSE_DB_PATH = ":memory:";

let app;
beforeAll(async () => {
  const { createApp } = await import("../server/app.js");
  app = createApp();
});

const CID = "test-client-1";

describe("GET /api/health", () => {
  it("responds ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe("POST /api/footprint", () => {
  it("rejects requests without X-Client-Id", async () => {
    const res = await request(app).post("/api/footprint").send({ answers: {}, city: "X" });
    expect(res.status).toBe(400);
  });

  it("computes and persists a breakdown", async () => {
    const res = await request(app)
      .post("/api/footprint")
      .set("X-Client-Id", CID)
      .send({
        answers: {
          commuteMode: "car",
          kmPerDay: 20,
          daysPerWeek: 5,
          monthlyKwh: 300,
          diet: "moderate",
          shopping: "monthly",
          waste: "sometimes",
        },
        city: "Bengaluru",
      });
    expect(res.status).toBe(200);
    expect(res.body.breakdown.transport).toBeCloseTo(17, 3);
    expect(res.body.totals.weekly).toBeGreaterThan(0);
    expect(res.body.topCategory).toBeDefined();
  });

  it("sanitizes out-of-range and unknown enum inputs", async () => {
    const res = await request(app)
      .post("/api/footprint")
      .set("X-Client-Id", "test-sanitize")
      .send({
        answers: { commuteMode: "hovercraft", kmPerDay: -999, daysPerWeek: 999, diet: "carnivore" },
        city: "x".repeat(500),
      });
    expect(res.status).toBe(200);
    // negative km clamped to 0, unknown enums fall back -> finite totals
    expect(Number.isFinite(res.body.totals.weekly)).toBe(true);
    expect(res.body.city.length).toBeLessThanOrEqual(80);
  });
});

describe("GET /api/footprint/:clientId", () => {
  it("returns the persisted profile", async () => {
    const res = await request(app).get(`/api/footprint/${CID}`);
    expect(res.status).toBe(200);
    expect(res.body.city).toBe("Bengaluru");
    expect(res.body.breakdown).toBeDefined();
  });

  it("404s for an unknown client", async () => {
    const res = await request(app).get("/api/footprint/nobody-here");
    expect(res.status).toBe(404);
  });
});

describe("logs flow", () => {
  it("adds a log and updates the weekly total", async () => {
    const res = await request(app)
      .post("/api/logs")
      .set("X-Client-Id", CID)
      .send({ category: "transport", action: "Took the bus", deltaKg: -1.5 });
    expect(res.status).toBe(200);
    expect(res.body.weeklyTotal).toBeCloseTo(-1.5, 3);
  });

  it("clamps an absurd deltaKg and whitelists category", async () => {
    const res = await request(app)
      .post("/api/logs")
      .set("X-Client-Id", "test-clamp")
      .send({ category: "definitely-not-real", action: "x", deltaKg: 999999 });
    expect(res.status).toBe(200);
    expect(res.body.log.category).toBe("other");
    expect(res.body.log.delta_kg).toBeLessThanOrEqual(1000);
  });

  it("returns a 7-day trend with weekly total", async () => {
    const res = await request(app).get(`/api/logs/${CID}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.trend)).toBe(true);
    expect(res.body.trend.length).toBe(7);
  });

  it("isolates logs per client (Property 5)", async () => {
    const res = await request(app).get(`/api/logs/test-clamp`);
    // test-clamp only has its own single log, not CID's
    expect(res.body.logs.every((l) => l.clientId === "test-clamp")).toBe(true);
  });
});

describe("security headers", () => {
  it("sets helmet headers and a content security policy", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["content-security-policy"]).toBeDefined();
  });
});
