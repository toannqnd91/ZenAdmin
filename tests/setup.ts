import { vi } from 'vitest'

// Mock Nuxt composables
vi.mock('#app', () => ({
  useRuntimeConfig: vi.fn(() => ({
    public: {
      apiBaseUrl: 'http://localhost:7001/api/v1',
      imageBaseUrl: 'http://localhost:7001',
      appTitle: 'Zen Dashboard Test'
    }
  })),
  useCookie: vi.fn(() => ({
    value: null
  })),
  useState: vi.fn(() => ({
    value: null
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn()
  })),
  useToast: vi.fn(() => ({
    add: vi.fn()
  })),
  navigateTo: vi.fn()
}))

// Mock fetch globally
global.fetch = vi.fn()
