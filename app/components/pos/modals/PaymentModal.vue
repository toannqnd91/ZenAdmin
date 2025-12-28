<script setup lang="ts">
interface Props {
    show: boolean
    subTotal: number
    discount: number
    totalAmount: number
    autoPrint: boolean
}

interface Emits {
    (e: 'update:show', value: boolean): void
    (e: 'update:autoPrint', value: boolean): void
    (e: 'complete', data: { method: string; paid: number; change: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const paymentMethod = ref<'cash' | 'transfer' | 'card'>('cash')
const customerPaid = ref(0)

const changeAmount = computed(() => Math.max(0, customerPaid.value - props.totalAmount))

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN').format(price)
}

function close() {
    emit('update:show', false)
}

function completePayment() {
    if (customerPaid.value < props.totalAmount) {
        alert('Số tiền khách đưa chưa đủ!')
        return
    }

    emit('complete', {
        method: paymentMethod.value,
        paid: customerPaid.value,
        change: changeAmount.value
    })
}

watch(() => props.show, (newVal) => {
    if (newVal) {
        customerPaid.value = props.totalAmount
    }
})
</script>

<template>
    <div v-if="show"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div
                class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white flex items-center justify-between">
                <h3 class="font-bold text-xl">Thanh toán đơn hàng</h3>
                <button @click="close" class="p-2 -mr-2 hover:bg-white/20 rounded-full transition-colors">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="p-6 space-y-4">
                <!-- Order Summary -->
                <div class="bg-slate-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-600">Tạm tính:</span>
                        <span class="font-semibold">{{ formatPrice(subTotal) }} ₫</span>
                    </div>
                    <div v-if="discount > 0" class="flex justify-between text-sm text-amber-600">
                        <span>Giảm giá:</span>
                        <span class="font-semibold">-{{ formatPrice(discount) }} ₫</span>
                    </div>
                    <div class="pt-2 border-t border-slate-200 flex justify-between">
                        <span class="font-bold text-lg">Tổng cộng:</span>
                        <span class="font-bold text-2xl text-blue-600">{{ formatPrice(totalAmount) }} ₫</span>
                    </div>
                </div>

                <!-- Payment Method -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Phương thức thanh toán</label>
                    <div class="grid grid-cols-3 gap-2">
                        <button @click="paymentMethod = 'cash'" type="button"
                            class="p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1"
                            :class="paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span class="text-xs font-medium">Tiền mặt</span>
                        </button>
                        <button @click="paymentMethod = 'transfer'" type="button"
                            class="p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1"
                            :class="paymentMethod === 'transfer' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span class="text-xs font-medium">Chuyển khoản</span>
                        </button>
                        <button @click="paymentMethod = 'card'" type="button"
                            class="p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1"
                            :class="paymentMethod === 'card' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <span class="text-xs font-medium">Thẻ</span>
                        </button>
                    </div>
                </div>

                <!-- Customer Paid Amount -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Tiền khách đưa</label>
                    <input v-model.number="customerPaid" type="number" step="1000"
                        class="w-full h-12 px-4 rounded-lg bg-slate-50 border-2 border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-bold text-lg"
                        placeholder="0">
                    <!-- Quick amount buttons -->
                    <div class="mt-2 flex gap-2">
                        <button v-for="amount in [50000, 100000, 200000, 500000]" :key="amount" type="button"
                            @click="customerPaid = totalAmount + amount"
                            class="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 font-medium transition-colors">
                            +{{ formatPrice(amount) }}
                        </button>
                    </div>
                </div>

                <!-- Change Amount -->
                <div v-if="customerPaid >= totalAmount" class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div class="flex justify-between items-center">
                        <span class="text-green-700 font-medium">Tiền thừa trả khách:</span>
                        <span class="text-green-700 font-bold text-xl">{{ formatPrice(changeAmount) }} ₫</span>
                    </div>
                </div>
                <div v-else-if="customerPaid > 0" class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="flex justify-between items-center">
                        <span class="text-red-700 font-medium">Còn thiếu:</span>
                        <span class="text-red-700 font-bold text-xl">{{ formatPrice(totalAmount - customerPaid) }}
                            ₫</span>
                    </div>
                </div>
            </div>

            <div class="bg-slate-50 px-6 py-4 flex gap-3 justify-end">
                <button @click="close"
                    class="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                    Hủy bỏ
                </button>
                <button @click="completePayment"
                    class="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                    Xác nhận thanh toán
                </button>
            </div>
        </div>
    </div>
</template>
