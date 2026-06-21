import { useState } from "react";
import PropTypes from "prop-types";
import { ArrowLeft, ArrowRight } from "lucide-react";

const OPTION = (value, label) => ({ value, label });

const COMMUTE_OPTIONS = [
  OPTION("car", "Car (petrol, solo)"),
  OPTION("twoWheeler", "Two-wheeler"),
  OPTION("busMetro", "Bus / Metro"),
  OPTION("walkCycle", "Walk / Cycle"),
  OPTION("wfh", "Work from home"),
];
const DIET_OPTIONS = [
  OPTION("heavy", "Heavy meat"),
  OPTION("moderate", "Moderate meat"),
  OPTION("vegetarian", "Vegetarian"),
  OPTION("vegan", "Vegan"),
];
const SHOPPING_OPTIONS = [
  OPTION("rarely", "Rarely"),
  OPTION("monthly", "Monthly"),
  OPTION("weekly", "Weekly new purchases"),
];
const WASTE_OPTIONS = [
  OPTION("always", "Always segregate"),
  OPTION("sometimes", "Sometimes"),
  OPTION("never", "Never"),
];

const DEFAULTS = {
  commuteMode: "car",
  kmPerDay: 20,
  daysPerWeek: 5,
  flightsDomestic: 0,
  flightsIntl: 0,
  monthlyKwh: 300,
  lpgPerMonth: 1,
  diet: "moderate",
  shopping: "monthly",
  waste: "sometimes",
  city: "",
};

export default function Quiz({ onSubmit, onBack }) {
  const [a, setA] = useState(DEFAULTS);
  const set = (k, v) => setA((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(a);
  };

  return (
    <div className="min-h-screen max-w-3xl mx-auto w-full px-6 py-10">
      <button className="btn-ghost inline-flex items-center gap-1.5 -ml-2 mb-6" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
        Let’s estimate your footprint
      </h1>
      <p className="text-slate mt-2">
        Seven quick questions — about two minutes. All values are estimates.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Q n={1} title="Daily commute">
          <Choices
            name="Commute mode"
            options={COMMUTE_OPTIONS}
            value={a.commuteMode}
            onChange={(v) => set("commuteMode", v)}
          />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <NumberField
              label="Round-trip km/day"
              value={a.kmPerDay}
              onChange={(v) => set("kmPerDay", v)}
            />
            <NumberField
              label="Days/week"
              value={a.daysPerWeek}
              onChange={(v) => set("daysPerWeek", v)}
            />
          </div>
        </Q>

        <Q n={2} title="Flights in the last year">
          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label="Domestic flights"
              value={a.flightsDomestic}
              onChange={(v) => set("flightsDomestic", v)}
            />
            <NumberField
              label="International flights"
              value={a.flightsIntl}
              onChange={(v) => set("flightsIntl", v)}
            />
          </div>
        </Q>

        <Q
          n={3}
          title="Home electricity"
          hint="Reference: small home ≈150/mo, medium ≈300, large ≈500+"
        >
          <NumberField
            label="Estimated monthly kWh"
            value={a.monthlyKwh}
            onChange={(v) => set("monthlyKwh", v)}
          />
        </Q>

        <Q n={4} title="Cooking fuel" hint="LPG cylinders (14.2 kg) used per month">
          <NumberField
            label="LPG cylinders / month"
            value={a.lpgPerMonth}
            step="0.5"
            onChange={(v) => set("lpgPerMonth", v)}
          />
        </Q>

        <Q n={5} title="Diet">
          <Choices
            name="Diet type"
            options={DIET_OPTIONS}
            value={a.diet}
            onChange={(v) => set("diet", v)}
          />
        </Q>

        <Q n={6} title="Shopping habits">
          <Choices
            name="Shopping habits"
            options={SHOPPING_OPTIONS}
            value={a.shopping}
            onChange={(v) => set("shopping", v)}
          />
        </Q>

        <Q n={7} title="Waste & recycling">
          <Choices
            name="Waste and recycling"
            options={WASTE_OPTIONS}
            value={a.waste}
            onChange={(v) => set("waste", v)}
          />
        </Q>

        <Q n={"📍"} title="Your city" hint="Used to find real, nearby eco resources">
          <label htmlFor="f-city" className="sr-only">
            Your city
          </label>
          <input
            id="f-city"
            className="input"
            placeholder="e.g. Bengaluru"
            value={a.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </Q>

        <button
          type="submit"
          className="btn-primary inline-flex items-center gap-2 text-lg w-full justify-center"
        >
          See my results <ArrowRight className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}

function Q({ n, title, hint, children }) {
  return (
    <fieldset className="card">
      <legend className="flex items-baseline gap-3 mb-4 w-full">
        <span
          aria-hidden="true"
          className="h-7 min-w-7 px-2 rounded-full bg-teal/10 text-teal text-sm font-bold flex items-center justify-center"
        >
          {n}
        </span>
        <span>
          <span className="font-bold text-lg leading-tight block">{title}</span>
          {hint && <span className="text-xs text-slate block mt-0.5">{hint}</span>}
        </span>
      </legend>
      {children}
    </fieldset>
  );
}

function Choices({ options, value, onChange, name }) {
  return (
    <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label={name}>
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
              selected
                ? "bg-teal text-white border-teal"
                : "bg-cream text-charcoal border-slate/20 hover:border-teal hover:text-teal"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function NumberField({ label, value, onChange, step = "1" }) {
  const id = "f-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        min="0"
        step={step}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
    </div>
  );
}

Quiz.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

Q.propTypes = {
  n: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  title: PropTypes.string,
  hint: PropTypes.string,
  children: PropTypes.node,
};

Choices.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })),
  value: PropTypes.string,
  onChange: PropTypes.func,
  name: PropTypes.string,
};

NumberField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onChange: PropTypes.func.isRequired,
  step: PropTypes.string,
};
