import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    alias: {
      "@novabots/db": path.resolve(__dirname, "../../packages/db/src/index.ts"),
      "@novabots/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
    },
  },
  resolve: {
    alias: {
      "@novabots/db": path.resolve(__dirname, "../../packages/db/src/index.ts"),
      "@novabots/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
    },
  },
});
