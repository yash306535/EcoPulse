// All Serper (live search) calls live here. Never called from the browser.
// Cache in SQLite (~30 min TTL) + last-cache + hardcoded fallback.
import { cacheGet, cacheSet } from "./cache.js";
import { LIVE_CACHE_TTL_MS, INPUT_LIMITS } from "./config.js";
import { warn } from "./logger.js";

const NEWS_QUERIES = {
  transport: "transport emissions India news",
  energy: "renewable energy India news",
  food: "sustainable diet news",
  waste: "recycling waste management India news",
  shopping: "sustainable fashion India news",
};

const RESOURCE_QUERIES = {
  transport: (city) => `EV charging stations near ${city}`,
  energy: (city) => `solar rooftop subsidy ${city}`,
  food: (city) => `organic local produce market ${city}`,
  waste: (city) => `recycling center near ${city}`,
  shopping: (city) => `second hand thrift store ${city}`,
};

const FALLBACK_NEWS = [
  {
    title: "How small daily habits cut your carbon footprint",
    link: "https://www.un.org/en/actnow",
    source: "UN ActNow",
    date: "",
  },
  {
    title: "Practical steps toward a low-carbon lifestyle",
    link: "https://www.iea.org/topics/transport",
    source: "IEA",
    date: "",
  },
  {
    title: "Why personal climate action still matters",
    link: "https://www.ipcc.ch/",
    source: "IPCC",
    date: "",
  },
];

const FALLBACK_RESOURCES = [
  {
    title: "Find local sustainability resources near you",
    link: "https://www.google.com/maps/search/sustainability+near+me",
    snippet: "Search nearby eco-friendly services, recycling, and green options.",
    domain: "google.com",
  },
  {
    title: "Government clean energy & subsidy portal",
    link: "https://mnre.gov.in/",
    snippet: "Information on solar subsidies and renewable energy schemes.",
    domain: "mnre.gov.in",
  },
];

/**
 * Low-level Serper API call.
 * @param {"news"|"search"} endpoint
 * @param {string} query
 * @returns {Promise<object>} the raw Serper JSON response
 * @throws if no API key is configured or the request fails
 */
async function serperPost(endpoint, query) {
  const key = process.env.SERPER_API_KEY;
  if (!key) throw new Error("no SERPER_API_KEY");
  const res = await fetch(`https://google.serper.dev/${endpoint}`, {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, gl: "in", num: 6 }),
  });
  if (!res.ok) throw new Error(`serper ${endpoint} ${res.status}`);
  return res.json();
}

/**
 * Fetch the 3 most recent news headlines for a category, with cache + fallback.
 * @param {string} [category="transport"]
 * @returns {Promise<Array<{title:string,link:string,source:string,date:string}>>}
 */
export async function news(category = "transport") {
  const cat = NEWS_QUERIES[category] ? category : "transport";
  const cacheKey = `news:${cat}`;
  const cached = cacheGet(cacheKey);
  if (cached.fresh && cached.payload) return cached.payload;

  try {
    const data = await serperPost("news", NEWS_QUERIES[cat]);
    const items = (data.news || []).slice(0, 3).map((n) => ({
      title: n.title,
      link: n.link,
      source: n.source || "",
      date: n.date || "",
    }));
    if (items.length === 0) throw new Error("empty news");
    cacheSet(cacheKey, items, LIVE_CACHE_TTL_MS);
    return items;
  } catch (err) {
    warn("news", `fallback: ${err.message}`);
    if (cached.payload) return cached.payload; // stale is better than broken
    return FALLBACK_NEWS;
  }
}

/**
 * Fetch the top local eco resources for a category + city, with cache + fallback.
 * @param {string} [category="transport"]
 * @param {string} [city=""]
 * @returns {Promise<Array<{title:string,link:string,snippet:string,domain:string}>>}
 */
export async function localResources(category = "transport", city = "") {
  const cat = RESOURCE_QUERIES[category] ? category : "transport";
  const safeCity = String(city || "your area")
    .trim()
    .slice(0, INPUT_LIMITS.cityLength);
  const cacheKey = `local:${cat}:${safeCity.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached.fresh && cached.payload) return cached.payload;

  try {
    const data = await serperPost("search", RESOURCE_QUERIES[cat](safeCity));
    const items = (data.organic || []).slice(0, 5).map((o) => {
      let domain = "";
      try {
        domain = new URL(o.link).hostname.replace(/^www\./, "");
      } catch {
        domain = "";
      }
      return { title: o.title, link: o.link, snippet: o.snippet || "", domain };
    });
    if (items.length === 0) throw new Error("empty results");
    cacheSet(cacheKey, items, LIVE_CACHE_TTL_MS);
    return items;
  } catch (err) {
    warn("localResources", `fallback: ${err.message}`);
    if (cached.payload) return cached.payload;
    return FALLBACK_RESOURCES;
  }
}
