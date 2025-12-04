<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import { 
  CancellationReasonEnum, 
  RefundOptionEnum,
  type CancelOrderRequest 
} from '@/services/orders.service'

interface Props {
  modelValue?: boolean
  orderCode: string
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
  'confirm': [CancelOrderRequest]
}>()

const open = ref<boolean>(props.modelValue)
watch(() => props.modelValue, (v) => {
  open.value = v
})
watch(open, v => emit('update:modelValue', v))

// Form state
const refundOption = ref<RefundOptionEnum>(RefundOptionEnum.RefundNow)
const restockItems = ref(true)
const note = ref('')

const cancelReasons = [
  { label: 'Khách hàng yêu cầu', value: CancellationReasonEnum.CustomerRequested },
  { label: 'Tạo nhầm', value: CancellationReasonEnum.CreatedByMistake },
  { label: 'Hết hàng', value: CancellationReasonEnum.OutOfStock },
  { label: 'Thay đổi giá', value: CancellationReasonEnum.PriceChanged },
  { label: 'Vấn đề thanh toán', value: CancellationReasonEnum.PaymentIssue },
  { label: 'Lý do khác', value: CancellationReasonEnum.Other }
]

const defaultReason = { label: 'Lý do khác', value: CancellationReasonEnum.Other }
const selectedReason = ref<{ label: string, value: CancellationReasonEnum } | null>(defaultReason)

async function fetchReasons() {
  return Promise.resolve([...cancelReasons])
}

function formatCurrency(v?: number | null) {
  if (v == null || isNaN(v)) return '0đ'
  return new Intl.NumberFormat('vi-VN').format(v) + 'đ'
}

watch(open, (v) => {
  if (v) {
    // Reset form when opening
    refundOption.value = RefundOptionEnum.RefundNow
    restockItems.value = true
    note.value = ''
    selectedReason.value = defaultReason
  }
})

function confirm() {
  const request: CancelOrderRequest = {
    reason: selectedReason.value?.value ?? CancellationReasonEnum.Other,
    note: note.value,
    refundOption: refundOption.value,
    restockAllItems: restockItems.value,
    idempotencyKey: null,
    createdById: null
  }
  emit('confirm', request)
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
              :value="RefundOptionEnum.RefundNow"
              class="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
            >
            <span class="text-sm text-gray-700">Hoàn tiền ngay {{ formatCurrency(orderTotal) }}</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="refundOption"
              type="radio"
              :value="RefundOptionEnum.RefundLater"
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
          :get-item-key="(item: any) => item.value.toString()"
          placeholder="Chọn lý do"
          :searchable="false"
          :clearable="false"
          :full-width="true"
          :append-to-body="true"
        />
      </div>

      <!-- Note (optional) -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-900">Ghi chú (tùy chọn)</label>
        <textarea
          v-model="note"
          rows="3"
          placeholder="Nhập ghi chú..."
          class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
