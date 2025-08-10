import { ref, watchEffect } from 'vue'
import { collectionsService } from '@/services/collections.service'

export interface Collection {
  id: number
  name: string
  description: string
  imageUrl: string
  isPublished: boolean
}

export function useCollectionsService() {
  const q = ref('')
  const pagination = ref({ page: 1, pageSize: 20, total: 0 })
  const collections = ref<Collection[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCollections(options?: { search?: string, pagination?: { page: number, pageSize: number }, sort?: { field: string, reverse: boolean } }) {
    loading.value = true
    error.value = null
    try {
      const opts = {
        search: options?.search ?? q.value,
        pagination: {
          start: ((options?.pagination?.page ?? pagination.value.page) - 1) * (options?.pagination?.pageSize ?? pagination.value.pageSize),
          number: options?.pagination?.pageSize ?? pagination.value.pageSize
        },
        sort: options?.sort ?? { field: 'Id', reverse: false }
      }
      const response = await collectionsService.getCollections(opts)
      if (response.success) {
        collections.value = response.data?.items || []
        if (typeof response.data?.totalRecord === 'number') {
          pagination.value.total = response.data.totalRecord
        }
      } else {
        throw new Error(response.message)
      }
    } catch (err: any) {
      error.value = err.message || 'Lỗi lấy dữ liệu bộ sưu tập'
    } finally {
      loading.value = false
    }
  }

  watchEffect(() => {
    fetchCollections()
  })

  return {
    q,
    pagination,
    collections,
    loading,
    error,
    fetchCollections
  }
}
