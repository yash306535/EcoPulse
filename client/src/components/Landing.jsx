import { Leaf, ArrowRight, Sparkles, MapPin, LineChart } from "lucide-react";

export default function Landing({ onStart, hasProfile, onViewDashboard }) {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="max-w-5xl mx-auto w-full px-6 pt-8 flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-teal flex items-center justify-center">
          <Leaf className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <span className="text-xl font-extrabold tracking-tight">EcoPulse</span>
      </header>

      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-6 flex flex-col justify-center py-16">
        <p className="inline-flex w-fit items-center gap-2 rounded-full bg-teal/10 text-teal px-4 py-1.5 text-sm font-semibold mb-6">
          <Sparkles className="h-4 w-4" aria-hidden="true" /> Your daily climate habit, no login needed
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight max-w-3xl">
          Know your carbon footprint.{" "}
          <span className="text-teal">Shrink it, one day at a time.</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-slate max-w-2xl leading-relaxed">
          Most people have no idea what their actual footprint is, and generic “go green” tips
          never say what to do <em>today</em>. EcoPulse turns awareness into a daily loop: a
          2-minute quiz, a personalized AI action plan, and real, nearby resources to act on it.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button className="btn-primary inline-flex items-center gap-2 text-lg" onClick={onStart}>
            Calculate My Footprint <ArrowRight className="h-5 w-5" />
          </button>
          {hasProfile && (
            <button className="btn-ghost text-lg" onClick={onViewDashboard}>
              View my dashboard
            </button>
          )}
        </div>

        <div className="mt-16 grid sm:grid-cols-3 gap-5">
          <Feature icon={<LineChart className="h-5 w-5" />} title="See where it comes from"
            text="A clear breakdown across transport, energy, food, waste, and shopping." />
          <Feature icon={<Sparkles className="h-5 w-5" />} title="AI tells you what to do"
            text="Concrete, doable-this-week actions ranked by impact — not vague advice." />
          <Feature icon={<MapPin className="h-5 w-5" />} title="Act on it nearby"
            text="Live, location-aware resources and fresh news tied to your biggest source." />
        </div>
      </main>

      <footer className="max-w-5xl mx-auto w-full px-6 py-8 text-sm text-slate">
        All figures are estimated reference values for awareness, not audited measurements.
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="card">
      <div className="h-10 w-10 rounded-xl bg-teal/10 text-teal flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-slate mt-1 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
