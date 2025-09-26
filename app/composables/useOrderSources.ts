// no local refs needed, using useState for shared caching
import { orderSourceService } from '@/services/order-source.service'
import type { OrderSourceItem } from '@/services/order-source.service'

interface AllSourceOption {
  id: null
  name: string
  code: string
}
type SourceUnion = OrderSourceItem | AllSourceOption

// Shared composable for order sources so multiple components (dashboard filter, order create page, etc.)
// can reuse one fetch + local filtering. Caches the list for the app lifetime.
export function useOrderSources() {
  const sources = useState<OrderSourceItem[] | null>('order-sources:list', () => null)
  const loading = useState<boolean>('order-sources:loading', () => false)
  const error = useState<string | null>('order-sources:error', () => null)
  const loaded = computed(() => Array.isArray(sources.value))

  async function ensure() {
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      const res = await orderSourceService.getOrderSources()
      const list: OrderSourceItem[] = Array.isArray(res?.data) ? res.data : []
      sources.value = list
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Không tải được nguồn đơn'
      error.value = msg
      sources.value = []
    } finally {
      loading.value = false
    }
  }

  function filter(query: string, includeAll = false): SourceUnion[] {
    const q = (query || '').toLowerCase()
    const base = Array.isArray(sources.value) ? sources.value : []
    const filtered = q
      ? base.filter(s => s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q))
      : base
    if (includeAll) {
      const all: AllSourceOption = { id: null, name: 'Tất cả', code: 'ALL' }
      return [all, ...filtered]
    }
    return filtered
  }

  return { sources, loading, error, loaded, ensure, filter }
}
