/**
 * Nuxt optimization configuration
 * Paste this into nuxt.config.ts for production optimization
 */

export const optimizationConfig = {
  // Build optimizations
  build: {
    transpile: ['chart.js', '@unovis/vue'],
    analyze: false // Set to true to analyze bundle size
  },

  // Vite optimizations
  vite: {
    build: {
      // Code splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'vue-vendor': ['vue', 'vue-router'],
            'ui-vendor': ['@nuxt/ui', '@nuxt/ui-pro'],
            'chart-vendor': ['chart.js', 'vue-chartjs', '@unovis/vue', '@unovis/ts'],
            'editor-vendor': ['tinymce', '@tinymce/tinymce-vue']
          }
        }
      },
      // Minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true
        }
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 1000 // 1MB
    },
    // Dependency optimization
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'chart.js',
        'date-fns',
        'zod'
      ]
    }
  },

  // Experimental features
  experimental: {
    payloadExtraction: true, // Extract payload to separate files
    renderJsonPayloads: true // Render JSON payloads
  },

  // Route rules for caching
  routeRules: {
    // Static pages
    '/': { prerender: true },
    '/login': { prerender: true },
    
    // API routes
    '/api/**': { cors: true, cache: false },
    
    // Static assets
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/images/**': { headers: { 'cache-control': 'public, max-age=31536000' } }
  },

  // Nitro optimizations
  nitro: {
    compressPublicAssets: true, // Compress static assets
    minify: true,
    sourceMap: false // Disable sourcemaps in production
  }
}
