// File: vitest.config.mts (project root)
// Purpose: Basic Vitest configuration for running TypeScript unit tests.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
