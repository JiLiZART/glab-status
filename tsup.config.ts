import { defineConfig } from "tsup";

export default defineConfig(() => ({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["esm"],
  external: [],
  splitting: false,
  clean: true,
  cjsInterop: true,
  dts: true,
  target: ["node20"],
  shims: true,
  tsconfig: "./tsconfig.json",
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs" : format === "esm" ? `.mjs` : ".js",
    };
  },
}));
