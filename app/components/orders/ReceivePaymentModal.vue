<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseNumberInput from '@/components/base/BaseNumberInput.vue'

interface Props {
  modelValue?: boolean
  remainingAmount: number
  paidAmount?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  remainingAmount: 0,
  paidAmount: 0
})

type PaymentMethodStr = 'TienMat' | 'ChuyenKhoan' | 'ViDienTu'
const emit = defineEmits<{
  'update:modelValue': [boolean]
  'submit': [{ method: PaymentMethodStr, amount: number, reference: string }]
}>()

const open = ref<boolean>(props.modelValue)
watch(() => props.modelValue, (v) => {
  open.value = v
})
watch(open, v => emit('update:modelValue', v))

const method = ref<PaymentMethodStr>('TienMat')
const paymentMethodOptions = [
  { label: 'Tiền mặt', value: 'TienMat' },
  { label: 'Chuyển khoản', value: 'ChuyenKhoan' },
  { label: 'Ví điện tử', value: 'ViDienTu' }
]
// Adapter for RemoteSearchSelect (expects object modelValue and fetch function)
const selectedMethodItem = computed(() => paymentMethodOptions.find(opt => opt.value === method.value) || null)
function onSelectMethod(item: { label: string, value: string } | null) {
  method.value = (item?.value as PaymentMethodStr) || 'TienMat'
}
function fetchPaymentMethods(_search: string) {
  // Always return the full fixed list
  return Promise.resolve(paymentMethodOptions)
}
const reference = ref('')
const amount = ref(0)

watch(open, (v) => {
  if (v) {
    // Always prefill with remaining amount (số tiền cần thanh toán)
    const prefill = Number.isFinite(props.remainingAmount) ? Math.max(0, Math.floor(props.remainingAmount)) : 0
    amount.value = prefill
    method.value = 'TienMat'
    reference.value = ''
  }
})

const canSubmit = () => amount.value > 0

function submit() {
  if (!canSubmit()) return
  emit('submit', { method: method.value, amount: amount.value, reference: reference.value.trim() })
  open.value = false
}
</script>

<template>
  <BaseModal :model-value="open" title="Nhận tiền">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Method -->
      <div class="space-y-1">
        <label class="text-sm font-medium text-gray-700 flex items-center gap-1">Phương thức thanh toán <span
            class="text-red-500">*</span></label>
        <div class="relative">
          <RemoteSearchSelect :model-value="selectedMethodItem" :fetch-fn="fetchPaymentMethods" label-field="label"
            :get-item-key="it => it.value as string" placeholder="Chọn phương thức thanh toán" :full-width="true"
            :searchable="false" :clearable="false" :reset-search-on-open="true" @update:model-value="onSelectMethod" />
        </div>
      </div>
      <!-- Amount -->
      <div class="space-y-1">
        <label class="text-sm font-medium text-gray-700 flex items-center gap-1">Số tiền nhận</label>
        <div class="relative">
          <BaseNumberInput v-model="amount" :allow-decimal="false" group-separator="." decimal-separator=","
            placeholder="0"
            class="w-full h-9 pr-7 pl-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 tracking-wider" />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">đ</span>
        </div>
        <p v-if="remainingAmount > 0" class="text-xs text-gray-500 mt-1 cursor-pointer hover:text-primary-600"
          title="Click để điền số tiền này" @click="amount = remainingAmount">
          Còn lại: {{ new Intl.NumberFormat('vi-VN').format(remainingAmount) }}đ
        </p>
      </div>
    </div>
    <!-- Reference -->
    <div class="mt-6 space-y-1">
      <label class="text-sm font-medium text-gray-700">Tham chiếu</label>
      <input v-model="reference" type="text" placeholder="Nhập tham chiếu"
        class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
    </div>
    <template #footer>
      <UButton color="neutral" variant="ghost" size="md" @click="open = false">
        Hủy
      </UButton>
      <UButton color="primary" variant="solid" size="md" :disabled="!canSubmit()" @click="submit">
        Nhận tiền
      </UButton>
    </template>
  </BaseModal>
</template>
