import { ref, computed } from 'vue'
import { useApiFetch } from '@/composables/useApiFetch'
import { getApiEndpoints } from '@/utils/api'
import type { Row } from '@tanstack/table-core'
import { getPaginationRowModel } from '@tanstack/table-core'

export interface NewsItem {
  id: number
  title: string
  desc: string
  url: string
  content: string
  imageUrl?: string
  createdDate: string
  categories: Array<{
    id: number
    name: string
    url?: string
  }>
}

export interface NewsApiResponse {
  code: string
  success: boolean
  message: string
  data: {
    items: NewsItem[]
    totalRecord: number
    numberOfPages: number
  }
}

export const useNews = () => {
  const toast = useToast()
  const table = useTemplateRef('table')

  const q = ref('')
  const rowSelection = ref({})
  const pagination = ref({
    pageIndex: 0,
    pageSize: 10
  })

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

  const endpoints = getApiEndpoints()
  const { data, pending: loading, error } = useApiFetch<NewsApiResponse>(endpoints.news, {
    method: 'POST',
    body,
    default: () => ({ code: '', success: false, message: '', data: { items: [], totalRecord: 0, numberOfPages: 0 } })
  })

  const news = computed(() => data.value.data?.items || [])

  const filtered = computed(() =>
    news.value.filter(item => item.title.toLowerCase().includes(q.value.toLowerCase()))
  )

  function truncateText(text: string, wordLimit: number = 20): string {
    if (!text) return ''
    const words = text.split(' ')
    if (words.length <= wordLimit) return text
    return words.slice(0, wordLimit).join(' ') + '...'
  }

  function getRowItems(row: Row<NewsItem>) {
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
        label: 'Edit news',
        icon: 'i-lucide-edit'
      },
      {
        type: 'separator'
      },
      {
        label: 'Delete news',
        icon: 'i-lucide-trash',
        color: 'error',
        onSelect() {
          toast.add({
            title: 'News deleted',
            description: 'The news has been deleted.'
          })
        }
      }
    ]
  }

  // Debug API response
  watch(data, (val) => {
    console.log('API Response:', val)
  }, { immediate: true, deep: true })

  return {
    // Data
    q,
    rowSelection,
    pagination,
    news,
    filtered,
    loading,
    error,
    table,
    data,
    
    // Methods
    truncateText,
    getRowItems,
    
    // TanStack Table
    getPaginationRowModel
  }
}
