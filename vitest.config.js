import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    globals: false,
    // Run files sequentially so the in-memory DB per file stays isolated.
    fileParallelism: false,
  },
});
