import { useEffect, useState, lazy, Suspense } from "react";
import { computeBreakdown, computeTotals, topCategory } from "@shared/carbon.js";
import { getClientId } from "./lib/clientId.js";
import { api } from "./lib/api.js";
import Landing from "./components/Landing.jsx";
import Quiz from "./components/Quiz.jsx";

// Defer the chart-heavy dashboard so landing/quiz load instantly.
const Dashboard = lazy(() => import("./components/Dashboard.jsx"));

export default function App() {
  const [view, setView] = useState("landing"); // landing | quiz | dashboard
  const [result, setResult] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);

  // Ensure clientId exists and check for a saved profile.
  useEffect(() => {
    getClientId();
    api
      .getFootprint()
      .then((d) => {
        if (d && d.breakdown) {
          setResult({
            breakdown: d.breakdown,
            totals: d.totals,
            topCategory: d.topCategory,
            city: d.city,
          });
          setHasProfile(true);
        }
      })
      .catch(() => {
        /* no saved profile yet — fine */
      });
  }, []);

  const handleQuizSubmit = (answers) => {
    // 1) Instant client-side calculation
    const breakdown = computeBreakdown(answers);
    const totals = computeTotals(breakdown);
    const top = topCategory(breakdown);
    setResult({ breakdown, totals, topCategory: top, city: answers.city || "" });
    setHasProfile(true);
    setView("dashboard");

    // 2) Fire-and-forget persist to backend (authoritative)
    api.saveFootprint(answers, answers.city || "").catch(() => {
      /* core loop still works offline of backend */
    });
  };

  if (view === "quiz") {
    return <Quiz onSubmit={handleQuizSubmit} onBack={() => setView("landing")} />;
  }
  if (view === "dashboard" && result) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center text-slate" role="status">
            Loading your dashboard…
          </div>
        }
      >
        <Dashboard result={result} onRetake={() => setView("quiz")} />
      </Suspense>
    );
  }
  return (
    <Landing
      onStart={() => setView("quiz")}
      hasProfile={hasProfile}
      onViewDashboard={() => result && setView("dashboard")}
    />
  );
}
