// All OpenAI calls live here. Never called from the browser.
// Every call wrapped so a missing key or failure returns a valid fallback.
import OpenAI from "openai";

const MODEL = "gpt-4o-mini";

const COACH_SYSTEM_PROMPT =
  "You are EcoCoach, a friendly, encouraging carbon-footprint advisor inside a tracking app. You receive a JSON object with a user's weekly footprint broken down by category (transport, energy, food, waste, shopping), each in kg CO2e, plus their total. Identify the 1–2 categories contributing the most emissions. Return ONLY valid JSON, no markdown, no commentary outside the JSON, in this exact shape: an object with a 'tips' array of exactly 3 items (each with 'category', 'action', and 'impact' fields) and an 'encouragement' string under 25 words. Each action must be concrete and doable within a week — not generic advice like 'drive less,' but something like 'swap 2 of your 5 weekly car commutes for the bus.' Base impact estimates on directionally reasonable numbers derived from the input data.";

const CHAT_SYSTEM_PROMPT =
  "You are EcoBot, a friendly, concise carbon-literacy assistant inside a carbon footprint tracking app. Answer the user's question about carbon emissions, climate action, or sustainable living in under 80 words, in a plain conversational tone, no headers or bullet lists unless truly necessary. If a question is unrelated to climate or sustainability, gently redirect back to the app's purpose.";

export const FALLBACK_TIPS = {
  tips: [
    {
      category: "transport",
      action: "Swap 2 car commutes this week for the bus or cycling",
      impact: "~3 kg CO2e saved",
    },
    {
      category: "food",
      action: "Make 3 of your dinners vegetarian this week",
      impact: "~5 kg CO2e saved",
    },
    {
      category: "energy",
      action: "Set AC to 26°C and cut one hour of daily use",
      impact: "~4 kg CO2e saved",
    },
  ],
  encouragement: "Small swaps add up fast — you've got this!",
};

const FALLBACK_CHAT_REPLY =
  "I'm having trouble reaching my knowledge source right now, but here's a quick tip: small daily swaps — like one less car trip or a meat-free meal — add up to real carbon savings over a week. Try logging one today!";

let client = null;
function getClient() {
  if (client) return client;
  if (!process.env.OPENAI_API_KEY) return null;
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

function validateCoach(obj) {
  if (!obj || !Array.isArray(obj.tips) || obj.tips.length !== 3) return false;
  for (const t of obj.tips) {
    if (!t || typeof t.action !== "string") return false;
  }
  if (typeof obj.encouragement !== "string") return false;
  return true;
}

export async function coach(breakdown, totals) {
  const oa = getClient();
  if (!oa) return FALLBACK_TIPS;
  try {
    const payload = JSON.stringify({ breakdown, total: totals?.weekly });
    const res = await oa.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: COACH_SYSTEM_PROMPT },
        { role: "user", content: payload },
      ],
    });
    const text = res.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(text);
    if (!validateCoach(parsed)) return FALLBACK_TIPS;
    return parsed;
  } catch (err) {
    console.error("[coach] OpenAI error, using fallback:", err.message);
    return FALLBACK_TIPS;
  }
}

export async function chat(message) {
  const oa = getClient();
  if (!oa) return FALLBACK_CHAT_REPLY;
  try {
    const res = await oa.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      messages: [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        { role: "user", content: String(message ?? "").slice(0, 1000) },
      ],
    });
    return res.choices?.[0]?.message?.content?.trim() || FALLBACK_CHAT_REPLY;
  } catch (err) {
    console.error("[chat] OpenAI error, using fallback:", err.message);
    return FALLBACK_CHAT_REPLY;
  }
}
