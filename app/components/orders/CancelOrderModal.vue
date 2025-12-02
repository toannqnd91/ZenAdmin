<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'

interface Props {
  modelValue?: boolean
  orderTotal?: number
  isPaid?: boolean // true if order has been paid
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  orderTotal: 0,
  isPaid: false
})

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'confirm': [{ refundOption: string, restockItems: boolean, reason: string }]
}>()

const open = ref<boolean>(props.modelValue)
watch(() => props.modelValue, (v) => {
  open.value = v
})
watch(open, v => emit('update:modelValue', v))

// Form state
const refundOption = ref('full')
const restockItems = ref(true)
const reason = ref('')

const cancelReasons = [
  { label: 'Lý do khác', value: 'other' },
  { label: 'Khách hàng yêu cầu', value: 'customer_request' },
  { label: 'Hết hàng', value: 'out_of_stock' },
  { label: 'Sai thông tin', value: 'wrong_info' },
  { label: 'Trùng đơn', value: 'duplicate' }
]

const selectedReason = ref<{ label: string, value: string } | null>(null)

async function fetchReasons() {
  return Promise.resolve(cancelReasons)
}

function formatCurrency(v?: number | null) {
  if (v == null || isNaN(v)) return '0đ'
  return new Intl.NumberFormat('vi-VN').format(v) + 'đ'
}

watch(open, (v) => {
  if (v) {
    // Reset form when opening
    refundOption.value = 'full'
    restockItems.value = true
    reason.value = ''
    selectedReason.value = null
  }
})

function confirm() {
  emit('confirm', {
    refundOption: refundOption.value,
    restockItems: restockItems.value,
    reason: selectedReason.value?.value || ''
  })
  open.value = false
}
</script>

<template>
  <BaseModal
    :model-value="open"
    title="Hủy đơn hàng"
    width-class="max-w-lg"
    @update:model-value="(v) => open = v"
  >
    <div class="space-y-6">
      <!-- Refund options (only show if order is paid) -->
      <div v-if="isPaid" class="space-y-3">
        <div class="text-sm font-medium text-gray-900">
          Hoàn trả
        </div>
        <div class="space-y-2">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="refundOption"
              type="radio"
              value="full"
              class="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
            >
            <span class="text-sm text-gray-700">Hoàn tiền {{ formatCurrency(orderTotal) }}</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="refundOption"
              type="radio"
              value="later"
              class="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
            >
            <span class="text-sm text-gray-700">Hoàn trả sau</span>
          </label>
        </div>
      </div>

      <!-- Restock checkbox -->
      <div>
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            v-model="restockItems"
            type="checkbox"
            class="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          >
          <span class="text-sm text-gray-700">Hoàn kho tất cả sản phẩm</span>
        </label>
      </div>

      <!-- Cancellation reason -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-900">Lý do hủy đơn</label>
        <AsyncSelect
          v-model="selectedReason"
          :fetch-fn="fetchReasons"
          label-field="label"
          :get-item-key="(item: any) => item.value as string"
          placeholder="Lý do khác"
          :searchable="false"
          :clearable="false"
          :full-width="true"
          :append-to-body="true"
        />
      </div>
    </div>

    <template #footer>
      <UButton
        color="neutral"
        variant="ghost"
        size="md"
        @click="open = false"
      >
        Không phải bây giờ
      </UButton>
      <UButton
        color="error"
        variant="solid"
        size="md"
        @click="confirm"
      >
        Hủy đơn hàng
      </UButton>
    </template>
  </BaseModal>
</template>
