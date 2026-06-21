import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { MapPin, ExternalLink } from "lucide-react";
import { api } from "../lib/api.js";
import Skeleton from "./Skeleton.jsx";

export default function LocalResources({ category, city }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .localResources(category, city)
      .then((d) => alive && setItems(d.items || []))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [category, city]);

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="h-5 w-5 text-teal" />
        <h3 className="font-bold text-lg">Eco resources near you</h3>
      </div>
      <p className="text-sm text-slate mb-4">
        Real places to act on it{city ? ` around ${city}` : ""}.
      </p>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((r, i) => (
            <li key={i}>
              <a
                href={r.link}
                target="_blank"
                rel="noreferrer"
                className="group block rounded-xl p-3 hover:bg-cream transition-colors"
              >
                <p className="font-medium text-charcoal leading-snug group-hover:text-teal inline-flex items-center gap-1.5">
                  {r.title}
                  <ExternalLink className="h-3.5 w-3.5 text-slate group-hover:text-teal" />
                </p>
                {r.snippet && <p className="text-sm text-slate mt-0.5 line-clamp-2">{r.snippet}</p>}
                {r.domain && <p className="text-xs text-teal mt-1">{r.domain}</p>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

LocalResources.propTypes = {
  category: PropTypes.string,
  city: PropTypes.string,
};
