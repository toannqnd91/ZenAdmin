<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import SearchInput from '~/components/pos/SearchInput.vue'

interface CartItem {
    id: number
    name: string
    price: number
    quantity: number // Quantity bought (or returned if negative in cart)
    note?: string
    isReturn?: boolean
    originalOrderId?: number
}

interface Order {
    id: number
    orderNumber: string
    date: string
    items: CartItem[]
    total: number
    customer?: { id: number; name: string; phone: string; level?: string; points?: number; address?: string }
    employee: string
}

interface Props {
    orders: Order[]
    cart: CartItem[] // Receive current cart to sync state
}

interface Emits {
    (e: 'select-return-item', item: CartItem, order: Order, qty: number): void
    (e: 'open-exchange-modal'): void
    (e: 'set-customer', customer: any): void
    (e: 'select-order', order: Order): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchQuery = ref('')
const selectedOrder = ref<Order | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)

const filteredOrders = computed(() => {
    if (!searchQuery.value.trim()) return props.orders.slice(0, 20)
    const q = searchQuery.value.toLowerCase()
    return props.orders.filter(order =>
        order.orderNumber.toLowerCase().includes(q) ||
        order.customer?.name.toLowerCase().includes(q) ||
        order.customer?.phone.includes(q)
    ).slice(0, 20)
})

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN').format(price)
}

function selectOrder(order: Order) {
    selectedOrder.value = order
    emit('select-order', order)
    // Auto fill customer info when order is selected
    if (order.customer) {
        emit('set-customer', order.customer)
    }
}

// Get current return quantity of an item from the main cart
function getReturningQty(itemId: number, orderId: number): number {
    const item = props.cart.find(i => i.id === itemId && i.isReturn && i.originalOrderId === orderId)
    return item ? Math.abs(item.quantity) : 0
}

function updateReturnQty(item: CartItem, delta: number) {
    if (!selectedOrder.value) return
    const currentQty = getReturningQty(item.id, selectedOrder.value.id)
    const newQty = currentQty + delta

    // Validation: 0 <= newQty <= boughtQty
    if (newQty >= 0 && newQty <= item.quantity) {
        // Emit delta instead of item, parent handles complex logic
        emit('select-return-item', item, selectedOrder.value, delta)
    }
}

onMounted(() => {
    searchInput.value?.focus()
})
</script>

<template>
    <div class="h-full flex flex-col bg-slate-50">
        <!-- Return Mode Header -->
        <div class="bg-amber-50 px-4 py-3 border-b border-amber-200 flex justify-between items-center shrink-0">
            <div class="flex items-center gap-3">
                <div class="p-2 bg-amber-100 rounded-lg text-amber-700">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                </div>
                <div>
                    <h3 class="font-bold text-slate-800">Chế độ Trả/Đổi hàng</h3>
                    <p class="text-xs text-slate-500">Chọn đơn cũ để trả, sau đó chọn hàng mới để đổi</p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <div class="text-xs text-amber-700 font-medium px-3 py-1 bg-amber-100 rounded-full hidden md:block">
                    Gợi ý: Chọn món trả xong bấm nút bên cạnh &rarr;
                </div>
                <!-- Action Button (Smaller & Modal Trigger) -->
                <button @click="$emit('open-exchange-modal')"
                    class="h-10 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md shadow-blue-500/30 flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-[0.98]">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>CHỌN SẢN PHẨM ĐỔI</span>
                </button>
            </div>
        </div>

        <div class="flex-1 overflow-hidden flex">
            <!-- Left: Order List -->
            <div class="w-80 border-r border-slate-200 flex flex-col bg-white">
                <SearchInput v-model="searchQuery" placeholder="Tìm đơn hàng (Mã, Tên, SĐT)..."
                    class="border-b border-slate-100" />

                <div class="flex-1 overflow-y-auto">
                    <div v-for="order in filteredOrders" :key="order.id" @click="selectOrder(order)"
                        class="p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
                        :class="selectedOrder?.id === order.id ? 'bg-amber-50 border-l-4 border-l-amber-500' : 'border-l-4 border-l-transparent'">
                        <div class="flex justify-between items-start mb-1">
                            <span class="font-bold text-slate-800">#{{ order.orderNumber }}</span>
                            <span class="font-medium text-slate-600">{{ formatPrice(order.total) }}</span>
                        </div>
                        <div class="text-xs text-slate-500 flex justify-between">
                            <span>{{ new Date(order.date).toLocaleDateString('vi-VN') }}</span>
                            <span>{{ order.customer?.name || 'Khách lẻ' }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Order Details -->
            <div class="flex-1 flex flex-col bg-slate-50/50">
                <div v-if="selectedOrder" class="h-full flex flex-col">
                    <div class="p-4 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm">
                        <div>
                            <div class="font-bold text-lg text-slate-800 flex items-center gap-2">
                                Chi tiết đơn #{{ selectedOrder.orderNumber }}
                                <span
                                    class="px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-700 border border-green-200 uppercase font-bold">Hoàn
                                    thành</span>
                            </div>
                            <div class="text-sm text-slate-500">
                                {{ new Date(selectedOrder.date).toLocaleString('vi-VN') }} • {{ selectedOrder.employee
                                }}
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs text-slate-500">Tổng cộng</div>
                            <div class="font-bold text-xl text-slate-800">{{ formatPrice(selectedOrder.total) }} ₫</div>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto p-4 space-y-3">
                        <div
                            class="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                            <span>Danh sách sản phẩm</span>
                            <span>Đã mua / Trả lại</span>
                        </div>

                        <div v-for="item in selectedOrder.items" :key="item.id"
                            class="bg-white p-3 rounded-xl border transition-all group flex justify-between items-center"
                            :class="getReturningQty(item.id, selectedOrder.id) > 0 ? 'border-amber-500 ring-1 ring-amber-500/20 bg-amber-50/30' : 'border-slate-200 hover:border-amber-300 shadow-sm'">

                            <div class="flex items-center gap-4">
                                <div
                                    class="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-lg relative overflow-hidden shrink-0">
                                    <span v-if="!item.name">?</span>
                                    <span v-else>{{ item.name.charAt(0) }}</span>

                                    <!-- Overlay if returned -->
                                    <div v-if="getReturningQty(item.id, selectedOrder.id) > 0"
                                        class="absolute inset-0 bg-amber-500/10 flex items-center justify-center backdrop-blur-[1px]">
                                        <svg class="w-6 h-6 text-amber-600 drop-shadow-sm" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <div class="font-medium text-slate-800"
                                        :class="{ 'text-amber-800': getReturningQty(item.id, selectedOrder.id) > 0 }">{{
                                            item.name }}</div>
                                    <div class="text-sm text-slate-500 flex items-center gap-2">
                                        <span>Giá mua: {{ formatPrice(item.price) }} ₫</span>
                                        <span v-if="item.note"
                                            class="text-xs text-amber-600 bg-amber-100 px-1.5 rounded">{{ item.note
                                            }}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center gap-6">
                                <div class="text-right">
                                    <div class="text-xs text-slate-400 font-medium uppercase">Đã mua</div>
                                    <div class="font-bold text-slate-700 text-lg tabular-nums">x{{ item.quantity }}
                                    </div>
                                </div>

                                <!-- Smart Stepper (Cart Style: White Buttons on Gray Container) -->
                                <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                    <!-- Minus Button -->
                                    <button @click.stop="updateReturnQty(item, -1)"
                                        :disabled="getReturningQty(item.id, selectedOrder.id) <= 0"
                                        class="w-8 h-8 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-red-600 hover:shadow disabled:opacity-50 disabled:shadow-none transition-all">
                                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M20 12H4" />
                                        </svg>
                                    </button>

                                    <!-- Value -->
                                    <div class="w-10 text-center font-bold text-lg tabular-nums"
                                        :class="getReturningQty(item.id, selectedOrder.id) > 0 ? 'text-amber-600' : 'text-slate-400'">
                                        {{ getReturningQty(item.id, selectedOrder.id) }}
                                    </div>

                                    <!-- Plus Button -->
                                    <button @click.stop="updateReturnQty(item, 1)"
                                        :disabled="getReturningQty(item.id, selectedOrder.id) >= item.quantity"
                                        class="w-8 h-8 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-green-600 hover:shadow disabled:opacity-50 disabled:shadow-none transition-all">
                                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="h-full flex flex-col items-center justify-center text-slate-400">
                    <svg class="w-20 h-20 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>Chọn một đơn hàng để xem chi tiết</p>
                </div>
            </div>
        </div>
    </div>
</template>
