// nuxt.config.ts
// Option A: ONLY .env decides the URLs. No code fallback domains.
// Provide either:
//   NUXT_PUBLIC_API_BASE_URL & NUXT_PUBLIC_IMAGE_BASE_URL
// Or just:
//   NUXT_PUBLIC_BASE_ORIGIN (then /api/v1 will be appended for apiBaseUrl)
const baseOrigin = process.env.NUXT_PUBLIC_BASE_ORIGIN?.replace(/\/$/, '')
const derivedApi = baseOrigin ? `${baseOrigin}/api/v1` : ''

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui-pro', '@vueuse/nuxt'],

  devtools: { enabled: false },

  css: ['~/assets/css/main.css', '~/assets/css/override-products-bg.css'],

  colorMode: { preference: 'light' },

  runtimeConfig: {
    public: {
      // Final resolved API base (single source). Allows overriding fully or just base origin.
      apiBaseUrl: (process.env.NUXT_PUBLIC_API_BASE_URL || derivedApi || '').replace(/\/$/, ''),
      imageBaseUrl: (process.env.NUXT_PUBLIC_IMAGE_BASE_URL || baseOrigin || '').replace(/\/$/, ''),
      appTitle: process.env.NUXT_PUBLIC_APP_TITLE || 'Zen Dashboard',
      testUser: process.env.NUXT_PUBLIC_TEST_USER || 'tester@example.com'
    },
    // server-only secret (accessible on server via useRuntimeConfig().testPassword)
    testPassword: process.env.NUXT_TEST_PASSWORD || 'Test@1234'
  },

  routeRules: { '/api/**': { cors: true } },

  compatibilityDate: '2024-07-11',

  // ✅ Thêm: sourcemap cho Nitro (SSR)
  nitro: { sourceMap: true },

  // ✅ Thêm: sourcemap cho client (Vite)
  vite: {
    optimizeDeps: { include: ['tinymce'] },
    ssr: { noExternal: ['@tinymce/tinymce-vue'] },
    server: {
      allowedHosts: ['web.vnnsoft.com']
    },
    // quan trọng để breakpoint trong .vue/.ts phía client hoạt động
    build: { sourcemap: true }
  },

  // (không bắt buộc, nhưng giúp TS map tốt)
  typescript: {
    tsConfig: { compilerOptions: { sourceMap: true } }
  },

  eslint: {
    config: { stylistic: { commaDangle: 'never', braceStyle: '1tbs' } }
  }
})
