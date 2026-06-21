import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { CATEGORY_META, round1 } from "../lib/format.js";

export default function BreakdownCharts({ breakdown }) {
  const data = Object.keys(CATEGORY_META).map((key) => ({
    key,
    name: CATEGORY_META[key].label,
    value: round1(breakdown?.[key] || 0),
    color: CATEGORY_META[key].color,
  }));
  const hasData = data.some((d) => d.value > 0);

  return (
    <div className="card">
      <h3 className="font-bold text-lg mb-1">Weekly breakdown</h3>
      <p className="text-sm text-slate mb-4">kg CO₂e per week by category (estimated)</p>

      {!hasData ? (
        <p className="text-slate py-10 text-center">No emissions data yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div
            className="h-56"
            role="img"
            aria-label={`Donut chart of weekly emissions: ${data
              .map((d) => `${d.name} ${d.value} kg`)
              .join(", ")}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {data.map((d) => (
                    <Cell key={d.key} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v} kg`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="h-56" role="img" aria-label="Bar chart of weekly emissions by category">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `${v} kg`} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {data.map((d) => (
                    <Cell key={d.key} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-4">
        {data.map((d) => (
          <span key={d.key} className="inline-flex items-center gap-1.5 text-sm text-slate">
            <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
            {d.name}: <b className="text-charcoal">{d.value} kg</b>
          </span>
        ))}
      </div>
    </div>
  );
}
