import { tonnes, kg } from "../lib/format.js";

/**
 * Hero panel showing the headline annual footprint in tonnes plus weekly/annual context.
 * @param {{ totals: { weekly?: number, annualKg?: number, annualTonnes?: number } }} props
 */
export default function FootprintHero({ totals }) {
  const { weekly = 0, annualKg = 0, annualTonnes = 0 } = totals || {};
  return (
    <div className="card text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate">
        Your estimated annual footprint
      </p>
      <div className="countpop my-2">
        <span className="text-6xl md:text-7xl font-extrabold text-teal tracking-tight">
          {annualTonnes.toFixed(2)}
        </span>
        <span className="text-2xl font-bold text-teal ml-2">t CO₂e</span>
      </div>
      <p className="text-slate">
        ≈ {kg(annualKg)} / year · {kg(weekly)} / week · {tonnes(annualTonnes)} / year
      </p>
    </div>
  );
}
