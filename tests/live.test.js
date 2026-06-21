import { describe, it, expect, beforeAll } from "vitest";

// Isolated in-memory DB; ensure no Serper key so we exercise the fallback paths.
process.env.ECOPULSE_DB_PATH = ":memory:";
delete process.env.SERPER_API_KEY;

let cache;
let serper;
beforeAll(async () => {
  cache = await import("../server/cache.js");
  serper = await import("../server/serper.js");
});

describe("cache (TTL behavior)", () => {
  it("returns fresh for unexpired entries and miss for absent keys", () => {
    cache.cacheSet("k1", { hello: "world" }, 60_000);
    const hit = cache.cacheGet("k1");
    expect(hit.fresh).toBe(true);
    expect(hit.payload).toEqual({ hello: "world" });

    const miss = cache.cacheGet("does-not-exist");
    expect(miss.fresh).toBe(false);
    expect(miss.payload).toBeNull();
  });

  it("marks expired entries as not fresh but still returns the stale payload", () => {
    cache.cacheSet("k2", { v: 1 }, -1); // already expired
    const res = cache.cacheGet("k2");
    expect(res.fresh).toBe(false);
    expect(res.payload).toEqual({ v: 1 }); // available as a fallback
  });
});

describe("serper fallbacks (no API key)", () => {
  it("news() returns 3 hardcoded headlines", async () => {
    const items = await serper.news("transport");
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(3);
    expect(items[0]).toHaveProperty("title");
    expect(items[0]).toHaveProperty("link");
  });

  it("localResources() returns hardcoded resource cards", async () => {
    const items = await serper.localResources("energy", "Bengaluru");
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toHaveProperty("title");
    expect(items[0]).toHaveProperty("domain");
  });

  it("defaults an unknown category without throwing", async () => {
    const items = await serper.news("not-a-real-category");
    expect(items.length).toBe(3);
  });
});
