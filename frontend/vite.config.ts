import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Optional plugins you already added:
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
// import viteCompression from 'vite-plugin-compression'  // optional

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({ registerType: 'autoUpdate' }),
    visualizer({ filename: 'bundle-report.html', open: false }),
    // viteCompression(), // optional compression plugin
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})

