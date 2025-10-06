<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'

interface Props {
  modelValue?: boolean
  remainingAmount: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  remainingAmount: 0
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'submit', payload: { method: 'TienMat' | 'ChuyenKhoan'; amount: number; reference: string }): void
}>()

const open = ref<boolean>(props.modelValue)
watch(() => props.modelValue, v => { open.value = v })
watch(open, v => emit('update:modelValue', v))

const method = ref<'TienMat' | 'ChuyenKhoan'>('TienMat')
const reference = ref('')
const amountRaw = ref('')

watch(open, (v) => {
  if (v) {
    amountRaw.value = formatNumberInput(props.remainingAmount)
    method.value = 'TienMat'
    reference.value = ''
  }
})

function formatNumberInput(val: number | string) {
  const n = typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(n)) return ''
  return new Intl.NumberFormat('vi-VN').format(n)
}
function parseNumberInput(str: string) {
  if (!str) return 0
  const n = Number(str.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}
function onAmountInput(e: Event) {
  const target = e.target as HTMLInputElement
  const caretFromEnd = target.value.length - (target.selectionStart || 0)
  const numeric = parseNumberInput(target.value)
  const formatted = formatNumberInput(numeric)
  target.value = formatted
  amountRaw.value = formatted
  const newPos = formatted.length - caretFromEnd
  requestAnimationFrame(() => target.setSelectionRange(newPos, newPos))
}
const canSubmit = () => parseNumberInput(amountRaw.value) > 0

function submit() {
  if (!canSubmit()) return
  emit('submit', { method: method.value, amount: parseNumberInput(amountRaw.value), reference: reference.value.trim() })
  open.value = false
}
</script>

<template>
  <BaseModal
    :model-value="open"
    title="Nhận tiền"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Method -->
      <div class="space-y-1">
        <label class="text-sm font-medium text-gray-700 flex items-center gap-1">Phương thức thanh toán <span class="text-red-500">*</span></label>
        <div class="relative">
          <select
            v-model="method"
            class="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="TienMat">Tiền mặt</option>
            <option value="ChuyenKhoan">Chuyển khoản</option>
          </select>
        </div>
      </div>
      <!-- Amount -->
      <div class="space-y-1">
        <label class="text-sm font-medium text-gray-700 flex items-center gap-1">Số tiền nhận</label>
        <div class="relative">
          <input
            :value="amountRaw"
            @input="onAmountInput"
            type="text"
            inputmode="numeric"
            placeholder="0"
            class="w-full h-10 pr-7 pl-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 tracking-wider"
          >
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">đ</span>
        </div>
        <p v-if="remainingAmount > 0" class="text-xs text-gray-500">Còn lại: {{ new Intl.NumberFormat('vi-VN').format(remainingAmount) }}đ</p>
      </div>
    </div>
    <!-- Reference -->
    <div class="mt-6 space-y-1">
      <label class="text-sm font-medium text-gray-700">Tham chiếu</label>
      <input
        v-model="reference"
        type="text"
        placeholder="Nhập tham chiếu"
        class="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
    </div>
    <template #footer>
      <UButton
        color="neutral"
        variant="ghost"
        size="md"
        @click="open = false"
      >Hủy</UButton>
      <UButton
        color="primary"
        variant="solid"
        size="md"
        :disabled="!canSubmit()"
        @click="submit"
      >Nhận tiền</UButton>
    </template>
  </BaseModal>
</template>
