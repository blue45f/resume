import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    target: 'es2022',
    cssMinify: 'lightningcss',
    sourcemap: false,
    // Chunk size warning threshold (kB)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal caching and parallel loading
        // Expected approximate chunk sizes:
        //   react-vendor  ~140 kB (react + react-dom + react-router)
        //   tiptap        ~250 kB (rich text editor + prosemirror)
        //   sanitize       ~15 kB (DOMPurify)
        //   icons          ~50 kB (lucide + heroicons, tree-shaken)
        //   utils          ~30 kB (date-fns/dayjs + lodash)
        //   index          variable (app code)
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@tiptap') || id.includes('node_modules/prosemirror')) {
            return 'tiptap';
          }
          if (id.includes('node_modules/dompurify') || id.includes('node_modules/sanitize')) {
            return 'sanitize';
          }
          if (id.includes('node_modules/lucide') || id.includes('node_modules/@heroicons')) {
            return 'icons';
          }
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/dayjs') || id.includes('node_modules/lodash')) {
            return 'utils';
          }
          // Catch-all: group remaining large node_modules into a vendor chunk
          if (id.includes('node_modules/') && !id.includes('node_modules/.vite')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
