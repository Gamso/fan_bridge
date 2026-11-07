import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";
import { copyFileSync, mkdirSync } from "node:fs";

// Sourcemaps are only produced in watch mode (local development). The
// committed bundle carries no sourceMappingURL, so HACS installs never 404 on
// a missing .map file.
const dev = process.env.ROLLUP_WATCH === "true";

export default {
  input: "src/index.ts",
  output: {
    file: "dist/fan-bridge-card.js",
    format: "es",
    sourcemap: dev,
  },
  plugins: [
    resolve(),
    commonjs(),
    json(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: false,
      sourceMap: dev,
    }),
    terser(),
    // The same bundle is served by the integration, which loads it in every
    // dashboard: keep its copy in step with dist/ (used by manual installs).
    {
      name: "copy-to-integration",
      writeBundle() {
        mkdirSync("custom_components/fan_bridge/www", { recursive: true });
        copyFileSync("dist/fan-bridge-card.js", "custom_components/fan_bridge/www/fan-bridge-card.js");
      },
    },
  ],
};
