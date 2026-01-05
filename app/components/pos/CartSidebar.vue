<script setup lang="ts">
import { ref, computed } from 'vue'
import PromotionDisplay from './PromotionDisplay.vue'

interface Customer {
    id: number
    name: string
    phone: string
    address?: string
    level: 'Member' | 'VIP' | 'Diamond'
    points: number
}

interface CartItem {
    id: number
    sku: string
    name: string
    price: number
    imageUrl: string
    category: string
    quantity: number
    note?: string
    isReturn?: boolean
    maxReturnQty?: number
    originalOrderId?: number
    isGift?: boolean
    promotionId?: string
}

interface Props {
    cart: CartItem[]
    selectedCustomer: Customer | null
    customerSearchQuery: string
    isCustomerDropdownOpen: boolean
    filteredCustomers: Customer[]
    appliedPromotions: any[]
    appliedVoucher: any
    subTotal: number
    discount: number
    totalAmount: number
    totalQuantity: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
    (e: 'update:customerSearchQuery', value: string): void
    (e: 'update:isCustomerDropdownOpen', value: boolean): void
    (e: 'selectCustomer', customer: Customer): void
    (e: 'removeCustomer'): void
    (e: 'openAddCustomerModal'): void
    (e: 'updateQuantity', item: CartItem, delta: number): void
    (e: 'removeFromCart', id: number): void
    (e: 'openProductNoteModal', item: CartItem): void
    (e: 'openVoucherModal'): void
    (e: 'removeVoucher'): void
    (e: 'removePromotion', promotionId: string): void
    (e: 'openDiscountModal'): void
    (e: 'openPaymentModal'): void
}>()

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN').format(price)
}

function onCustomerSearchInput() {
    emit('update:isCustomerDropdownOpen', true)
}
</script>

<template>
    <aside class="w-96 bg-white border-l border-slate-200 flex flex-col z-10 shadow-xl shrink-0">
        <!-- Customer Section - Compact -->
        <div class="p-3 border-b border-slate-100 shrink-0">
            <!-- Selected Customer -->
            <div v-if="selectedCustomer"
                class="bg-blue-50 rounded-lg p-2 border border-blue-100 flex items-center justify-between">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                    <div
                        class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-200 shrink-0">
                        {{ selectedCustomer.name.charAt(0) }}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-semibold text-slate-800 text-sm truncate">{{ selectedCustomer.name }}</div>
                        <div class="text-xs text-slate-500 truncate">{{ selectedCustomer.phone }}</div>
                    </div>
                </div>
                <button @click="$emit('removeCustomer')"
                    class="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-white transition-colors shrink-0">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Search Input -->
            <div v-else class="relative">
                <input :value="customerSearchQuery"
                    @input="$emit('update:customerSearchQuery', ($event.target as HTMLInputElement).value); onCustomerSearchInput()"
                    type="text" placeholder="Tìm khách hàng (F4)"
                    class="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-100 text-sm transition-all outline-none" />
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>

                <!-- Dropdown Results -->
                <div v-if="customerSearchQuery && isCustomerDropdownOpen"
                    class="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-100 z-50 max-h-48 overflow-y-auto">
                    <div v-if="filteredCustomers.length > 0">
                        <div v-for="cust in filteredCustomers" :key="cust.id" @click="$emit('selectCustomer', cust)"
                            class="p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between">
                            <div class="flex-1 min-w-0">
                                <div class="font-medium text-slate-800 text-sm truncate">{{ cust.name }}</div>
                                <div class="text-xs text-slate-500 truncate">{{ cust.phone }}</div>
                            </div>
                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">{{
                                cust.level }}</span>
                        </div>
                    </div>

                    <div v-else class="p-3 flex flex-col items-center text-center">
                        <p class="text-sm text-slate-500 mb-2">Không tìm thấy</p>
                        <button @click="$emit('openAddCustomerModal')"
                            class="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors">
                            + Thêm mới
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Voucher & Promotions - Compact -->
        <div v-if="cart.length > 0" class="border-b border-slate-100 bg-slate-50 shrink-0">
            <!-- Voucher Button -->
            <button @click="$emit('openVoucherModal')"
                class="w-full h-9 px-3 border-b border-slate-200 bg-white hover:bg-purple-50 text-purple-600 font-medium text-sm transition-all flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                {{ appliedVoucher ? 'Đổi mã giảm giá' : 'Nhập mã giảm giá' }}
            </button>

            <!-- Promotions Display - Compact & Scrollable -->
            <div v-if="appliedPromotions.length > 0" class="max-h-24 overflow-y-auto">
                <PromotionDisplay :promotions="appliedPromotions" @remove="$emit('removePromotion', $event)" />
            </div>
        </div>

        <!-- Cart Items List - Main Scrollable Area -->
        <div class="flex-1 overflow-y-auto bg-slate-50">
            <div v-if="cart.length > 0">
                <div v-for="(item, index) in cart" :key="`cart-item-${item.id}-${index}`"
                    class="p-2.5 bg-white border-b border-slate-100 flex gap-2.5 hover:bg-slate-50 transition-colors relative"
                    :class="{ 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200': item.isGift }">

                    <!-- Gift Badge -->
                    <div v-if="item.isGift"
                        class="absolute top-0 right-0 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg">
                        🎁 TẶNG
                    </div>

                    <!-- Item Image -->
                    <div class="w-12 h-12 rounded bg-slate-100 overflow-hidden shrink-0"
                        :class="{ 'ring-2 ring-pink-300': item.isGift }">
                        <img v-if="item.imageUrl" :src="item.imageUrl" class="w-full h-full object-cover"
                            :alt="item.name">
                    </div>

                    <!-- Item Details -->
                    <div class="flex-1 min-w-0 flex flex-col justify-between">
                        <div class="flex justify-between items-start gap-2">
                            <div class="flex-1 min-w-0">
                                <h4 class="text-sm font-medium text-slate-700 truncate">{{ item.name }}</h4>
                                <div v-if="item.note"
                                    class="text-xs text-amber-600 mt-0.5 truncate flex items-center gap-1">
                                    <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span class="truncate">{{ item.note }}</span>
                                </div>
                            </div>
                            <div class="text-right shrink-0">
                                <span class="text-sm font-bold text-slate-800">
                                    {{ formatPrice(item.price * item.quantity) }}
                                </span>
                            </div>
                        </div>

                        <div class="flex items-center justify-between mt-1">
                            <!-- Quantity Controls -->
                            <div v-if="!item.isGift" class="flex items-center gap-1">
                                <div class="flex items-center gap-0.5 bg-slate-100 rounded p-0.5">
                                    <button @click="$emit('updateQuantity', item, -1)"
                                        class="w-6 h-6 flex items-center justify-center rounded bg-white text-slate-600 shadow-sm hover:text-blue-600 disabled:opacity-50 transition-colors"
                                        :disabled="item.quantity <= 1">
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <input type="text" :value="item.quantity" readonly
                                        class="w-7 text-center bg-transparent text-xs font-semibold focus:outline-none">
                                    <button @click="$emit('updateQuantity', item, 1)"
                                        class="w-6 h-6 flex items-center justify-center rounded bg-white text-slate-600 shadow-sm hover:text-blue-600 transition-colors">
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>

                                <!-- Note Button -->
                                <button @click="$emit('openProductNoteModal', item)"
                                    class="p-1 text-slate-400 hover:text-amber-500 rounded hover:bg-amber-50 transition-colors"
                                    :class="{ 'text-amber-500 bg-amber-50': item.note }">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                            </div>
                            <div v-else class="text-xs text-pink-600 font-medium">Quà tặng</div>

                            <!-- Delete Button -->
                            <button v-if="!item.isGift" @click="$emit('removeFromCart', item.id)"
                                class="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty Cart -->
            <div v-else class="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg class="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <p class="text-sm">Giỏ hàng trống</p>
                <p class="text-xs mt-1">Chọn sản phẩm để bắt đầu</p>
            </div>
        </div>

        <!-- Summary Section - Fixed at Bottom -->
        <div class="border-t border-slate-200 bg-white shrink-0">
            <!-- Totals -->
            <div class="px-3 py-2 space-y-1.5 text-sm">
                <div class="flex justify-between text-slate-600">
                    <span>Tổng tiền hàng ({{ totalQuantity }})</span>
                    <span class="font-medium">{{ formatPrice(subTotal) }} ₫</span>
                </div>

                <button v-if="cart.length > 0" @click="$emit('openDiscountModal')"
                    class="w-full flex justify-between items-center text-blue-600 hover:text-blue-700 transition-colors">
                    <span class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Giảm giá (F6)
                    </span>
                    <span class="font-medium">{{ discount > 0 ? `-${formatPrice(discount)}` : '0' }} ₫</span>
                </button>
            </div>

            <!-- Total Amount -->
            <div class="px-3 py-3 bg-slate-50 border-t border-slate-200">
                <div class="flex justify-between items-center">
                    <span class="text-slate-600 font-medium">Khách phải trả</span>
                    <span class="text-2xl font-bold text-blue-600">{{ formatPrice(totalAmount) }} ₫</span>
                </div>
            </div>

            <!-- Payment Button -->
            <div class="p-3">
                <button @click="$emit('openPaymentModal')" :disabled="cart.length === 0"
                    class="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none active:scale-[0.98]">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    THANH TOÁN (F9)
                </button>
            </div>
        </div>
    </aside>
</template>

<style scoped>
/* Custom scrollbar for cart list */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>
