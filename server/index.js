import { createApp } from "./app.js";
import { PORT } from "./config.js";
import { info } from "./logger.js";

const app = createApp();

// Bind to 0.0.0.0 so hosts like Render can detect the open port.
app.listen(PORT, "0.0.0.0", () => {
  info(`🌱 EcoPulse server running on http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) info("   (no OPENAI_API_KEY — coach/chat use fallbacks)");
  if (!process.env.SERPER_API_KEY) info("   (no SERPER_API_KEY — news/resources use fallbacks)");
});
