import { ref } from 'vue'
import { locationService } from '@/services/location.service'

export interface LocationOption {
  id: number | string
  name: string
  code?: number | string
  division_type?: string
}

// Module-level caches (shared across composable callers)
const provincesCache = ref<LocationOption[] | null>(null)
const wardsCache = ref<Record<string | number, LocationOption[]>>({})
const provincesLoading = ref(false)
const wardsLoading = ref<Record<string | number, boolean>>({})
const provincesLoadedAt = ref<number | null>(null)
// Optional TTL (ms). Set to 0 or null to disable expiration.
const PROVINCES_TTL = 0

function isExpired(ts: number | null) {
  if (!ts) return true
  if (!PROVINCES_TTL) return false
  return Date.now() - ts > PROVINCES_TTL
}

async function ensureProvincesLoaded() {
  if (provincesCache.value && !isExpired(provincesLoadedAt.value)) return
  if (provincesLoading.value) return
  try {
    provincesLoading.value = true
    const res = await locationService.getProvinces()
    const list = Array.isArray(res?.data) ? res.data as LocationOption[] : []
    provincesCache.value = list.map(p => ({ id: p.id, name: p.name, code: p.code, division_type: p.division_type }))
    provincesLoadedAt.value = Date.now()
  } catch (e) {
    console.error('Failed to load provinces', e)
    provincesCache.value = []
  } finally {
    provincesLoading.value = false
  }
}

async function fetchProvinces(search: string) {
  await ensureProvincesLoaded()
  const q = (search || '').toLowerCase()
  const source = provincesCache.value || []
  return q ? source.filter(x => String(x.name).toLowerCase().includes(q)) : source
}

async function fetchWardsByProvinceCode(provinceCode: string | number, search: string) {
  if (!provinceCode) return []
  if (!wardsCache.value[provinceCode]) {
    if (!wardsLoading.value[provinceCode]) {
      wardsLoading.value[provinceCode] = true
      try {
        const res = await locationService.getWardsByProvinceCode(provinceCode)
        const list = Array.isArray(res?.data) ? res.data as LocationOption[] : []
        wardsCache.value[provinceCode] = list.map(w => ({ id: w.id, name: w.name, code: w.code, division_type: w.division_type }))
      } catch (e) {
        console.error('Failed to load wards for province', provinceCode, e)
        wardsCache.value[provinceCode] = []
      } finally {
        wardsLoading.value[provinceCode] = false
      }
    } else {
      // If already loading, wait a short tick (simple polling) -- could be improved with event bus
      await new Promise(r => setTimeout(r, 120))
      return fetchWardsByProvinceCode(provinceCode, search)
    }
  }
  const q = (search || '').toLowerCase()
  const source = wardsCache.value[provinceCode] || []
  return q ? source.filter(x => String(x.name).toLowerCase().includes(q)) : source
}

export function useLocations() {
  // Expose functions shaped for RemoteSearchSelect usage
  async function getProvinces(search: string) {
    return fetchProvinces(search)
  }
  async function getWards(search: string, provinceCode?: string | number | null) {
    if (!provinceCode) return []
    return fetchWardsByProvinceCode(provinceCode, search)
  }
  function clearProvinceCache() {
    provincesCache.value = null
    provincesLoadedAt.value = null
  }
  function clearWardsCache(provinceCode?: string | number) {
    if (provinceCode) {
      const clone: Record<string | number, LocationOption[]> = {}
      for (const key in wardsCache.value) {
        if (String(key) !== String(provinceCode)) {
          const arr = wardsCache.value[key]
          if (arr) clone[key] = arr
        }
      }
      wardsCache.value = clone
    } else {
      wardsCache.value = {}
    }
  }
  return {
    // Caches (readonly usage in components if needed)
    getProvinces,
    getWards,
    clearProvinceCache,
    clearWardsCache
  }
}
