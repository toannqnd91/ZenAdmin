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
export type BankAccountPayload = {
  bankName: string
  accountNumber: string
  accountHolder: string
  bankBranch: string
}

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'submit': [{ method: PaymentMethodStr, amount: number, reference: string, note: string, bankAccount?: BankAccountPayload }]
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
const note = ref('')
const amount = ref(0)
const bankAccount = ref<BankAccountPayload>({
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  bankBranch: ''
})

const presetAccounts = [
  { bankName: 'BIDV', accountHolder: 'Thuỳ', accountNumber: '8886666339', bankBranch: '', label: 'BIDV - 8886666339 (Thuỳ)' },
  { bankName: 'BIDV', accountHolder: 'Tùng Phong', accountNumber: '8611026688', bankBranch: '', label: 'Tài khoản công ty - 8611026688 (Tùng Phong)' },
  { bankName: 'BIDV', accountHolder: 'Chị Hồng', accountNumber: '8800851686', bankBranch: '', label: 'BIDV - 8800851686 (Chị Hồng)' },
  { bankName: 'Techcombank', accountHolder: 'Hà', accountNumber: '19075091311012', bankBranch: '', label: 'Techcombank - 19075091311012 (Hà)' },
  { bankName: 'Agribank', accountHolder: 'Châm', accountNumber: '8888348625559', bankBranch: '', label: 'Agribank - 8888348625559 (Châm)' }
]

const selectedBankAccountItem = computed(() => {
  if (!bankAccount.value.accountNumber) return null
  return presetAccounts.find(a => a.accountNumber === bankAccount.value.accountNumber) || null
})

function fetchBankAccounts(_search: string) {
  return Promise.resolve(presetAccounts)
}

function onSelectBankAccount(item: typeof presetAccounts[0] | null) {
  if (item) {
    bankAccount.value = { ...item }
  } else {
    bankAccount.value = { bankName: '', accountNumber: '', accountHolder: '', bankBranch: '' }
  }
}

watch(open, (v) => {
  if (v) {
    // Always prefill with remaining amount (số tiền cần thanh toán)
    const prefill = Number.isFinite(props.remainingAmount) ? Math.max(0, Math.floor(props.remainingAmount)) : 0
    amount.value = prefill
    method.value = 'TienMat'
    reference.value = ''
    note.value = ''
    bankAccount.value = {
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      bankBranch: ''
    }
  }
})

const canSubmit = () => amount.value > 0

function submit() {
  if (!canSubmit()) return
  emit('submit', {
    method: method.value,
    amount: amount.value,
    reference: reference.value.trim(),
    note: note.value.trim(),
    bankAccount: method.value === 'ChuyenKhoan' ? { ...bankAccount.value } : undefined
  })
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

    <!-- Bank Details & Reference (2 columns) -->
    <div v-if="method === 'ChuyenKhoan'" class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-1">
        <label class="text-sm font-medium text-gray-700">Chọn tài khoản nhận tiền</label>
        <div class="relative">
          <RemoteSearchSelect :model-value="selectedBankAccountItem" :fetch-fn="fetchBankAccounts"
            :get-item-key="(it: any) => it.accountNumber" placeholder="Chọn tài khoản ngân hàng" :full-width="true"
            :searchable="false" :clearable="false" :reset-search-on-open="true" label-field="label"
            @update:model-value="onSelectBankAccount">
            <template #option="{ item: option }">
              <div class="flex flex-col py-1">
                <div class="font-medium text-gray-900">{{ option.bankName }} - {{ option.accountNumber }}</div>
                <div class="text-xs text-gray-500">{{ option.accountHolder }}</div>
              </div>
            </template>
            <template #label="{ item }">
              <span v-if="item">{{ item.bankName }} - {{ item.accountNumber }} ({{ item.accountHolder }})</span>
              <span v-else>Chọn tài khoản</span>
            </template>
          </RemoteSearchSelect>
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-sm font-medium text-gray-700">Tham chiếu</label>
        <input v-model="reference" type="text" placeholder="Nhập tham chiếu"
          class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
      </div>
    </div>

    <!-- Reference only (if not transfer) -->
    <div v-else class="mt-2 space-y-1">
      <label class="text-sm font-medium text-gray-700">Tham chiếu</label>
      <input v-model="reference" type="text" placeholder="Nhập tham chiếu"
        class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
    </div>

    <!-- Note -->
    <div class="mt-2 space-y-1">
      <label class="text-sm font-medium text-gray-700">Ghi chú</label>
      <textarea v-model="note" rows="3" placeholder="Nhập ghi chú"
        class="w-full p-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
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
