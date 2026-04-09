import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3001,
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:3000",
          changeOrigin: true,
        },
        "/ws": {
          target: env.VITE_WS_BASE_URL || env.VITE_API_BASE_URL || "ws://localhost:3000",
          ws: true,
          changeOrigin: true,
        },
        "/ai-assistant": {
          target: env.VITE_AI_ASSISTANT_URL || "http://127.0.0.1:8787",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ai-assistant/, ""),
        },
      },
    },
    test: {
      environment: "happy-dom",
      globals: false,
      setupFiles: "./src/test/setup.ts",
    },
  };
});
