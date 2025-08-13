import { ref, onMounted } from 'vue'
import { brandService, type Brand } from '@/services/brand.service'

export const useBrandsService = () => {
  const data = ref<Brand[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchBrands = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await brandService.getBrands()
      if (response && Array.isArray(response)) {
        data.value = response
      } else if (response?.data?.items) {
        data.value = response.data.items
      } else {
        data.value = []
      }
    } catch (err: any) {
      error.value = err?.message || 'Lỗi khi tải danh sách thương hiệu'
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchBrands)

  return {
    data,
    loading,
    error,
    fetchBrands
  }
}
