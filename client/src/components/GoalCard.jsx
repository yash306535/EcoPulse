import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Target } from "lucide-react";

const KEY = "ecopulse_goal";

export default function GoalCard({ weeklyBaseline = 0, weeklyNet = 0 }) {
  const [percent, setPercent] = useState(() => {
    const saved = localStorage.getItem(KEY);
    return saved ? Number(saved) : 10;
  });

  useEffect(() => {
    localStorage.setItem(KEY, String(percent));
  }, [percent]);

  // Progress: how much of the targeted weekly reduction the user's net savings cover.
  const targetReductionKg = (weeklyBaseline * percent) / 100;
  const achievedKg = Math.max(0, -weeklyNet); // negative net = savings
  const progress =
    targetReductionKg > 0 ? Math.min(100, Math.round((achievedKg / targetReductionKg) * 100)) : 0;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-5 w-5 text-teal" />
        <h3 className="font-bold text-lg">Monthly goal</h3>
      </div>

      <label className="label" htmlFor="goal-percent">
        Reduce my footprint by
      </label>
      <div className="flex items-center gap-3">
        <input
          id="goal-percent"
          type="range"
          min="5"
          max="50"
          step="5"
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="flex-1 accent-teal"
          aria-valuetext={`${percent} percent`}
        />
        <span className="text-xl font-extrabold text-teal w-14 text-right">{percent}%</span>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm text-slate mb-1">
          <span>Progress this week</span>
          <span className="font-semibold text-charcoal">{progress}%</span>
        </div>
        <div
          className="h-3 bg-cream rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Weekly goal progress"
        >
          <div
            className="h-full bg-teal rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate mt-2">
          Target: save ≈ {targetReductionKg.toFixed(1)} kg/week · saved so far{" "}
          {achievedKg.toFixed(1)} kg
        </p>
      </div>
    </div>
  );
}

GoalCard.propTypes = {
  weeklyBaseline: PropTypes.number,
  weeklyNet: PropTypes.number,
};
