// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui-pro', '@vueuse/nuxt'],

  devtools: { enabled: false },

  css: ['~/assets/css/main.css', '~/assets/css/override-products-bg.css'],

  colorMode: { preference: 'light' },

  runtimeConfig: {
    public: {
      // Prefer explicit env vars, otherwise choose sensible fallback depending on NODE_ENV
      apiBaseUrl:
        process.env.NUXT_PUBLIC_API_BASE_URL
        || (process.env.NODE_ENV === 'production'
          ? 'https://localhost:62939/api/v1'
          : 'https://localhost:62939/api/v1'),
      imageBaseUrl:
        process.env.NUXT_PUBLIC_IMAGE_BASE_URL
        || (process.env.NODE_ENV === 'production'
          ? 'https://localhost:62939'
          : 'https://localhost:62939'),
      // public test user available on client via useRuntimeConfig().public.testUser
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
      host: '0.0.0.0',
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
