import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/specs/**/*.test.ts"],
    globalSetup: ["tests/integration/setup/global-setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
