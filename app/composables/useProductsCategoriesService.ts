import { computed } from 'vue'
import { useApiFetch } from '@/composables/useApiFetch'
import { API_ENDPOINTS } from '@/utils/api'

export interface ProductCategory {
  id: number
  name: string
  description: string
  sortOrder: number
  isDeleted: boolean
  parentId?: number
  categories: ProductCategory[]
  imageUrl?: string
}

export interface ProductCategoriesApiResponse {
  code: string
  success: boolean
  message: string
  data: ProductCategory[]
}

export const useProductsCategoriesService = () => {
  const { accessToken } = useAuthService()
  
  // Fetch data from API using POST with required body
  const { data: response, error, pending: loading } = useApiFetch<ProductCategoriesApiResponse>(
    API_ENDPOINTS.productCategories,
    {
      method: 'POST',
      headers: computed(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken.value}`
      })),
      body: {
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
