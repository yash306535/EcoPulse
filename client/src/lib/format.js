export const CATEGORY_META = {
  transport: { label: "Transport", color: "#1B7F6E" },
  energy: { label: "Energy", color: "#2F6B4F" },
  food: { label: "Food", color: "#D9A86C" },
  waste: { label: "Waste", color: "#7BB59A" },
  shopping: { label: "Shopping", color: "#C98A4B" },
};

export function kg(n) {
  return `${Math.round(Number(n) || 0)} kg`;
}

export function tonnes(n) {
  return `${(Number(n) || 0).toFixed(2)} t`;
}

export function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}
