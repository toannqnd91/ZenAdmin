import { ref, computed, watch } from 'vue'
import { productService, fileService } from '@/services'
import type { ProductItem } from '@/composables/useProducts'
import type { Row } from '@tanstack/table-core'
import { getPaginationRowModel } from '@tanstack/table-core'

// Module-level cache for products list (persists across component mounts)
type ProdCacheEntry = { items: ProductItem[]; totalRecords: number; totalPages: number; checksum: string; ts: number }
const PRODUCTS_CACHE: Record<string, ProdCacheEntry> = {}
type FetchOptions = {
  search?: string
  categoryId?: number
  warehouseId?: number | string | null
  hasOptions?: boolean
  pagination?: { start: number; number: number }
  sort?: { field: string; reverse: boolean }
}

export const useProductsService = () => {
  const toast = useToast()
  const table = useTemplateRef('table')

  // Reactive state
  const q = ref('')
  const warehouseId = ref<number | string | null>(null)
  const rowSelection = ref({})
  const pagination = ref({
    pageIndex: 0,
    pageSize: 15
  })

  // Data state
  const products = ref<ProductItem[]>([])
  const loading = ref(false)
  const refreshing = ref(false)
  const error = ref<Error | null>(null)
  const totalRecords = ref(0)
  const totalPages = ref(0)

  // Computed
  const filtered = computed(() =>
    products.value.filter(item =>
      item.name.toLowerCase().includes(q.value.toLowerCase())
    )
  )

  async function deleteProductsMulti(ids: number[]) {
    try {
      const response = await productService.deleteProductsMulti(ids)
      if (response.success) {
        // Remove from local state
        products.value = products.value.filter(p => !ids.includes(p.id))
        toast.add({
          title: 'Thông báo',
          description: 'Xoá sản phẩm đã chọn thành công!'
        })
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete products'
      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error'
      })
    }
  }

  // Methods
  // Simple module-scoped cache for products list keyed by filters/pagination
  const makeKey = (opts: FetchOptions | undefined) => {
    const keyObj = {
      q: String(opts?.search ?? '').trim(),
      warehouseId: opts?.warehouseId ?? null,
      start: Number(opts?.pagination?.start ?? pagination.value.pageIndex * pagination.value.pageSize),
      number: Number(opts?.pagination?.number ?? pagination.value.pageSize)
    }
    return JSON.stringify(keyObj)
  }
  const makeChecksum = (items: ProductItem[], totalR: number, totalP: number) => {
    try {
      return JSON.stringify({ items, totalR, totalP })
    } catch {
      return `${items?.length || 0}:${totalR}:${totalP}`
    }
  }

  async function fetchProducts(options?: FetchOptions) {
    error.value = null
    const key = makeKey(options)
    const cached = PRODUCTS_CACHE[key]
    if (cached) {
      // serve cached immediately
      products.value = cached.items.slice()
      totalRecords.value = cached.totalRecords
      totalPages.value = cached.totalPages
      loading.value = false
      refreshing.value = true
    } else {
      loading.value = true
      refreshing.value = false
    }

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
        const items = (response.data?.items as ProductItem[]) || []
        const nextTotalR = Number(response.data?.totalRecord || 0)
        const nextTotalP = Number(response.data?.numberOfPages || 0)
        const nextChecksum = makeChecksum(items, nextTotalR, nextTotalP)
        if (!cached || nextChecksum !== cached.checksum) {
          products.value = items
          totalRecords.value = nextTotalR
          totalPages.value = nextTotalP
          PRODUCTS_CACHE[key] = {
            items: items.slice(),
            totalRecords: nextTotalR,
            totalPages: nextTotalP,
            checksum: nextChecksum,
            ts: Date.now()
          }
        }
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
      refreshing.value = false
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
      const errorMessage
        = err instanceof Error ? err.message : 'Failed to create product'
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

  async function updateProduct(
    id: number,
    data: Partial<{
      name: string
      description: string
      content: string
      price: number
      sku: string
      categoryIds: number[]
      imageUrls: string[]
      isFeatured: boolean
      isInStock: boolean
    }>
  ) {
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
      const errorMessage
        = err instanceof Error ? err.message : 'Failed to update product'
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
      const errorMessage
        = err instanceof Error ? err.message : 'Failed to delete product'
      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error'
      })
    }
  }

  function truncateText(
    text: string | null | undefined,
    wordLimit: number = 20
  ): string {
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
  const doFetch = () => {
    fetchProducts({
      search: q.value,
      warehouseId: warehouseId.value,
      pagination: {
        start: pagination.value.pageIndex * pagination.value.pageSize,
        number: pagination.value.pageSize
      }
    })
  }

  const debouncedFetch = useDebounceFn(doFetch, 500)

  // Watch search query with debounce
  watch(q, () => {
    if (pagination.value.pageIndex !== 0) {
      pagination.value.pageIndex = 0
    }
    debouncedFetch()
  })

  // Watch pagination and warehouseId immediately
  watch(
    [pagination, warehouseId],
    () => {
      doFetch()
    },
    { deep: true }
  )

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
    warehouseId,
    rowSelection,
    pagination,
    totalRecords: computed(() => totalRecords.value),
    totalPages: computed(() => totalPages.value),
    products: computed(() => products.value),
    filtered,
  loading: readonly(loading),
  refreshing: readonly(refreshing),
    error: readonly(error),
    table,

    // Methods
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProductsMulti,
    truncateText,
    getFirstImageUrl,
    getRowItems,

    // TanStack Table
    getPaginationRowModel
  }
}
