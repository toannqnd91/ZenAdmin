<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-white">Mã giảm giá</h3>
        </div>
        <button @click="$emit('close')"
          class="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Voucher Input -->
        <div class="mb-6">
          <label class="block text-sm font-semibold text-slate-700 mb-2">Nhập mã voucher</label>
          <div class="relative">
            <input v-model="voucherCode" @keyup.enter="applyVoucher" type="text" placeholder="VD: SUMMER2024"
              class="w-full h-12 pl-4 pr-12 rounded-lg border-2 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm font-mono uppercase transition-all outline-none"
              :class="{ 'border-red-500': error, 'border-green-500': success }" />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg v-if="loading" class="animate-spin h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <svg v-else-if="success" class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <!-- Error/Success Message -->
          <div v-if="error" class="mt-2 text-sm text-red-600 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ error }}
          </div>
          <div v-if="success" class="mt-2 text-sm text-green-600 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ success }}
          </div>
        </div>

        <!-- Available Vouchers -->
        <div class="mb-4">
          <h4 class="text-sm font-semibold text-slate-700 mb-3">Voucher khả dụng</h4>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div v-for="voucher in availableVouchers" :key="voucher.code"
              @click="selectVoucher(voucher)"
              class="border-2 border-slate-200 rounded-lg p-3 cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all group"
              :class="{ 'border-purple-500 bg-purple-50': voucherCode === voucher.code }">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-mono font-bold text-purple-600 text-sm">{{ voucher.code }}</span>
                    <span v-if="voucher.type === 'percent'"
                      class="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                      -{{ voucher.value }}%
                    </span>
                    <span v-else
                      class="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full">
                      -{{ formatPrice(voucher.value) }}₫
                    </span>
                  </div>
                  <p class="text-xs text-slate-600 mb-1">{{ voucher.description }}</p>
                  <div class="flex items-center gap-3 text-xs text-slate-500">
                    <span v-if="voucher.minOrder" class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Đơn tối thiểu {{ formatPrice(voucher.minOrder) }}₫
                    </span>
                    <span v-if="voucher.expiryDate" class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      HSD: {{ formatDate(voucher.expiryDate) }}
                    </span>
                  </div>
                </div>
                <div v-if="voucherCode === voucher.code"
                  class="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div v-if="availableVouchers.length === 0"
              class="text-center py-8 text-slate-400">
              <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <p class="text-sm">Không có voucher khả dụng</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
        <button @click="$emit('close')"
          class="flex-1 h-11 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors">
          Hủy
        </button>
        <button @click="applyVoucher" :disabled="!voucherCode || loading"
          class="flex-1 h-11 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30">
          Áp dụng
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Voucher {
  code: string
  type: 'percent' | 'amount'
  value: number
  description: string
  minOrder?: number
  maxDiscount?: number
  expiryDate?: string
  usageLimit?: number
  usedCount?: number
}

interface Props {
  show: boolean
  currentTotal: number
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'apply'])

const voucherCode = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

// Mock vouchers - In production, fetch from API
const allVouchers = ref<Voucher[]>([
  {
    code: 'SUMMER2024',
    type: 'percent',
    value: 15,
    description: 'Giảm 15% cho đơn hàng mùa hè',
    minOrder: 200000,
    maxDiscount: 100000,
    expiryDate: '2024-08-31'
  },
  {
    code: 'NEWCUSTOMER',
    type: 'amount',
    value: 50000,
    description: 'Giảm 50k cho khách hàng mới',
    minOrder: 100000,
    expiryDate: '2024-12-31'
  },
  {
    code: 'VIP100K',
    type: 'amount',
    value: 100000,
    description: 'Voucher VIP giảm 100k',
    minOrder: 500000,
    expiryDate: '2024-12-31'
  },
  {
    code: 'FLASH20',
    type: 'percent',
    value: 20,
    description: 'Flash sale giảm 20%',
    minOrder: 300000,
    maxDiscount: 150000,
    expiryDate: '2024-07-31'
  }
])

// Filter vouchers based on current total
const availableVouchers = computed(() => {
  return allVouchers.value.filter(v => {
    if (v.minOrder && props.currentTotal < v.minOrder) return false
    if (v.expiryDate && new Date(v.expiryDate) < new Date()) return false
    return true
  })
})

function selectVoucher(voucher: Voucher) {
  voucherCode.value = voucher.code
  error.value = ''
  success.value = ''
}

function applyVoucher() {
  error.value = ''
  success.value = ''

  if (!voucherCode.value.trim()) {
    error.value = 'Vui lòng nhập mã voucher'
    return
  }

  loading.value = true

  // Simulate API call
  setTimeout(() => {
    const voucher = allVouchers.value.find(v => v.code.toUpperCase() === voucherCode.value.toUpperCase())

    if (!voucher) {
      error.value = 'Mã voucher không hợp lệ'
      loading.value = false
      return
    }

    // Check expiry
    if (voucher.expiryDate && new Date(voucher.expiryDate) < new Date()) {
      error.value = 'Mã voucher đã hết hạn'
      loading.value = false
      return
    }

    // Check minimum order
    if (voucher.minOrder && props.currentTotal < voucher.minOrder) {
      error.value = `Đơn hàng tối thiểu ${formatPrice(voucher.minOrder)}₫`
      loading.value = false
      return
    }

    // Calculate discount
    let discountAmount = 0
    if (voucher.type === 'percent') {
      discountAmount = Math.round(props.currentTotal * voucher.value / 100)
      if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount
      }
    } else {
      discountAmount = voucher.value
    }

    success.value = `Áp dụng thành công! Giảm ${formatPrice(discountAmount)}₫`
    loading.value = false

    // Emit to parent
    setTimeout(() => {
      emit('apply', {
        code: voucher.code,
        type: 'voucher',
        discountType: voucher.type,
        value: voucher.value,
        amount: discountAmount,
        voucher: voucher
      })
      emit('close')
    }, 1000)
  }, 500)
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN').format(price)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('vi-VN')
}
</script>

<style scoped>
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
