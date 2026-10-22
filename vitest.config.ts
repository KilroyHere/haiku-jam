import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/firestore.rules.test.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/lib/validation.ts", "src/lib/jam-state.ts"],
    },
  },
});
