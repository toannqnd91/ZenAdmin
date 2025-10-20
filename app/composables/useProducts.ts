import { ref, computed } from 'vue'
import { useApiFetch } from '@/composables/useApiFetch'
import { getApiEndpoints, getImageBaseUrl } from '@/utils/api'
import type { Row } from '@tanstack/table-core'
import { getPaginationRowModel } from '@tanstack/table-core'

export interface ProductVariation {
  id: number
  name: string
  normalizedName: string
  sku: string | null
  gtin: string | null
  price: number | null
  oldPrice: number | null
  thumbnailImageUrl: string
  imageUrls: string[]
  optionCombinations: any[]
  stockQuantity: number
}

export interface ProductItem {
  id: number
  name: string
  sku: string
  priceMin: number | null
  priceMax?: number | null
  hasOptions: boolean
  isVisibleIndividually: boolean
  isFeatured: boolean
  isAllowToOrder: boolean
  isCallForPricing: boolean
  stockQuantity: number
  createdOn: string
  isPublished: boolean
  sold: number
  inventory?: number
  thumbnailImageUrl: string
  brand: {
    id: number
    name: string
    slug: string
  } | null
  categories: Array<{
    id: number
    name: string
    slug: string
  }>
  warehouses: Array<{
    id: number
    name: string
    address: string
    quantity: number
  }>
  variations?: ProductVariation[]
}

export interface ProductApiResponse {
  code: string
  success: boolean
  message: string
  data: ProductItem[]
}

export const useProducts = () => {
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
  const { data, pending: loading, error } = useApiFetch<ProductApiResponse>(endpoints.products, {
    method: 'POST',
    body
  })

  const products = computed(() => (data.value as ProductApiResponse)?.data || [])

  const filtered = computed(() =>
    products.value.filter(item => item.name.toLowerCase().includes(q.value.toLowerCase()))
  )

  function truncateText(text: string | null | undefined, wordLimit: number = 20): string {
    if (!text) return ''
    const words = text.split(' ')
    if (words.length <= wordLimit) return text
    return words.slice(0, wordLimit).join(' ') + '...'
  }

  function getFirstImageUrl(imageUrls: string[]): string | undefined {
    if (!imageUrls || imageUrls.length === 0) return undefined
    return `${getImageBaseUrl()}/image/${imageUrls[0]}`
  }

  function getRowItems(row: Row<ProductItem>) {
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
        label: 'Edit product',
        icon: 'i-lucide-edit'
      },
      {
        type: 'separator'
      },
      {
        label: 'Delete product',
        icon: 'i-lucide-trash',
        color: 'error',
        onSelect() {
          toast.add({
            title: 'Product deleted',
            description: 'The product has been deleted.'
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
    products,
    filtered,
    loading,
    error,
    table,
    data,

    // Methods
    truncateText,
    getFirstImageUrl,
    getRowItems,

    // TanStack Table
    getPaginationRowModel
  }
}
