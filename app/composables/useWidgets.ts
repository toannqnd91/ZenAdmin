import { ref, computed } from 'vue'
import { widgetsService } from '@/services/widgets.service'

export interface WidgetInstance {
  id: number
  name: string
  widgetType: string
  widgetZone: string
  createdOn: string
  editUrl: string
  publishStart: string
  publishEnd: string | null
  displayOrder: number
}

export function useWidgets() {
  const q = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const widgetsRaw = ref<WidgetInstance[]>([])

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

  // Filtered widgets by search query
  const filteredWidgets = computed<WidgetInstance[]>(() => {
    if (!q.value) return widgetsRaw.value
    return widgetsRaw.value.filter((w) =>
      w.name?.toLowerCase().includes(q.value.toLowerCase()) ||
      w.widgetType?.toLowerCase().includes(q.value.toLowerCase()) ||
      w.widgetZone?.toLowerCase().includes(q.value.toLowerCase())
    )
  })

  // Placeholder for CRUD
  async function deleteWidget(id: number) {
    // TODO: implement API call
    widgetsRaw.value = widgetsRaw.value.filter((w) => w.id !== id)
  }

  // Format date
  function formatDate(date: string) {
    return date ? new Date(date).toLocaleString() : ''
  }

  return {
    q,
    loading,
    error,
    widgets: widgetsRaw,
    filteredWidgets,
    fetchWidgets,
    deleteWidget,
    formatDate
  }
}
