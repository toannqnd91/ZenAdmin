import { useAppConfig } from '#imports'
import { useAppRuntimeConfig } from './useAppRuntimeConfig'

interface AppSettings {
  title: string
  description?: string
  favicon?: string
  team?: {
    label?: string
    avatar?: {
      src?: string
      alt?: string
    }
  }
}

let _cached: AppSettings | null = null
let _ts = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 phút (có thể chỉnh hoặc bỏ nếu không cần hết hạn)

export function useAppSettings(options?: { forceRefresh?: boolean }) {
  const cfg = useAppConfig() as any
  const now = Date.now()
  if (!_cached || options?.forceRefresh || (CACHE_TTL && now - _ts > CACHE_TTL)) {
    _cached = (cfg?.settings || {}) as AppSettings
    _ts = now
  }
  return _cached
}

// Unified app title hook: returns a ref that updates when dynamic runtime config loaded
export function useAppTitle() {
  const staticTitle = useAppSettings()?.title || 'App'
  const { state, ensureLoaded } = useAppRuntimeConfig()
  const titleRef = ref<string>(staticTitle)
  if (import.meta.client) {
    ensureLoaded().then(() => {
      if (state.appTitle) titleRef.value = state.appTitle
    })
  }
  return titleRef
}
