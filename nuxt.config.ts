// nuxt.config.ts
// Option A: ONLY .env decides the URLs. No code fallback domains.
// Provide either:
//   NUXT_PUBLIC_API_BASE_URL & NUXT_PUBLIC_IMAGE_BASE_URL
// Or just:
//   NUXT_PUBLIC_BASE_ORIGIN (then /api/v1 will be appended for apiBaseUrl)
const baseOrigin = process.env.NUXT_PUBLIC_BASE_ORIGIN?.replace(/\/$/, '')
const derivedApi = baseOrigin ? `${baseOrigin}/api/v1` : ''
const isProd = process.env.NODE_ENV === 'production'

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui-pro', '@vueuse/nuxt', '@pinia/nuxt'],

  devtools: { enabled: false },

  css: ['~/assets/css/main.css', '~/assets/css/override-products-bg.css'],

  colorMode: { preference: 'light' },

  app: {
    head: {
      htmlAttrs: { lang: 'vi' },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'apple-touch-icon', href: '/icon-192.png' }
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#3b82f6' }
      ]
    }
  },

  runtimeConfig: {
    public: {
      // API Configuration
      apiBaseUrl: (process.env.NUXT_PUBLIC_API_BASE_URL || derivedApi || '').replace(/\/$/, ''),
      imageBaseUrl: (process.env.NUXT_PUBLIC_IMAGE_BASE_URL || baseOrigin || '').replace(/\/$/, ''),
      appTitle: process.env.NUXT_PUBLIC_APP_TITLE || 'Zen Dashboard',
      testUser: process.env.NUXT_PUBLIC_TEST_USER || 'tester@example.com',
      
      // Analytics & Monitoring
      gaId: process.env.NUXT_PUBLIC_GA_ID || '',
      sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN || '',
      sentryEnvironment: process.env.NUXT_PUBLIC_SENTRY_ENVIRONMENT || 'production',
      sentryTracesSampleRate: process.env.NUXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'
    },
    // server-only secret
    testPassword: process.env.NUXT_TEST_PASSWORD || 'Test@1234'
  },

  routeRules: { '/api/**': { cors: true } },

  compatibilityDate: '2024-07-11',

  // ✅ Thêm: sourcemap cho Nitro (SSR) - tắt ở production để giảm bundle
  nitro: { sourceMap: !isProd },

  // ✅ Thêm: sourcemap cho client (Vite)
  vite: {
    optimizeDeps: { include: ['tinymce'] },
    ssr: { noExternal: ['@tinymce/tinymce-vue'] },
    server: {
      allowedHosts: ['web.vnnsoft.com']
    },
    // quan trọng để breakpoint trong .vue/.ts phía client hoạt động
    build: {
      // Tắt sourcemap cho production để giảm bundle size
      sourcemap: !isProd
    }
  },

  // (không bắt buộc, nhưng giúp TS map tốt)
  typescript: {
    tsConfig: { compilerOptions: { sourceMap: true } }
  },

  eslint: {
    config: { stylistic: { commaDangle: 'never', braceStyle: '1tbs' } }
  }
})
