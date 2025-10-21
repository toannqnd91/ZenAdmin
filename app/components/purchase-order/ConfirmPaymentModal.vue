<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'

interface Props {
  modelValue?: boolean
  remainingAmount?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  remainingAmount: 0
})

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'submit': [{ method: string, amount: number, reference: string, date: string }]
}>()

const open = ref<boolean>(props.modelValue)
watch(() => props.modelValue, (v) => {
  open.value = v
})
watch(open, v => emit('update:modelValue', v))

type PaymentMethodStr = 'TienMat' | 'ChuyenKhoan' | 'ViDienTu'
const method = ref<PaymentMethodStr>('TienMat')
const paymentMethodOptions = [
  { label: 'Tiền mặt', value: 'TienMat' },
  { label: 'Chuyển khoản', value: 'ChuyenKhoan' },
  { label: 'Ví điện tử', value: 'ViDienTu' }
]
const selectedMethodItem = computed(() => paymentMethodOptions.find(opt => opt.value === method.value) || null)
function onSelectMethod(item: { label: string, value: string } | null) {
  method.value = (item?.value as PaymentMethodStr) || 'TienMat'
}
function fetchPaymentMethods(_search: string) {
  return Promise.resolve(paymentMethodOptions)
}

const reference = ref('')
const amountRaw = ref('')

const todayStr = () => {
  const d = new Date()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
const date = ref<string>(todayStr())

watch(open, (v) => {
  if (v) {
    const prefill = Number.isFinite(props.remainingAmount) ? Math.max(0, Math.floor(props.remainingAmount)) : 0
    amountRaw.value = String(prefill)
    method.value = 'TienMat'
    reference.value = ''
    date.value = todayStr()
  }
})

function parseNumberInput(str: string) {
  if (!str) return 0
  const digitsOnly = str.replace(/[^0-9]/g, '')
  const n = Number(digitsOnly)
  return Number.isFinite(n) ? n : 0
}
function onAmountInput(e: Event) {
  const target = e.target as HTMLInputElement
  const sanitized = target.value.replace(/[^0-9]/g, '')
  if (sanitized !== target.value) {
    target.value = sanitized
  }
  amountRaw.value = sanitized
}
const canSubmit = () => parseNumberInput(amountRaw.value) > 0

function submit() {
  if (!canSubmit()) return
  emit('submit', {
    method: method.value,
    amount: parseNumberInput(amountRaw.value),
    reference: reference.value.trim(),
    date: date.value
  })
  open.value = false
}
</script>

<template>
  <BaseModal v-model="open" title="Xác nhận thanh toán">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Method -->
      <div class="space-y-1">
        <label class="text-sm font-medium text-gray-700 flex items-center gap-1">Hình thức thanh toán <span class="text-red-500">*</span></label>
        <RemoteSearchSelect
          :model-value="selectedMethodItem"
          :fetch-fn="fetchPaymentMethods"
          label-field="label"
          :get-item-key="it => it.value as string"
          placeholder="Chọn hình thức thanh toán"
          :full-width="true"
          :searchable="false"
          :clearable="false"
          :reset-search-on-open="true"
          @update:model-value="onSelectMethod"
        />
      </div>
      <!-- Amount -->
      <div class="space-y-1">
        <label class="text-sm font-medium text-gray-700 flex items-center gap-1">Số tiền thanh toán</label>
        <div class="relative">
          <input
            type="text"
            inputmode="numeric"
            autocomplete="off"
            pattern="[0-9]*"
            placeholder="0"
            class="w-full h-9 pr-7 pl-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 tracking-wider"
            :value="amountRaw"
            @input="onAmountInput"
          >
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">đ</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <!-- Date -->
      <div class="space-y-1">
        <label class="text-sm font-medium text-gray-700">Ngày ghi nhận</label>
        <div class="relative">
          <input
            v-model="date"
            type="date"
            class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
        </div>
      </div>
      <!-- Reference -->
      <div class="space-y-1">
        <label class="text-sm font-medium text-gray-700">Tham chiếu</label>
        <input
          v-model="reference"
          type="text"
          placeholder="Nhập mã tham chiếu"
          class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
      </div>
    </div>

    <template #footer>
      <UButton
        color="neutral"
        variant="ghost"
        size="md"
        @click="open = false"
      >
        Hủy
      </UButton>
      <UButton
        color="primary"
        variant="solid"
        size="md"
        :disabled="!canSubmit()"
        @click="submit"
      >
        Xác nhận
      </UButton>
    </template>
  </BaseModal>
</template>
