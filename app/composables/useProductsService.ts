import { ref, computed, watch } from 'vue'
import { productService } from '@/services'
import { fileService } from '@/services'
import type { ProductItem } from '@/composables/useProducts'
import type { Row } from '@tanstack/table-core'
import { getPaginationRowModel } from '@tanstack/table-core'

export const useProductsService = () => {
  const toast = useToast()
  const table = useTemplateRef('table')

  // Reactive state
  const q = ref('')
  const rowSelection = ref({})
  const pagination = ref({
    pageIndex: 0,
    pageSize: 10
  })

  // Data state
  const products = ref<ProductItem[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // Computed
  const filtered = computed(() =>
    products.value.filter(item => 
      item.name.toLowerCase().includes(q.value.toLowerCase())
    )
  )

  // Methods
  async function fetchProducts(options?: {
    search?: string
    categoryId?: number
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }) {
    loading.value = true
    error.value = null

    try {
      const response = await productService.getProducts(options)
      if (response.success) {
        products.value = response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch products')
      toast.add({
        title: 'Error',
        description: error.value.message,
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  async function createProduct(data: {
    name: string
    description?: string
    content: string
    price?: number
    sku?: string
    categoryIds?: number[]
    imageUrls?: string[]
    isFeatured?: boolean
    isInStock?: boolean
  }) {
    loading.value = true

    try {
      const response = await productService.createProduct(data)
      if (response.success) {
        // Refresh the list
        await fetchProducts()
        toast.add({
          title: 'Success',
          description: 'Product created successfully'
        })
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product'
      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProduct(id: number, data: Partial<{
    name: string
    description: string
    content: string
    price: number
    sku: string
    categoryIds: number[]
    imageUrls: string[]
    isFeatured: boolean
    isInStock: boolean
  }>) {
    loading.value = true

    try {
      const response = await productService.updateProduct({ id, ...data })
      if (response.success) {
        // Refresh the list
        await fetchProducts()
        toast.add({
          title: 'Success',
          description: 'Product updated successfully'
        })
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product'
      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteProduct(id: number) {
    try {
      const response = await productService.deleteProduct(id)
      if (response.success) {
        // Remove from local state
        products.value = products.value.filter(p => p.id !== id)
        toast.add({
          title: 'Success',
          description: 'Product deleted successfully'
        })
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product'
      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error'
      })
    }
  }

  function truncateText(text: string | null | undefined, wordLimit: number = 20): string {
    if (!text) return ''
    const words = text.split(' ')
    if (words.length <= wordLimit) return text
    return words.slice(0, wordLimit).join(' ') + '...'
  }

  function getFirstImageUrl(imageUrls: string[]): string | undefined {
    if (!imageUrls || imageUrls.length === 0) return undefined
    const firstImage = imageUrls[0]
    return firstImage ? fileService.getFileUrl(firstImage) : undefined
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
          deleteProduct(row.original.id)
        }
      }
    ]
  }

  // Watch search query and refetch
  watchEffect(() => {
    const searchValue = unref(q)
    if (searchValue !== '') {
      fetchProducts({
        search: searchValue,
        pagination: {
          start: pagination.value.pageIndex * pagination.value.pageSize,
          number: pagination.value.pageSize
        }
      })
    }
  })

  // Initial fetch
  onMounted(() => {
    fetchProducts()
  })

  return {
    // Data
    q,
    rowSelection,
    pagination,
    products: computed(() => products.value),
    filtered,
    loading: readonly(loading),
    error: readonly(error),
    table,

    // Methods
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    truncateText,
    getFirstImageUrl,
    getRowItems,

    // TanStack Table
    getPaginationRowModel
  }
}
