import { ref, computed } from 'vue'
import { useApiFetch } from '@/composables/useApiFetch'
import { getApiEndpoints } from '@/utils/api'
import type { NewsCategoriesApiResponse, NewsCategory } from '@/types/newsCategory'
import type { Row } from '@tanstack/table-core'

export const useNewsCategoriesService = () => {
  const toast = useToast()
  const { accessToken } = useAuthService()

  // Reactive state
  const q = ref('')
  const rowSelection = ref({})
  const pagination = ref({
    pageIndex: 0,
    pageSize: 10
  })

  // API request body
  const body = {
    Pagination: {
      Start: 0,
      TotalItemCount: 0,
      Number: 20,
      NumberOfPages: 10
    },
    Search: {
      QueryObject: {
        Name: null
      }
    },
    Sort: {
      Field: 'Id',
      Reverse: false
    }
  }

  // Fetch data
  const endpoints = getApiEndpoints()
  const { data, pending: loading, error } = useApiFetch<NewsCategoriesApiResponse>(endpoints.newsCategories, {
    method: 'POST',
    body,
    server: false
  })

  // Computed
  const categories = computed(() => (data.value as NewsCategoriesApiResponse)?.data || [])

  // Methods
  function getRowItems(row: Row<NewsCategory>) {
    return [
      {
        type: 'label',
        label: 'Actions'
      },
      {
        label: 'Copy ID',
        icon: 'i-lucide-copy',
        onSelect() {
          navigator.clipboard.writeText(row.original.id.toString())
          toast.add({
            title: 'Copied to clipboard',
            description: 'ID copied to clipboard'
          })
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'View details',
        icon: 'i-lucide-list'
      },
      {
        label: 'Edit category',
        icon: 'i-lucide-edit'
      },
      {
        type: 'separator'
      },
      {
        label: 'Delete category',
        icon: 'i-lucide-trash',
        color: 'error',
        onSelect() {
          toast.add({
            title: 'Category deleted',
            description: 'The category has been deleted.'
          })
        }
      }
    ]
  }

  return {
    // State
    q,
    rowSelection,
    pagination,

    // Data
    categories: readonly(categories),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    getRowItems
  }
}
