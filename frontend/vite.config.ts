import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    // Optional: analyze bundle
    visualizer({
      filename: 'bundle-report.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // Optional: PWA config (better caching than manual SW)
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 6000000,
      },
    }),
  ],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor dependencies
          react: ['react', 'react-dom'],
          ui: ['framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-popover'],
          ai: ['@langchain/core', '@google/generative-ai'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
