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
      }
      const list = (res?.data || []) as ServerPB[]
      const fmtAdj = (v: unknown): string => {
        const n = Number(v)
        if (!Number.isFinite(n) || !n) return '---'
        return `${n > 0 ? '+' : ''}${n}%`
      }
      const toUiType = (t: unknown): PriceBookItem['type'] => {
        const s = String(t ?? '')
        if (/warehouse/i.test(s)) return 'Theo chi nhánh'
        if (/customer/i.test(s)) return 'Theo nhóm khách hàng'
        if (/channel/i.test(s)) return 'Theo kênh bán hàng'
        return 'Theo nhóm khách hàng'
      }
      allData.value = list.map((it, idx): PriceBookItem => ({
        id: String(it.id ?? it.code ?? idx),
        code: String(it.code ?? ''),
        name: String(it.name ?? ''),
        type: toUiType(it.type ?? it.priceBookType),
        status: (it.statusText ?? ((it.status === 1 || it.status === 'Active') ? 'Đang áp dụng' : 'Tạm dừng')) as PriceBookItem['status'],
        adjustment: fmtAdj(it.defaultAdjustmentPercent ?? it.DefaultAdjustmentPercent ?? it.adjustmentPercent)
      }))
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
