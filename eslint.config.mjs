import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Providers intentionally hydrate browser-local data after mount.
      // The state update is required to synchronize with localStorage.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "**/.next/**",
    "backend/**",
    "apps/customer-app/**",
    "supabase/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
  ]),
]);

export default eslintConfig;
