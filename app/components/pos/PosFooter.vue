<script setup lang="ts">
interface Props {
    totalQuantity: number
    subTotal: number
    discount: number
    totalAmount: number
    autoPrint: boolean
}

interface Emits {
    (e: 'update:autoPrint', value: boolean): void
    (e: 'openDiscount'): void
    (e: 'openPayment'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN').format(price)
}
</script>

<template>
    <!-- Cart Summary & Actions -->
    <div class="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
        <div class="flex justify-between text-sm">
            <span class="text-slate-500">Tổng tiền hàng ({{ totalQuantity }})</span>
            <span class="font-medium">{{ formatPrice(subTotal) }} ₫</span>
        </div>

        <div class="flex justify-between text-sm items-center">
            <button @click="$emit('openDiscount')"
                class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 group">
                <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Giảm giá (F6)
            </button>
            <span class="text-slate-500">{{ discount > 0 ? '-' + formatPrice(discount) : '0' }} ₫</span>
        </div>

        <div class="pt-3 border-t border-dashed border-slate-200 flex justify-between items-end">
            <span class="text-slate-900 font-bold text-lg">Khách phải trả</span>
            <span class="text-blue-600 font-bold text-2xl">{{ formatPrice(totalAmount) }} ₫</span>
        </div>

        <!-- Action Buttons -->
        <div class="pt-2 grid grid-cols-2 gap-3">
            <div class="col-span-2 flex items-center gap-2 mb-1">
                <input :checked="autoPrint"
                    @change="$emit('update:autoPrint', ($event.target as HTMLInputElement).checked)" type="checkbox"
                    id="autoprint" class="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4">
                <label for="autoprint" class="text-sm text-slate-600 select-none">In hóa đơn tự động (F10)</label>
            </div>

            <button @click="$emit('openPayment')"
                class="col-span-2 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 font-bold text-lg transition-all active:scale-[0.98]">
                <span>THANH TOÁN</span>
                <span class="bg-white/20 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">F9</span>
            </button>
        </div>
    </div>
</template>
