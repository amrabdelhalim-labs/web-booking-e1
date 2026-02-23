/// <reference types="vitest" />

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// Base path is configurable via VITE_BASE_PATH env var:
//   - GitHub Pages: /web-booking-e1/
//   - Vercel / Netlify / Render: /
//   - Local dev: / (default)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const isCi = env.GITHUB_ACTIONS === "true";
  const appDomain = (env.VITE_APP_DOMAIN || "").trim();
  const hasCustomDomain = appDomain !== "" && !appDomain.includes("github.io");
  const basePath =
    env.VITE_BASE_PATH || (isCi ? (hasCustomDomain ? "/" : "/web-booking-e1/") : "/");
  return {
    plugins: [react()],
    base: basePath,
    server: {
      port: 5173,
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      minify: "esbuild",
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts",
    },
  };
});
