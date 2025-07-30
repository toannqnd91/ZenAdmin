// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui-pro',
    '@vueuse/nuxt'
  ],

  devtools: {
    enabled: false
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'dark'
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://dongtrunghathaophunhan.vn/api/v1',
      imageBaseUrl: process.env.NUXT_PUBLIC_IMAGE_BASE_URL || 'https://dongtrunghathaophunhan.vn'
    }
  },

  routeRules: {
    '/api/**': {
      cors: true
    }
  },

  compatibilityDate: '2024-07-11',

  vite: {
    optimizeDeps: {
      include: ['tinymce']
    },
    ssr: {
      noExternal: ['@tinymce/tinymce-vue']
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: ['web.vnnsoft.com']
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
