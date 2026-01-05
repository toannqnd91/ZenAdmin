import { ref, onMounted } from 'vue'
import { productService } from '@/services/product.service'

export interface ProductCategory {
  id: number
  name: string
  description: string
  sortOrder: number
  isDeleted: boolean
  parentId?: number
  categories?: ProductCategory[]
  children?: ProductCategory[]
  imageUrl?: string
  productCount?: number
  // Extended detail fields (optional in list context)
  slug?: string
  metaTitle?: string | null
  metaKeywords?: string | null
  metaDescription?: string | null
  displayOrder?: number
  includeInMenu?: boolean
  isPublished?: boolean
  thumbnailImage?: string | null
  thumbnailImageUrl?: string | null
}

export const useProductsCategoriesService = () => {
  const data = ref<ProductCategory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCategories = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await productService.getCategories({
        pagination: { start: 0, number: 1000 }
      })
      
      // Response is ApiResponse<ProductCategory[]>, extract data
      const categories = (response as any).data || response
      
      // Filter out deleted categories
      data.value = Array.isArray(categories) 
        ? categories.filter((category: ProductCategory) => !category.isDeleted)
        : []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch categories'
      console.error('Error fetching product categories:', err)
    } finally {
      loading.value = false
    }
  }

  // Auto-fetch on mount (client-side only)
  onMounted(() => {
    fetchCategories()
  })

  return {
    data,
    loading,
    error,
    refresh: fetchCategories
  }
}
