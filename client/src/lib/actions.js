// Daily logger preset actions. deltaKg = weekly-equivalent impact in kg CO2e.
// Negative = a saving/reduction, positive = added emissions.
// Derived from the same engine factors for consistency with the quiz baseline.
export const PRESET_ACTIONS = [
  { action: "Took the bus instead of driving", category: "transport", deltaKg: -1.0, icon: "Bus" },
  { action: "Worked from home today", category: "transport", deltaKg: -1.7, icon: "House" },
  {
    action: "Cycled / walked instead of driving",
    category: "transport",
    deltaKg: -1.7,
    icon: "Bike",
  },
  { action: "Ate vegetarian today", category: "food", deltaKg: -2.3, icon: "Salad" },
  { action: "Ate vegan today", category: "food", deltaKg: -2.9, icon: "Leaf" },
  { action: "Segregated & recycled waste", category: "waste", deltaKg: -1.0, icon: "Recycle" },
  {
    action: "Bought second-hand instead of new",
    category: "shopping",
    deltaKg: -1.7,
    icon: "ShoppingBag",
  },
  { action: "Ran AC for 6+ hours", category: "energy", deltaKg: 4.9, icon: "Snowflake" },
  { action: "Long solo car trip", category: "transport", deltaKg: 5.0, icon: "Car" },
];
