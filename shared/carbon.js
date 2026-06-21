// EcoPulse — deterministic carbon calculation engine.
// Single source of truth shared by client (instant feedback) and server (authoritative).
// No external API, ever. All figures are illustrative reference values.

export const FACTORS = {
  commute: { car: 0.17, twoWheeler: 0.07, busMetro: 0.07, walkCycle: 0, wfh: 0 }, // kg CO2e / km
  flight: { domestic: 250, international: 900 }, // kg CO2e / flight (annual)
  grid: 0.82, // kg CO2e / kWh (India grid average)
  lpgCylinder: 42, // kg CO2e / 14.2kg cylinder
  weeksPerMonth: 4.33,
  diet: { heavy: 30, moderate: 21, vegetarian: 14, vegan: 10 }, // weekly kg CO2e
  shopping: { rarely: 2, monthly: 8, weekly: 20 }, // weekly kg CO2e
  waste: { always: 3, sometimes: 6, never: 10 }, // weekly kg CO2e
};

// tonnes CO2e / year reference comparisons (approximate)
export const REFERENCES = {
  india: 1.9,
  world: 4.7,
  eu: 6.8,
  usa: 14.9,
  parisLow: 2.0,
  parisHigh: 2.3,
};

export const CATEGORIES = ["transport", "energy", "food", "waste", "shopping"];

// Coerce any missing/invalid input to a finite number (defaults to 0).
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * answers shape:
 * {
 *   commuteMode: 'car'|'twoWheeler'|'busMetro'|'walkCycle'|'wfh',
 *   kmPerDay, daysPerWeek,
 *   flightsDomestic, flightsIntl,
 *   monthlyKwh, lpgPerMonth,
 *   diet: 'heavy'|'moderate'|'vegetarian'|'vegan',
 *   shopping: 'rarely'|'monthly'|'weekly',
 *   waste: 'always'|'sometimes'|'never',
 *   city
 * }
 * Returns weekly kg CO2e per category.
 */
export function computeBreakdown(a = {}) {
  const commuteFactor = FACTORS.commute[a.commuteMode] ?? 0;
  const commuteWeekly = num(a.kmPerDay) * num(a.daysPerWeek) * commuteFactor;
  const flightsWeekly =
    (num(a.flightsDomestic) * FACTORS.flight.domestic +
      num(a.flightsIntl) * FACTORS.flight.international) /
    52;
  const transport = commuteWeekly + flightsWeekly;

  const electricityWeekly = (num(a.monthlyKwh) * FACTORS.grid) / FACTORS.weeksPerMonth;
  const lpgWeekly = (num(a.lpgPerMonth) * FACTORS.lpgCylinder) / FACTORS.weeksPerMonth;
  const energy = electricityWeekly + lpgWeekly;

  const food = FACTORS.diet[a.diet] ?? 0;
  const shopping = FACTORS.shopping[a.shopping] ?? 0;
  const waste = FACTORS.waste[a.waste] ?? 0;

  return { transport, energy, food, waste, shopping };
}

export function computeTotals(breakdown = {}) {
  const weekly = CATEGORIES.reduce((sum, c) => sum + num(breakdown[c]), 0);
  const annualKg = weekly * 52;
  const annualTonnes = annualKg / 1000;
  return { weekly, annualKg, annualTonnes };
}

export function topCategory(breakdown = {}) {
  let top = CATEGORIES[0];
  let max = -Infinity;
  for (const c of CATEGORIES) {
    const v = num(breakdown[c]);
    if (v > max) {
      max = v;
      top = c;
    }
  }
  return top;
}
