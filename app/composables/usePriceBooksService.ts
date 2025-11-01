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

export function usePriceBooksService() {
  const q = ref('')
  const rowSelection = ref<Record<string, boolean>>({})
  const pagination = ref({ pageIndex: 0, pageSize: 20 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentTab = ref<'all' | 'branch' | 'customer-group' | 'channel'>('all')

  const allData = ref<PriceBookItem[]>([])

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

  // Simple in-memory cache per app lifetime (SWR style)
  // key: 'all' | 'Warehouse' | 'CustomerGroup' | 'Channel'
  const byTypeCache: Map<string, { ui: PriceBookItem[]; raw: unknown[]; ts: number }> = (usePriceBooksService as any)._cache
    || new Map<string, { ui: PriceBookItem[]; raw: unknown[]; ts: number }>()
  ;(usePriceBooksService as any)._cache = byTypeCache

  const fetchPriceBooks = async () => {
    loading.value = true
    error.value = null
    try {
      const mapType = (t: string): 'Warehouse' | 'CustomerGroup' | 'Channel' | undefined => {
        switch (t) {
          case 'branch': return 'Warehouse'
          case 'customer-group': return 'CustomerGroup'
          case 'channel': return 'Channel'
          default: return undefined
        }
      }
      const t = mapType(currentTab.value)
      const cacheKey = t ?? 'all'

      // 1) Serve cache immediately if available
      const cached = byTypeCache.get(cacheKey)
      if (cached && Array.isArray(cached.ui)) {
        allData.value = cached.ui.slice()
      }

      // 2) Network request (revalidate)
      const res = await priceBooksService.getByType(t)
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
      const nextUi = list.map((it, idx): PriceBookItem => ({
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

      // 3) Only update UI if changed vs cache
      const same = (() => {
        if (!cached) return false
        try {
          const pick = (arr: PriceBookItem[]) => arr.map(x => ({ id: x.id, code: x.code, name: x.name, type: x.type, status: x.status, adjustment: x.adjustment }))
          return JSON.stringify(pick(cached.ui)) === JSON.stringify(pick(nextUi))
        } catch { return false }
      })()

      if (!same) {
        allData.value = nextUi
        byTypeCache.set(cacheKey, { ui: nextUi, raw: list as unknown[], ts: Date.now() })
      } else if (!cached) {
        // No cache existed (unlikely path), still set it
        byTypeCache.set(cacheKey, { ui: nextUi, raw: list as unknown[], ts: Date.now() })
      }
    } catch (e) {
      console.error('fetchPriceBooks failed:', e)
      error.value = 'Không thể tải dữ liệu'
      allData.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    q,
    rowSelection,
    pagination,
    priceBooks: filtered,
    loading,
    error,
    totalPages,
    totalRecords,
    currentTab,
    fetchPriceBooks
  }
}
