import { ref } from 'vue'
import { ordersService, type CancelOrderRequest, type CancelOrderResponseData } from '@/services/orders.service'

export function useOrderCancel() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function cancelOrder(
    orderCode: string, 
    request: CancelOrderRequest
  ): Promise<CancelOrderResponseData | null> {
    isLoading.value = true
    error.value = null

    try {
      const response = await ordersService.cancelOrder(orderCode, request)

      if (response?.success && response.data) {
        return response.data
      } else {
        error.value = response?.message || 'Hủy đơn hàng thất bại'
        return null
      }
    } catch (err: any) {
      error.value = err.message || 'Có lỗi xảy ra khi hủy đơn hàng'
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    cancelOrder
  }
}
