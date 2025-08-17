import { ref, onMounted } from 'vue'
import { supplierService } from '@/services/supplier.service'
import type { Supplier, SuppliersApiResponse } from '@/services/supplier.service'
import type { ApiResponse } from '@/types/common'

export const useSuppliersService = () => {
  const data = ref<Supplier[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchSuppliers = async () => {
    loading.value = true
    error.value = null
    try {
  const res = await supplierService.getSuppliers() as unknown as ApiResponse<SuppliersApiResponse['data']>
      if (res.success && res.data && Array.isArray(res.data.items)) {
        data.value = res.data.items.filter((s: Supplier) => !s.isDeleted)
      } else {
        data.value = []
        error.value = res.message || 'Lỗi tải nhà cung cấp'
      }
    } catch (e) {
      data.value = []
      error.value = (e instanceof Error ? e.message : 'Lỗi tải nhà cung cấp')
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchSuppliers)

  return {
    data,
    loading,
    error
  }
}
