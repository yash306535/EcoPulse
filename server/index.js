import { createApp } from "./app.js";

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🌱 EcoPulse server running on http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) console.log("   (no OPENAI_API_KEY — coach/chat use fallbacks)");
  if (!process.env.SERPER_API_KEY) console.log("   (no SERPER_API_KEY — news/resources use fallbacks)");
});
