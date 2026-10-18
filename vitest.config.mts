import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Testes unitários das regras do fórum (src/lib/forum/*.test.ts). Rodam sem
// banco e sem navegador: só funções puras. Uso: npm test
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
