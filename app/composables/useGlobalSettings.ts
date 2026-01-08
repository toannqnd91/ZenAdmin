import { settingsService, type AppSettingItem } from '@/services/settings.service'

/**
 * Composable to manage global application settings fetched from API
 */
export function useGlobalSettings() {
  // Global state for settings map
  const settingsMap = useState<Map<string, string>>('globalSettingsMap', () => new Map())
  const isLoaded = useState<boolean>('globalSettingsLoaded', () => false)

  /**
   * Fetch all settings from API and update state/local storage
   */
  async function fetchSettings() {
    try {
      const response = await settingsService.getAppSettings()
      // Support both { data: [...] } and directly [...]
      const items = Array.isArray(response) 
        ? response 
        : (response && Array.isArray((response as any).data) ? (response as any).data : [])

      if (items.length > 0) {
        // Update state
        const map = new Map<string, string>()
        items.forEach((item: AppSettingItem) => {
          map.set(item.id, item.value)
        })
        settingsMap.value = map
        isLoaded.value = true

        // Save to Local Storage for offline/quick access
        if (import.meta.client) {
          localStorage.setItem('app_settings_cache', JSON.stringify(items))
        }
        return true
      }
    } catch (error) {
      console.warn('Failed to fetch app settings:', error)
      return false
    }
  }

  /**
   * Initialize settings from LocalStorage if available (while waiting for API or if offline)
   */
  function initFromCache() {
    if (import.meta.client && !isLoaded.value) {
      const cached = localStorage.getItem('app_settings_cache')
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as AppSettingItem[]
          const map = new Map<string, string>()
          if (Array.isArray(parsed)) {
            parsed.forEach(item => map.set(item.id, item.value))
            settingsMap.value = map
            // We don't set isLoaded = true here because we still want to fetch fresh data if possible
            // or maybe we do depending on strategy. For now let's keep it false so bootstrap tries to fetch fresh.
          }
        } catch (e) {
          console.error('Failed to parse cached settings', e)
        }
      }
    }
  }

  /**
   * Get a specific setting value by key
   */
  function getSetting(key: string, defaultValue: string = ''): string {
    return settingsMap.value.get(key) || defaultValue
  }

  /**
   * Get setting as boolean
   */
  function getBoolean(key: string, defaultValue: boolean = false): boolean {
    const val = settingsMap.value.get(key)
    if (val === undefined || val === null) return defaultValue
    return val.toLowerCase() === 'true'
  }

  /**
   * Get setting as number
   */
  function getNumber(key: string, defaultValue: number = 0): number {
    const val = settingsMap.value.get(key)
    if (val === undefined || val === null) return defaultValue
    const num = Number(val)
    return isNaN(num) ? defaultValue : num
  }

  /**
   * Clear all settings (state and cache)
   */
  function clearSettings() {
    settingsMap.value = new Map()
    isLoaded.value = false
    if (import.meta.client) {
      localStorage.removeItem('app_settings_cache')
    }
  }

  return {
    settingsMap,
    isLoaded,
    fetchSettings,
    initFromCache,
    clearSettings,
    getSetting,
    getBoolean,
    getNumber
  }
}
