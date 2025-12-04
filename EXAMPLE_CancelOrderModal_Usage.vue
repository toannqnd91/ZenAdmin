<script setup lang="ts">
import { ref } from 'vue'
import CancelOrderModal from '@/components/orders/CancelOrderModal.vue'
import { useOrderCancel } from '@/composables/useOrderCancel'
import type { CancelOrderRequest } from '@/services/orders.service'

// Example order data
const orderCode = ref('HD000086')
const orderTotal = ref(500000)
const isPaid = ref(true)

// Modal state
const showCancelModal = ref(false)

// Use the composable
const { isLoading, error, cancelOrder } = useOrderCancel()

// Handle cancel confirmation
async function handleCancelConfirm(request: CancelOrderRequest) {
  const result = await cancelOrder(orderCode.value, request)
  
  if (result) {
    // Success - show notification
    console.log('Order cancellation submitted:', result)
    console.log('Order Code:', result.orderCode)
    console.log('Saga ID:', result.sagaId)
    console.log('Status:', result.orderStatus)
    // You can show a toast notification here
    // toast.success(`Đơn hàng ${result.orderCode} đang được xử lý hủy`)
  } else {
    // Error - show error message
    console.error('Cancel failed:', error.value)
    // toast.error(error.value || 'Hủy đơn hàng thất bại')
  }
}
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Example: Cancel Order Modal</h1>
    
    <!-- Trigger button -->
    <UButton
      color="error"
      @click="showCancelModal = true"
    >
      Hủy đơn hàng
    </UButton>

    <!-- Cancel Order Modal -->
    <CancelOrderModal
      v-model="showCancelModal"
      :order-code="orderCode"
      :order-total="orderTotal"
      :is-paid="isPaid"
      @confirm="handleCancelConfirm"
    />

    <!-- Loading state -->
    <div v-if="isLoading" class="mt-4 text-gray-600">
      Đang xử lý...
    </div>

    <!-- Error message -->
    <div v-if="error" class="mt-4 text-red-600">
      {{ error }}
    </div>
  </div>
</template>
