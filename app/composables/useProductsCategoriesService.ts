import { computed } from 'vue'
import { useApiFetch } from '@/composables/useApiFetch'
import { getApiEndpoints } from '@/utils/api'

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

export interface ProductCategoriesApiResponse {
  code: string
  success: boolean
  message: string
  data: ProductCategory[]
}

export const useProductsCategoriesService = (options?: { server?: boolean }) => {
  const { accessToken } = useAuthService()

  // Fetch data from API using POST with required body
  const { data: response, error, pending: loading } = useApiFetch<ProductCategoriesApiResponse>(
    getApiEndpoints().productCategories,
    {
      method: 'POST',
      server: options?.server ?? false, // Default to client-side only
      headers: computed(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken.value}`
      })),
      body: {
        Pagination: {
          Start: 0,
          TotalItemCount: 0,
          Number: 1000,
          NumberOfPages: 1
        },
        Search: {
          QueryObject: {
            Name: null
          }
        },
        Sort: {
          Field: 'Id',
          Reverse: true
        }
      }
    }
  )

  // Transform data - handle wrapped response structure
  const data = computed(() => {
    if (!response.value) {
      return []
    }

    // Response has structure: { code, success, message, data }
    const apiResponse = response.value as unknown as ProductCategoriesApiResponse
    if (apiResponse.success && apiResponse.data) {
      return apiResponse.data.filter((category: ProductCategory) => !category.isDeleted)
    }

    return []
  })

  return {
    data,
    loading,
    error
  }
}
