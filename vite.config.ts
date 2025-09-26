import { defineConfig } from "vite";

// Root-level vite config for Vercel deployment
export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "frontend/index.html"
    }
  }
});