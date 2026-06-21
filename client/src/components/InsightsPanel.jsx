import { useEffect, useState } from "react";
import { Sparkles, TrendingDown } from "lucide-react";
import { api } from "../lib/api.js";
import { CATEGORY_META } from "../lib/format.js";
import Skeleton from "./Skeleton.jsx";

export default function InsightsPanel({ refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .coach()
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null)) // server already returns fallback; null = render nothing extra
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-teal" />
        <h3 className="font-bold text-lg">Your AI action plan</h3>
      </div>
      <p className="text-sm text-slate mb-4">
        Concrete moves you can make this week, ranked by impact.
      </p>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : data ? (
        <>
          <ol className="space-y-3">
            {data.tips.map((t, i) => {
              const meta = CATEGORY_META[t.category] || { label: t.category, color: "#1B7F6E" };
              return (
                <li key={i} className="flex gap-3 rounded-xl bg-cream p-3">
                  <span
                    className="h-7 w-7 shrink-0 rounded-full text-white text-sm font-bold flex items-center justify-center"
                    style={{ background: meta.color }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-charcoal">{t.action}</p>
                    <p className="text-sm text-slate inline-flex items-center gap-1 mt-0.5">
                      <TrendingDown className="h-3.5 w-3.5 text-teal" />
                      {t.impact} · {meta.label}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          {data.encouragement && (
            <p className="mt-4 text-teal font-medium italic">“{data.encouragement}”</p>
          )}
        </>
      ) : (
        <p className="text-slate">Tips are taking a break — try again in a moment.</p>
      )}
    </div>
  );
}
