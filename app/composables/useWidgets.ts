import { ref, computed } from 'vue'
import { widgetsService } from '@/services/widgets.service'

export interface WidgetInstance {
  id: number
  name: string
  widgetType: string
  widgetZone: string
  createdOn: string
  editUrl: string
  publishStart: string | null
  publishEnd: string | null
  displayOrder: number
}

export function useWidgets() {
  const q = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const widgetsRaw = ref<WidgetInstance[]>([])
  const toast = useToast?.() || { add: console.log }

  // Fetch all widgets
  async function fetchWidgets() {
    loading.value = true
    error.value = null
    try {
      const response = await widgetsService.getWidgets()
      if (response.success === false) throw new Error(response.message || 'Failed to fetch widgets')
      widgetsRaw.value = response.data || []
    } catch (err) {
      error.value = (err as Error).message || 'Failed to fetch widgets'
    } finally {
      loading.value = false
    }
  }

  // Reorder widgets via API (POST /api/v1/widget-instances/reorder)
  async function reorderWidgets(newOrder: WidgetInstance[]) {
    if (!Array.isArray(newOrder) || !newOrder.length) return
    // Build payload using index as displayOrder
    const itemsZero = newOrder.map((w, idx) => ({ id: w.id, displayOrder: idx }))
    let res: any = null
    try {
      res = await widgetsService.reorderWidgets(itemsZero)
      if (res?.success !== true) {
        // Fallback: one-based
        const itemsOne = newOrder.map((w, idx) => ({ id: w.id, displayOrder: idx + 1 }))
        res = await widgetsService.reorderWidgets(itemsOne)
      }
      if (res?.success === true) {
        widgetsRaw.value = [...newOrder]
        toast.add?.({ title: 'Thành công', description: 'Cập nhật thứ tự widget thành công' })
      } else {
        toast.add?.({ title: 'Error', description: 'Failed to reorder', color: 'error' })
        await fetchWidgets()
      }
    } catch {
      toast.add?.({ title: 'Error', description: 'Reorder failed', color: 'error' })
      await fetchWidgets()
    }
  }

  // Filtered widgets by search query
  const filteredWidgets = computed<WidgetInstance[]>(() => {
    if (!q.value) return widgetsRaw.value
    const search = q.value.toLowerCase()
    return widgetsRaw.value.filter(w =>
      w.name?.toLowerCase().includes(search)
      || w.widgetType?.toLowerCase().includes(search)
      || w.widgetZone?.toLowerCase().includes(search)
    )
  })

  // Placeholder for CRUD
  async function deleteWidget(id: number) {
    // TODO: implement API call
    widgetsRaw.value = widgetsRaw.value.filter(w => w.id !== id)
  }

  // Format date
  function formatDate(date: string | null) {
    if (!date) return '-'

    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return '-'

      const day = d.getDate().toString().padStart(2, '0')
      const month = (d.getMonth() + 1).toString().padStart(2, '0')
      const year = d.getFullYear()
      const hours = d.getHours().toString().padStart(2, '0')
      const minutes = d.getMinutes().toString().padStart(2, '0')

      return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch {
      return '-'
    }
  }

  return {
    q,
    loading,
    error,
    widgets: widgetsRaw,
    filteredWidgets,
    fetchWidgets,
    deleteWidget,
    reorderWidgets,
    formatDate
  }
}
