import { ref, watchEffect } from 'vue'
import { pagesService } from '@/services/pages.service'

export function usePagesService() {
  const q = ref('')
  const rowSelection = ref<Record<string, boolean>>({})
  const pagination = ref({ pageIndex: 0, pageSize: 20 })
  const pages = ref([])
  const loading = ref(false)
  const error = ref('')

  async function fetchPages() {
    loading.value = true
    error.value = ''
    try {
      const res = await pagesService.getPages({
        search: q.value,
        pagination: {
          start: pagination.value.pageIndex * pagination.value.pageSize,
          number: pagination.value.pageSize
        }
      })
      pages.value = res.data?.items || []
    } catch (e: any) {
      error.value = e.message || 'Failed to load pages'
    } finally {
      loading.value = false
    }
  }

  watchEffect(fetchPages)

  return {
    q,
    rowSelection,
    pagination,
    pages,
    loading,
    error
  }
}
