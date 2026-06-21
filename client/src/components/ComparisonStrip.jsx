import { REFERENCES } from "@shared/carbon.js";

const ROWS = [
  { key: "you", label: "You", color: "#1B7F6E" },
  { key: "parisHigh", label: "Paris target", value: REFERENCES.parisHigh, color: "#7BB59A" },
  { key: "india", label: "India avg", value: REFERENCES.india, color: "#D9A86C" },
  { key: "world", label: "World avg", value: REFERENCES.world, color: "#C98A4B" },
  { key: "eu", label: "EU avg", value: REFERENCES.eu, color: "#9A8B7A" },
  { key: "usa", label: "USA avg", value: REFERENCES.usa, color: "#B05B4B" },
];

export default function ComparisonStrip({ annualTonnes = 0 }) {
  const rows = ROWS.map((r) => ({ ...r, value: r.key === "you" ? annualTonnes : r.value }));
  const max = Math.max(...rows.map((r) => r.value), REFERENCES.usa);

  return (
    <div className="card">
      <h3 className="font-bold text-lg mb-1">How you compare</h3>
      <p className="text-sm text-slate mb-4">Annual tonnes CO₂e per person (approximate)</p>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-3">
            <span
              className={`w-24 text-sm ${r.key === "you" ? "font-bold text-teal" : "text-slate"}`}
            >
              {r.label}
            </span>
            <div className="flex-1 bg-cream rounded-full h-5 overflow-hidden">
              <div
                className="h-full rounded-full flex items-center justify-end pr-2 text-[11px] font-semibold text-white"
                style={{ width: `${Math.max((r.value / max) * 100, 6)}%`, background: r.color }}
              >
                {r.value.toFixed(1)}t
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
