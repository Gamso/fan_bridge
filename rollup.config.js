import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";

// The bundle is written straight into the integration, which serves it and
// loads it in every dashboard (HACS installs the integration folder).
// Sourcemaps are only produced in watch mode (local development). The
// committed bundle carries no sourceMappingURL, so installs never 404 on a
// missing .map file.
const dev = process.env.ROLLUP_WATCH === "true";
const OUT_DIR = "custom_components/fan_bridge/www";

export default {
  input: "src/index.ts",
  output: {
    file: `${OUT_DIR}/fan-bridge-card.js`,
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
      outDir: OUT_DIR,
    }),
    terser(),
  ],
};
