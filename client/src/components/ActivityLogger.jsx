import { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Plus, Check } from "lucide-react";
import { api } from "../lib/api.js";
import { PRESET_ACTIONS } from "../lib/actions.js";
import { round1 } from "../lib/format.js";
import Skeleton from "./Skeleton.jsx";

export default function ActivityLogger({ onLogged }) {
  const [trend, setTrend] = useState([]);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [justAdded, setJustAdded] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getLogs()
      .then((d) => {
        setTrend(d.trend || []);
        setWeeklyTotal(d.weeklyTotal || 0);
        onLogged?.(d.weeklyTotal || 0);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [onLogged]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (preset) => {
    setJustAdded(preset.action);
    setTimeout(() => setJustAdded(null), 1200);
    try {
      const res = await api.addLog(preset.category, preset.action, preset.deltaKg);
      setWeeklyTotal(res.weeklyTotal);
      onLogged?.(res.weeklyTotal);
      load();
    } catch {
      setError(true);
    }
  };

  const fmtDay = (d) => {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { weekday: "short" });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-lg">Daily activity log</h3>
        <span className="text-sm text-slate" aria-live="polite">
          7-day net:{" "}
          <b className={weeklyTotal <= 0 ? "text-teal" : "text-charcoal"}>
            {round1(weeklyTotal)} kg CO₂e
          </b>
        </span>
      </div>
      <p className="text-sm text-slate mb-4">
        Tap what you did today — your trend updates instantly.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {PRESET_ACTIONS.map((p) => (
          <button
            key={p.action}
            onClick={() => add(p)}
            className="chip"
            title={`${p.deltaKg > 0 ? "+" : ""}${p.deltaKg} kg`}
          >
            {justAdded === p.action ? (
              <Check className="h-4 w-4 text-teal" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {p.action}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : error ? (
        <p className="text-slate py-8 text-center">
          Couldn’t load your trend — log something to start.
        </p>
      ) : (
        <div
          className="h-48"
          role="img"
          aria-label="Line chart of your net carbon emissions over the last 7 days"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ left: -10, right: 10, top: 5 }}>
              <CartesianGrid stroke="#eee" vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(d) => new Date(d).toLocaleDateString()}
                formatter={(v) => [`${v} kg`, "net"]}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#1B7F6E"
                strokeWidth={3}
                dot={{ r: 4, fill: "#1B7F6E" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

ActivityLogger.propTypes = {
  onLogged: PropTypes.func,
};
