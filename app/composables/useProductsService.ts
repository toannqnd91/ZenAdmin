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
    pageSize: 15
  })

  // Data state
  const products = ref<ProductItem[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const totalRecords = ref(0)
  const totalPages = ref(0)

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
    hasOptions?: boolean
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }) {
    loading.value = true
    error.value = null

    try {
      // Truyền thêm HasOptions vào QueryObject nếu có
      const opts = { ...options }
      if (typeof options?.hasOptions !== 'undefined') {
        opts.hasOptions = options.hasOptions
      }
      // Always send sort by Id descending (newest first)
      opts.sort = { field: 'Id', reverse: true }
      const response = await productService.getProducts(opts)
      if (response.success) {
        // API trả về response.data.items
        products.value = (response.data?.items as ProductItem[]) || []
        totalRecords.value = Number(response.data?.totalRecord || 0)
        totalPages.value = Number(response.data?.numberOfPages || 0)
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      let errMsg = ''
      if (err instanceof Error) {
        error.value = err
        errMsg = err.message
      } else if (typeof err === 'object') {
        error.value = new Error(JSON.stringify(err))
        errMsg = JSON.stringify(err)
      } else {
        error.value = new Error(String(err))
        errMsg = String(err)
      }
      toast.add({
        title: 'Error',
        description: errMsg,
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
          title: 'Thông báo',
          description: 'Xoá sản phẩm thành công!'
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

  function getFirstImageUrl(imageUrls: string[]): string | null {
    if (!imageUrls || imageUrls.length === 0) return null
    const firstImage = imageUrls[0]
    return fileService.getFileUrl(firstImage)
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

  // Watch search query and pagination and refetch
  watch([q, pagination], () => {
    const searchValue = unref(q)
    fetchProducts({
      search: searchValue,
      pagination: {
        start: pagination.value.pageIndex * pagination.value.pageSize,
        number: pagination.value.pageSize
      }
    })
  }, { deep: true })

  // Initial fetch
  onMounted(() => {
    fetchProducts({
      pagination: {
        start: pagination.value.pageIndex * pagination.value.pageSize,
        number: pagination.value.pageSize
      }
    })
  })

  return {
    // Data
    q,
    rowSelection,
    pagination,
  totalRecords: computed(() => totalRecords.value),
  totalPages: computed(() => totalPages.value),
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
