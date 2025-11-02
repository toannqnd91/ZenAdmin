import { ref, computed } from 'vue'
import { priceBooksService } from '@/services'

export interface PriceBookItem {
  id: string
  code: string
  name: string
  type: 'Theo chi nhánh' | 'Theo nhóm khách hàng' | 'Theo kênh bán hàng'
  status: 'Đang áp dụng' | 'Tạm dừng'
  adjustment: string // "+10%" or "---"
}

// Global (module-scoped) cache for pricebooks by type
// Using loose typing here to avoid parser issues in some environments
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const __PB_BY_TYPE_CACHE__: any = {}

export function usePriceBooksService() {
  const q = ref('')
  const rowSelection = ref<Record<string, boolean>>({})
  const pagination = ref({ pageIndex: 0, pageSize: 20 })
  const loading = ref(false)
  // Optional: a separate flag to indicate background refresh when serving cache
  const refreshing = ref(false)
  const error = ref<string | null>(null)
  const currentTab = ref<'all' | 'branch' | 'customer-group' | 'channel'>('all')

  const allData = ref<PriceBookItem[]>([])

  // Simple in-memory cache shared across composable instances
  // Keyed by logical tab: 'all' | 'branch' | 'customer-group' | 'channel'
  // Using module-scoped singleton cache so it survives across component unmounts
  const cacheStore = __PB_BY_TYPE_CACHE__

  const cacheKeyOf = (tab: 'all' | 'branch' | 'customer-group' | 'channel') => tab
  const checksum = (obj: unknown) => {
    try {
      return JSON.stringify(obj)
    } catch {
      return ''
    }
  }

  const filtered = computed(() => {
    const term = q.value.trim().toLowerCase()
    const byTab = (item: PriceBookItem) => {
      switch (currentTab.value) {
        case 'branch': return item.type === 'Theo chi nhánh'
        case 'customer-group': return item.type === 'Theo nhóm khách hàng'
        case 'channel': return item.type === 'Theo kênh bán hàng'
        default: return true
      }
    }
    return allData.value.filter((it) => {
      if (!byTab(it)) return false
      if (!term) return true
      return (
        it.code.toLowerCase().includes(term)
        || it.name.toLowerCase().includes(term)
        || it.type.toLowerCase().includes(term)
      )
    })
  })

  const totalRecords = computed(() => filtered.value.length)
  const totalPages = computed(() => 1)

  const fetchPriceBooks = async () => {
    error.value = null
    const key = cacheKeyOf(currentTab.value)
    const cached = cacheStore[key]
    if (cached) {
      // Serve cached instantly without blocking UI
      allData.value = cached.mapped.slice()
      loading.value = false
      refreshing.value = true
    } else {
      loading.value = true
      refreshing.value = false
    }
    try {
      const mapType = (t: string): 'Warehouse' | 'CustomerGroup' | 'Channel' | undefined => {
        switch (t) {
          case 'branch': return 'Warehouse'
          case 'customer-group': return 'CustomerGroup'
          case 'channel': return 'Channel'
          default: return undefined
        }
      }
      const res = await priceBooksService.getByType(mapType(currentTab.value))
      type ServerPB = {
        id?: string | number
        code?: string
        name?: string
        type?: string
        priceBookType?: string
        status?: number | string
        statusText?: string
        defaultAdjustmentPercent?: number
        DefaultAdjustmentPercent?: number
        adjustmentPercent?: number
        // New from API: adjustmentMode (0: decrease, 1: increase)
        adjustmentMode?: number | string
      }
      const list = (res?.data || []) as ServerPB[]
      const fmtAdj = (percent: unknown, mode: unknown): string => {
        const raw = Number(percent)
        if (!Number.isFinite(raw) || raw === 0) return '---'
        // Normalize mode: 0 => '-', 1 => '+'; also accept strings 'decrease'/'increase'
        const m = typeof mode === 'string' ? mode.toLowerCase() : mode
        const isIncrease = (m === 1) || (m === 'increase') || (m === 'inc') || (m === '+')
        const isDecrease = (m === 0) || (m === 'decrease') || (m === 'dec') || (m === '-')
        const abs = Math.abs(raw)
        if (isIncrease) return `+${abs}%`
        if (isDecrease) return `-${abs}%`
        // Fallback: infer from sign if mode missing/unknown
        return `${raw > 0 ? '+' : ''}${raw}%`
      }
      const toUiType = (t: unknown): PriceBookItem['type'] => {
        const s = String(t ?? '')
        if (/warehouse/i.test(s)) return 'Theo chi nhánh'
        if (/customer/i.test(s)) return 'Theo nhóm khách hàng'
        if (/channel/i.test(s)) return 'Theo kênh bán hàng'
        return 'Theo nhóm khách hàng'
      }
      const mapped = list.map((it, idx): PriceBookItem => ({
        id: String(it.id ?? it.code ?? idx),
        code: String(it.code ?? ''),
        name: String(it.name ?? ''),
        type: toUiType(it.type ?? it.priceBookType),
        status: (it.statusText ?? ((it.status === 1 || it.status === 'Active') ? 'Đang áp dụng' : 'Tạm dừng')) as PriceBookItem['status'],
        adjustment: fmtAdj(
          it.defaultAdjustmentPercent ?? it.DefaultAdjustmentPercent ?? it.adjustmentPercent,
          it.adjustmentMode
        )
      }))

      // Compute checksums to decide whether to update UI and cache
      const nextChecksum = checksum(mapped)
      if (!cached || nextChecksum !== cached.checksum) {
        allData.value = mapped
        cacheStore[key] = { mapped, checksum: nextChecksum, ts: Date.now() }
      }
    } catch (e) {
      console.error('fetchPriceBooks failed:', e)
      error.value = 'Không thể tải dữ liệu'
      if (!cached) {
        allData.value = []
      }
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  return {
    q,
    rowSelection,
    pagination,
    priceBooks: filtered,
    loading,
    refreshing,
    error,
    totalPages,
    totalRecords,
    currentTab,
    fetchPriceBooks
  }
}
