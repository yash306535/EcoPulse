import { useEffect, useState } from "react";
import { Newspaper, ExternalLink } from "lucide-react";
import { api } from "../lib/api.js";
import Skeleton from "./Skeleton.jsx";

export default function NewsPulse({ category }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .news(category)
      .then((d) => alive && setItems(d.items || []))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [category]);

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-1">
        <Newspaper className="h-5 w-5 text-teal" />
        <h3 className="font-bold text-lg">Sustainability pulse</h3>
      </div>
      <p className="text-sm text-slate mb-4">Fresh news tied to your biggest emission source.</p>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n, i) => (
            <li key={i}>
              <a
                href={n.link}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start gap-2 rounded-xl p-3 hover:bg-cream transition-colors"
              >
                <ExternalLink className="h-4 w-4 mt-1 text-slate group-hover:text-teal shrink-0" />
                <div>
                  <p className="font-medium text-charcoal leading-snug group-hover:text-teal">
                    {n.title}
                  </p>
                  <p className="text-xs text-slate mt-0.5">
                    {n.source}
                    {n.source && n.date ? " · " : ""}
                    {n.date}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
