// Dynamic runtime config loader with simple caching
// Allows overriding certain public runtime values (api base, image base, title)
// after build by editing /public/runtime-config.json (served as static asset).

interface DynamicRuntimeConfig {
  apiBaseUrl?: string
  imageBaseUrl?: string
  appTitle?: string
  [key: string]: any
}

let _dynamicConfig: DynamicRuntimeConfig | null = null
let _loading: Promise<DynamicRuntimeConfig> | null = null
let _lastFetch = 0
const REFRESH_INTERVAL = 60_000 // 1 minute (can adjust or expose param)

async function fetchDynamicConfig(): Promise<DynamicRuntimeConfig> {
  if (_dynamicConfig && Date.now() - _lastFetch < REFRESH_INTERVAL) return _dynamicConfig
  if (_loading) return _loading
  _loading = (async () => {
    try {
      const res = await fetch('/runtime-config.json', { cache: 'no-cache' })
      if (!res.ok) throw new Error('Failed to fetch runtime-config.json')
      const data = (await res.json()) as DynamicRuntimeConfig
      _dynamicConfig = data || {}
      _lastFetch = Date.now()
      return _dynamicConfig
    } catch (e) {
      // On failure keep existing cached value (if any) else fall back to empty
      if (!_dynamicConfig) _dynamicConfig = {}
      return _dynamicConfig
    } finally {
      _loading = null
    }
  })()
  return _loading
}

export function useAppRuntimeConfig() {
  const nuxtCfg = useRuntimeConfig()

  const state = reactive({
    loaded: false,
    apiBaseUrl: nuxtCfg.public.apiBaseUrl as string | undefined,
    imageBaseUrl: nuxtCfg.public.imageBaseUrl as string | undefined,
    appTitle: undefined as string | undefined
  })

  async function ensureLoaded(force = false) {
    if (state.loaded && !force) return state
    const dyn = await fetchDynamicConfig()
    // Merge with precedence: dynamic overrides env/nuxt when present
    state.apiBaseUrl = dyn.apiBaseUrl || state.apiBaseUrl
    state.imageBaseUrl = dyn.imageBaseUrl || state.imageBaseUrl
  state.appTitle = (dyn.appTitle as string | undefined) || state.appTitle || (nuxtCfg.public as any)?.appTitle
    state.loaded = true
    return state
  }

  return {
    state,
    ensureLoaded,
    // Helper getters that auto trigger load on client
    async getApiBase() {
      await ensureLoaded()
      return state.apiBaseUrl
    },
    async getImageBase() {
      await ensureLoaded()
      return state.imageBaseUrl
    },
    async getAppTitle() {
      await ensureLoaded()
      return state.appTitle
    }
  }
}
