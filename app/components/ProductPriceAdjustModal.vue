<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'

interface Props {
  modelValue?: boolean
  productName?: string
  basePrice?: number
  currentPrice?: number
  originalPrice?: number | null
  initialDiscountType?: 'amount' | 'percent' | null
  initialDiscountValue?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  productName: '',
  basePrice: 0,
  currentPrice: 0,
  originalPrice: null,
  initialDiscountType: null,
  initialDiscountValue: null
})

const emit = defineEmits(['update:modelValue', 'apply'])

const open = ref(props.modelValue)
watch(() => props.modelValue, (v) => {
  open.value = v
})
watch(open, (v) => {
  emit('update:modelValue', v)
})

// State
// priceRaw đại diện cho GIÁ GỐC (base) để người dùng không bị nhiễu khi nhập chiết khấu
const priceRaw = ref('')
// baseRef là giá gốc đang dùng để tính discount (có thể chỉnh sửa trong modal)
const baseRef = ref(0)
const originalBase = computed(() => baseRef.value)
const discountType = ref<'amount' | 'percent'>('amount')
const discountInputRaw = ref('')
const discountHint = ref('')
const validationError = ref('')
// Track which field user is editing to avoid circular updates
const editingSource = ref<null | 'price' | 'discount'>(null)

// Initialize when opened
watch(open, (v) => {
  if (v) initModalState()
})

function initModalState() {
  const initialBase = (typeof props.originalPrice === 'number' && props.originalPrice > 0)
    ? props.originalPrice
    : (props.basePrice || props.currentPrice || 0)
  const current = props.currentPrice || initialBase
  baseRef.value = initialBase
  priceRaw.value = initialBase ? formatNumberInput(initialBase) : '0'
  if (initialBase > current) {
    const diff = initialBase - current
    // Respect stored type if matches logic
    const storedType = props.initialDiscountType || 'amount'
    discountType.value = storedType
    if (storedType === 'percent') {
      discountInputRaw.value = formatNumberInput(Math.round(diff * 100 / initialBase))
    } else {
      discountInputRaw.value = formatNumberInput(diff)
    }
  } else if (props.initialDiscountType && props.initialDiscountValue) {
    discountType.value = props.initialDiscountType
    discountInputRaw.value = formatNumberInput(props.initialDiscountValue)
  } else {
    discountType.value = 'amount'
    discountInputRaw.value = ''
  }
  validationError.value = ''
  discountHint.value = ''
}

// In case props arrive after component mounted (first open) ensure input shows value
watch(() => [props.currentPrice, props.basePrice, props.initialDiscountType, props.initialDiscountValue], () => {
  if (open.value) {
    initModalState()
  }
}, { immediate: true })

function formatNumberInput(val: number | string) {
  const n = typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(n)) return ''
  return new Intl.NumberFormat('vi-VN').format(n)
}
function parseNumberInput(str: string) {
  if (!str) return 0
  // Remove thousand separators ('.' frequently used in vi-VN) before parsing
  const cleaned = str.replace(/[.\s]/g, '').replace(/[^0-9-]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}
function formatAndAssign(e: Event, refVar: { value: string }) {
  const target = e.target as HTMLInputElement
  const caretFromEnd = target.value.length - (target.selectionStart || 0)
  const numeric = parseNumberInput(target.value)
  const formatted = formatNumberInput(numeric)
  target.value = formatted
  refVar.value = formatted
  const newPos = formatted.length - caretFromEnd
  requestAnimationFrame(() => target.setSelectionRange(newPos, newPos))
}
function onPriceInput(e: Event) {
  // Cho phép chỉnh lại giá gốc -> reset logic discount dựa trên chênh lệch với currentPrice nếu có
  editingSource.value = 'price'
  formatAndAssign(e, priceRaw)
  // Cập nhật baseRef khi người dùng thay đổi đơn giá
  const newBase = parseNumberInput(priceRaw.value)
  baseRef.value = newBase
  // Khi thay đổi base mà vẫn còn discountInput -> cần tái tính preview (computed tự làm)
  clampDiscount()
  editingSource.value = null
}
function onDiscountInput(e: Event) {
  editingSource.value = 'discount'
  formatAndAssign(e, discountInputRaw)
  clampDiscount()
  // Không thay đổi priceRaw; chỉ previewPrice thay đổi
  editingSource.value = null
}

const discountInput = computed(() => parseNumberInput(discountInputRaw.value))
// enteredCurrentPrice là đơn giá hiện tại (có thể đã giảm)
const enteredCurrentPrice = computed(() => parseNumberInput(priceRaw.value))

// previewPrice = giá sau giảm (thực tế hiển thị bên dưới) => khi có originalBase thì tính lại; nếu không có originalBase thì chính là enteredCurrentPrice
const previewPrice = computed(() => {
  if (!originalBase.value) return enteredCurrentPrice.value
  if (discountInput.value <= 0) return originalBase.value
  if (discountType.value === 'percent') {
    return Math.max(0, Math.round(originalBase.value * (100 - discountInput.value) / 100))
  }
  return Math.max(0, originalBase.value - discountInput.value)
})

// Can apply if current (preview) price > 0
const canApply = computed(() => previewPrice.value > 0 && !validationError.value)

function apply() {
  if (!canApply.value) return
  emit('apply', {
    newPrice: previewPrice.value,
    basePrice: originalBase.value,
    discountType: discountInput.value > 0 ? discountType.value : undefined,
    discountInput: discountInput.value > 0 ? discountInput.value : null
  })
  open.value = false
}

function clampDiscount() {
  // New behavior: do NOT mutate input, just flag error
  discountHint.value = ''
  validationError.value = ''
  const price = originalBase.value || enteredCurrentPrice.value
  if (discountType.value === 'amount') {
    if (discountInput.value > price) {
      validationError.value = 'Chiết khấu sản phẩm không được vượt quá đơn giá'
    }
  } else if (discountType.value === 'percent') {
    if (discountInput.value > 100) {
      validationError.value = 'Phần trăm không vượt quá 100%'
    }
  }
}

watch([discountType], () => {
  // Khi đổi loại discount chỉ cần re-validate; không tự tái tính để tránh làm người dùng mất giá trị đang nhập.
  clampDiscount()
})
</script>

<template>
  <BaseModal :model-value="open" title="Điều chỉnh giá sản phẩm">
    <div class="space-y-6">
      <div
        v-if="validationError"
        class="rounded-md border border-error/30 bg-error/5 px-4 py-3 text-sm text-error flex items-start gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
        <span>{{ validationError }}</span>
      </div>
      <!-- Base price / unit price -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div class="space-y-1 md:col-span-2">
          <label class="text-sm font-medium text-gray-700 flex items-center gap-1">Đơn giá:</label>
          <div class="relative">
            <input
              class="w-full h-10 pr-7 pl-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 tracking-wider"
              type="text"
              inputmode="numeric"
              placeholder="0"
              :value="priceRaw"
              @input="onPriceInput"
            >
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">đ</span>
          </div>
        </div>
        <div class="space-y-1 md:col-span-2">
          <label class="text-sm font-medium text-gray-700 flex items-center gap-1">Loại giảm giá:</label>
          <div class="flex rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            <button
              :class="['px-4 py-2 text-sm font-semibold transition', discountType === 'amount' ? 'bg-primary-600 text-white' : 'text-gray-700 bg-white']"
              type="button"
              @click="discountType = 'amount'"
            >
              Giá trị
            </button>
            <button
              :class="['px-4 py-2 text-sm font-semibold transition', discountType === 'percent' ? 'bg-primary-600 text-white' : 'text-gray-700 bg-white']"
              type="button"
              @click="discountType = 'percent'"
            >
              %
            </button>
            <div class="flex-1 flex flex-col items-stretch">
              <div class="relative flex-1">
                <input
                  :class="['w-full h-10 pr-6 pl-3 rounded-none border-l bg-white text-sm focus:outline-none focus:ring-2 tracking-wider', validationError ? 'border-error focus:ring-error/40 border' : 'border-gray-200 focus:ring-primary-500 border']"
                  type="text"
                  inputmode="numeric"
                  placeholder="0"
                  :value="discountInputRaw"
                  @input="onDiscountInput"
                >
                <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">{{ discountType === 'amount' ? 'đ' : '%' }}</span>
              </div>
              <div
                v-if="discountHint"
                class="text-xs text-error mt-1 pl-3"
              >
                {{ discountHint }}
              </div>
            </div>
          </div>
        </div>
        <div class="space-y-1 md:col-span-2">
          <label class="text-sm font-medium text-gray-700">Giá sau giảm:</label>
          <div class="text-lg font-semibold tracking-wide">
            {{ new Intl.NumberFormat('vi-VN').format(previewPrice) }}đ
          </div>
        </div>
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
        :disabled="!canApply"
        @click="apply"
      >
        Áp dụng
      </UButton>
    </template>
  </BaseModal>
</template>
