import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Flame, Award, Trophy } from "lucide-react";
import { api } from "../lib/api.js";

// EcoScore: rewards consistent logging and net reductions.
function computeStats(logs) {
  const byDate = {};
  for (const l of logs) {
    byDate[l.date] = (byDate[l.date] || 0) + l.delta_kg;
  }
  const dates = Object.keys(byDate).sort();
  const daysLogged = dates.length;

  // streak: consecutive days up to today with at least one log
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (byDate[key] !== undefined) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }

  const reductions = logs.filter((l) => l.delta_kg < 0).length;
  const total = logs.length || 1;
  const reductionRatio = reductions / total;

  // 0-100: base on activity (logging) + how much of it is reductions
  const score = Math.min(
    100,
    Math.round(daysLogged * 8 + reductionRatio * 40 + Math.min(streak, 7) * 4)
  );

  return { score, streak, daysLogged, reductions };
}

const BADGES = [
  { id: "first", label: "First Step", icon: Award, test: (s) => s.daysLogged >= 1 },
  { id: "streak3", label: "3-Day Streak", icon: Flame, test: (s) => s.streak >= 3 },
  { id: "reducer", label: "Reducer", icon: Trophy, test: (s) => s.reductions >= 5 },
  { id: "streak7", label: "Week Warrior", icon: Flame, test: (s) => s.streak >= 7 },
  { id: "eco80", label: "Eco Champion", icon: Trophy, test: (s) => s.score >= 80 },
];

export default function Gamification({ refreshKey }) {
  const [stats, setStats] = useState({ score: 0, streak: 0, daysLogged: 0, reductions: 0 });

  useEffect(() => {
    api
      .getLogs()
      .then((d) => setStats(computeStats(d.logs || [])))
      .catch(() => {});
  }, [refreshKey]);

  return (
    <div className="card">
      <h3 className="font-bold text-lg mb-4">Your EcoScore</h3>
      <div className="flex items-center gap-6">
        <ScoreRing score={stats.score} />
        <div className="flex-1">
          <div className="flex items-center gap-2 text-lg font-bold text-charcoal">
            <Flame className="h-5 w-5 text-sand" /> {stats.streak}-day streak
          </div>
          <p className="text-sm text-slate mt-1">
            {stats.daysLogged} days logged · {stats.reductions} green actions
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-5">
        {BADGES.map((b) => {
          const unlocked = b.test(stats);
          const Icon = b.icon;
          return (
            <span
              key={b.id}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border ${
                unlocked
                  ? "bg-sand/15 border-sand/40 text-charcoal"
                  : "bg-cream border-slate/15 text-slate/50"
              }`}
              title={unlocked ? "Unlocked" : "Locked"}
            >
              <Icon className={`h-4 w-4 ${unlocked ? "text-sand" : "text-slate/40"}`} />
              {b.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ScoreRing({ score }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative h-24 w-24" role="img" aria-label={`EcoScore ${score} out of 100`}>
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#eee" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="#1B7F6E"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-teal">{score}</span>
        <span className="text-[10px] text-slate font-semibold">/ 100</span>
      </div>
    </div>
  );
}

Gamification.propTypes = {
  refreshKey: PropTypes.number,
};

ScoreRing.propTypes = {
  score: PropTypes.number.isRequired,
};
