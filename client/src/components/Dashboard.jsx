import { useState } from "react";
import { Leaf, RotateCcw } from "lucide-react";
import FootprintHero from "./FootprintHero.jsx";
import BreakdownCharts from "./BreakdownCharts.jsx";
import ComparisonStrip from "./ComparisonStrip.jsx";
import InsightsPanel from "./InsightsPanel.jsx";
import ActivityLogger from "./ActivityLogger.jsx";
import NewsPulse from "./NewsPulse.jsx";
import LocalResources from "./LocalResources.jsx";
import Gamification from "./Gamification.jsx";
import GoalCard from "./GoalCard.jsx";
import ChatWidget from "./ChatWidget.jsx";

export default function Dashboard({ result, onRetake }) {
  const { breakdown, totals, topCategory, city } = result;
  const [logKey, setLogKey] = useState(0);
  const [weeklyNet, setWeeklyNet] = useState(0);

  const refresh = () => setLogKey((k) => k + 1);
  return (
    <div className="min-h-screen">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-teal flex items-center justify-center">
            <Leaf className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">EcoPulse</span>
        </div>
        <button className="btn-ghost inline-flex items-center gap-1.5" onClick={onRetake}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Retake quiz
        </button>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto w-full px-6 pb-16 space-y-5">
        <FootprintHero totals={totals} />

        <div className="grid lg:grid-cols-2 gap-5">
          <BreakdownCharts breakdown={breakdown} />
          <ComparisonStrip annualTonnes={totals?.annualTonnes || 0} />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <InsightsPanel refreshKey={logKey} />
          <Gamification refreshKey={logKey} />
        </div>

        <ActivityLogger
          onLogged={(net) => {
            setWeeklyNet(net);
            refresh();
          }}
        />

        <div className="grid lg:grid-cols-2 gap-5">
          <GoalCard weeklyBaseline={totals?.weekly || 0} weeklyNet={weeklyNet} />
          <NewsPulse category={topCategory} />
        </div>

        <LocalResources category={topCategory} city={city} />
      </main>

      <ChatWidget />
    </div>
  );
}
