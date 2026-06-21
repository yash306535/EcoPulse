import { describe, it, expect } from "vitest";
import {
  FACTORS,
  REFERENCES,
  CATEGORIES,
  computeBreakdown,
  computeTotals,
  topCategory,
} from "../shared/carbon.js";

const round = (n, p = 4) => Math.round(n * 10 ** p) / 10 ** p;

describe("computeBreakdown — transport", () => {
  it("computes solo car commute weekly emissions", () => {
    const b = computeBreakdown({
      commuteMode: "car",
      kmPerDay: 20,
      daysPerWeek: 5,
    });
    // 20 * 5 * 0.17 = 17
    expect(round(b.transport)).toBe(17);
  });

  it("treats walk/cycle and WFH as zero transport", () => {
    expect(
      computeBreakdown({ commuteMode: "walkCycle", kmPerDay: 50, daysPerWeek: 7 }).transport
    ).toBe(0);
    expect(computeBreakdown({ commuteMode: "wfh", kmPerDay: 50, daysPerWeek: 7 }).transport).toBe(
      0
    );
  });

  it("adds annualized flights to transport (divided by 52)", () => {
    const b = computeBreakdown({
      commuteMode: "wfh",
      flightsDomestic: 2,
      flightsIntl: 1,
    });
    // (2*250 + 1*900) / 52 = 1400/52
    expect(round(b.transport)).toBe(round(1400 / 52));
  });

  it("uses the two-wheeler / bus factor of 0.07", () => {
    const b = computeBreakdown({ commuteMode: "twoWheeler", kmPerDay: 10, daysPerWeek: 5 });
    expect(round(b.transport)).toBe(round(10 * 5 * 0.07));
  });
});

describe("computeBreakdown — energy", () => {
  it("computes electricity from monthly kWh at the grid factor", () => {
    const b = computeBreakdown({ monthlyKwh: 300 });
    // 300 * 0.82 / 4.33
    expect(round(b.energy)).toBe(round((300 * 0.82) / 4.33));
  });

  it("adds LPG cylinders to energy", () => {
    const b = computeBreakdown({ monthlyKwh: 0, lpgPerMonth: 1 });
    expect(round(b.energy)).toBe(round((1 * 42) / 4.33));
  });
});

describe("computeBreakdown — diet/shopping/waste lookups", () => {
  it("maps diet types to weekly values", () => {
    expect(computeBreakdown({ diet: "heavy" }).food).toBe(30);
    expect(computeBreakdown({ diet: "moderate" }).food).toBe(21);
    expect(computeBreakdown({ diet: "vegetarian" }).food).toBe(14);
    expect(computeBreakdown({ diet: "vegan" }).food).toBe(10);
  });

  it("maps shopping habits", () => {
    expect(computeBreakdown({ shopping: "rarely" }).shopping).toBe(2);
    expect(computeBreakdown({ shopping: "monthly" }).shopping).toBe(8);
    expect(computeBreakdown({ shopping: "weekly" }).shopping).toBe(20);
  });

  it("maps waste habits", () => {
    expect(computeBreakdown({ waste: "always" }).waste).toBe(3);
    expect(computeBreakdown({ waste: "sometimes" }).waste).toBe(6);
    expect(computeBreakdown({ waste: "never" }).waste).toBe(10);
  });
});

describe("robustness — no NaN (Property 2)", () => {
  it("coerces missing/invalid inputs to 0", () => {
    const b = computeBreakdown({});
    for (const c of CATEGORIES) {
      expect(Number.isFinite(b[c])).toBe(true);
    }
    expect(b.transport).toBe(0);
    expect(b.energy).toBe(0);
  });

  it("handles garbage string inputs without producing NaN", () => {
    const b = computeBreakdown({
      commuteMode: "rocket",
      kmPerDay: "abc",
      daysPerWeek: null,
      monthlyKwh: undefined,
      diet: "carnivore",
    });
    const t = computeTotals(b);
    expect(Number.isFinite(t.weekly)).toBe(true);
    expect(t.weekly).toBe(0);
  });
});

describe("computeTotals", () => {
  it("sums categories and annualizes weekly × 52", () => {
    const breakdown = { transport: 10, energy: 20, food: 21, waste: 6, shopping: 8 };
    const t = computeTotals(breakdown);
    expect(t.weekly).toBe(65);
    expect(t.annualKg).toBe(65 * 52);
    expect(round(t.annualTonnes)).toBe(round((65 * 52) / 1000));
  });

  it("is deterministic for identical input (Property 1)", () => {
    const answers = {
      commuteMode: "car",
      kmPerDay: 20,
      daysPerWeek: 5,
      monthlyKwh: 300,
      diet: "moderate",
    };
    const a = computeTotals(computeBreakdown(answers));
    const b = computeTotals(computeBreakdown(answers));
    expect(a).toEqual(b);
  });
});

describe("topCategory", () => {
  it("returns the highest-emitting category", () => {
    expect(topCategory({ transport: 5, energy: 50, food: 21, waste: 6, shopping: 8 })).toBe(
      "energy"
    );
    expect(topCategory({ transport: 99, energy: 1, food: 1, waste: 1, shopping: 1 })).toBe(
      "transport"
    );
  });

  it("returns a valid category even for empty input", () => {
    expect(CATEGORIES).toContain(topCategory({}));
  });
});

describe("constants sanity", () => {
  it("exposes the documented reference comparisons", () => {
    expect(REFERENCES.india).toBe(1.9);
    expect(REFERENCES.usa).toBe(14.9);
    expect(FACTORS.grid).toBe(0.82);
  });
});
