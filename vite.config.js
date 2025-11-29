import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // Use relative base path for Capacitor mobile apps
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    // Custom plugin to add build timestamp and cache-busting meta tags
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        const buildTime = Date.now()
        const buildDate = new Date().toISOString()
        
        return html.replace(
          '</head>',
          `  <!-- Build: ${buildDate} (${buildTime}) -->
  <meta name="build-time" content="${buildTime}" />
  <meta name="build-date" content="${buildDate}" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  </head>`
        )
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Provide empty module for barcode scanner on web builds
      '@capacitor/barcode-scanner': path.resolve(__dirname, './src/lib/barcode-scanner-stub.js')
    },
  },

   build: {
  outDir: 'dist',

    // Generate unique filenames for all assets with content hash
    rollupOptions: {

      output: {
        // Use content hash for cache busting
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: (assetInfo) => {
          // Keep images and fonts in their own folders with hash
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/woff2?|ttf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      }
    },
    // Ensure source maps for debugging
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Clear output directory before build
    emptyOutDir: true
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: [
      '5173-ig2aabych66t0qxvab2m2-1bbd43f5.manusvm.computer',
      '.manusvm.computer',
      'localhost'
    ]
  }
})
