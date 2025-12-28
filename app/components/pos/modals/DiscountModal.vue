<script setup lang="ts">
interface Props {
    show: boolean
    subTotal: number
    discount: number
    totalAmount: number
    discountType: 'percent' | 'amount'
    discountValue: number
}

interface Emits {
    (e: 'update:show', value: boolean): void
    (e: 'update:discountType', value: 'percent' | 'amount'): void
    (e: 'update:discountValue', value: number): void
    (e: 'apply'): void
    (e: 'clear'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN').format(price)
}

function close() {
    emit('update:show', false)
}

function apply() {
    emit('apply')
}

function clear() {
    emit('clear')
}
</script>

<template>
    <div v-if="show"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 class="font-bold text-lg text-slate-800">Giảm giá đơn hàng</h3>
                <button @click="close"
                    class="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="p-6 space-y-4">
                <!-- Discount Type -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Loại giảm giá</label>
                    <div class="grid grid-cols-2 gap-2">
                        <button @click="$emit('update:discountType', 'percent')" type="button"
                            class="p-3 rounded-lg border-2 transition-all"
                            :class="discountType === 'percent' ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold' : 'border-slate-200 hover:border-slate-300'">
                            Phần trăm (%)
                        </button>
                        <button @click="$emit('update:discountType', 'amount')" type="button"
                            class="p-3 rounded-lg border-2 transition-all"
                            :class="discountType === 'amount' ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold' : 'border-slate-200 hover:border-slate-300'">
                            Số tiền (₫)
                        </button>
                    </div>
                </div>

                <!-- Discount Value -->
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">
                        {{ discountType === 'percent' ? 'Phần trăm giảm' : 'Số tiền giảm' }}
                    </label>
                    <div class="relative">
                        <input :value="discountValue"
                            @input="$emit('update:discountValue', Number(($event.target as HTMLInputElement).value))"
                            type="number" :step="discountType === 'percent' ? 1 : 1000"
                            :max="discountType === 'percent' ? 100 : subTotal"
                            class="w-full h-12 px-4 pr-12 rounded-lg bg-slate-50 border-2 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all font-bold text-lg"
                            placeholder="0">
                        <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                            {{ discountType === 'percent' ? '%' : '₫' }}
                        </span>
                    </div>
                    <!-- Quick discount buttons -->
                    <div v-if="discountType === 'percent'" class="mt-2 grid grid-cols-4 gap-2">
                        <button v-for="pct in [5, 10, 15, 20]" :key="pct" type="button"
                            @click="$emit('update:discountValue', pct)"
                            class="px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 font-medium transition-colors">
                            {{ pct }}%
                        </button>
                    </div>
                </div>

                <!-- Preview -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="space-y-1 text-sm">
                        <div class="flex justify-between">
                            <span class="text-slate-600">Tạm tính:</span>
                            <span class="font-semibold">{{ formatPrice(subTotal) }} ₫</span>
                        </div>
                        <div class="flex justify-between text-amber-600">
                            <span>Giảm giá:</span>
                            <span class="font-semibold">-{{ formatPrice(discount) }} ₫</span>
                        </div>
                        <div class="pt-2 border-t border-blue-200 flex justify-between">
                            <span class="font-bold">Thành tiền:</span>
                            <span class="font-bold text-lg text-blue-600">{{ formatPrice(totalAmount) }} ₫</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-slate-50 px-6 py-4 flex gap-3 justify-end">
                <button @click="clear"
                    class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                    Xóa giảm giá
                </button>
                <button @click="apply"
                    class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                    Áp dụng
                </button>
            </div>
        </div>
    </div>
</template>
