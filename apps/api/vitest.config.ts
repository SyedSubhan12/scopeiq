import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      STRIPE_SECRET_KEY: "sk_test_placeholder_for_tests",
      RESEND_API_KEY: "re_test_placeholder_for_tests",
    },
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
