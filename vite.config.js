import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ mode }) => {
  // Load env without VITE_ prefix filter so ANTHROPIC_API_KEY is accessible
  // server-side in vite.config.js but never bundled into the browser
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      // Provides Buffer, crypto, stream — required by postchain-client in browser
      nodePolyfills({
        include: ["buffer", "crypto", "stream", "util", "events"],
        globals: { Buffer: true, global: true, process: true },
      }),
    ],
    server: {
      proxy: {
        // All /api/anthropic/* requests are proxied to api.anthropic.com
        // The real API key is injected here — it never reaches the browser bundle
        "/api/anthropic": {
          target: "https://api.anthropic.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/anthropic/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("x-api-key", env.ANTHROPIC_API_KEY);
              proxyReq.setHeader("anthropic-version", "2023-06-01");
            });
          },
        },
      },
    },
  };
});
