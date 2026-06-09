import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Split stable, eagerly-needed vendors into their own cacheable chunks.
        // hls.js (dynamic import) and recharts (React.lazy) are intentionally
        // NOT listed here so they remain separate async chunks.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router')
          ) {
            return 'react-vendor';
          }
          if (id.includes('@supabase')) return 'supabase';
        },
      },
    },
  },
});
