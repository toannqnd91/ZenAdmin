<script setup lang="ts">
interface CartItem {
    id: number
    name: string
    price: number
    quantity: number
    note?: string
}

interface Order {
    id: number
    orderNumber: string
    date: string
    items: CartItem[]
    total: number
    customer?: { name: string; phone: string }
    employee: string
}

interface ReturnItem extends CartItem {
    returnQty: number
    maxQty: number
}

interface Props {
    show: boolean
    mode: 'return' | 'exchange'
    orders: Order[]
    cart: CartItem[]
    returnTotal: number
    totalAmount: number
    finalReturnAmount: number
}

interface Emits {
    (e: 'update:show', value: boolean): void
    (e: 'selectOrder', order: Order): void
    (e: 'updateReturnQty', item: ReturnItem, delta: number): void
    (e: 'process', data: { reason: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchQuery = ref('')
const selectedOrder = ref<Order | null>(null)
const returnItems = ref<ReturnItem[]>([])
const returnReason = ref('')

const filteredOrders = computed(() => {
    if (!searchQuery.value.trim()) return props.orders.slice(0, 10)
    const q = searchQuery.value.toLowerCase()
    return props.orders.filter(order =>
        order.orderNumber.toLowerCase().includes(q) ||
        order.customer?.name.toLowerCase().includes(q) ||
        order.customer?.phone.includes(q)
    ).slice(0, 10)
})

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN').format(price)
}

function close() {
    emit('update:show', false)
    reset()
}

function reset() {
    searchQuery.value = ''
    selectedOrder.value = null
    returnItems.value = []
    returnReason.value = ''
}

function selectOrder(order: Order) {
    selectedOrder.value = order
    returnItems.value = order.items.map(item => ({
        ...item,
        returnQty: 0,
        maxQty: item.quantity
    }))
    emit('selectOrder', order)
}

function backToSearch() {
    selectedOrder.value = null
    returnItems.value = []
}

function updateQty(item: ReturnItem, delta: number) {
    emit('updateReturnQty', item, delta)
}

function process() {
    const returningItems = returnItems.value.filter(item => item.returnQty > 0)

    if (returningItems.length === 0) {
        alert('Vui lòng chọn sản phẩm cần trả!')
        return
    }

    if (props.mode === 'exchange' && props.cart.length === 0) {
        alert('Vui lòng thêm sản phẩm mua mới vào giỏ hàng!')
        return
    }

    emit('process', { reason: returnReason.value })
}

watch(() => props.show, (newVal) => {
    if (!newVal) {
        reset()
    }
})
</script>

<template>
    <div v-if="show"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
                :class="mode === 'return' ? 'bg-amber-50' : 'bg-purple-50'">
                <div>
                    <h3 class="font-bold text-xl" :class="mode === 'return' ? 'text-amber-800' : 'text-purple-800'">
                        <template v-if="mode === 'return'">Trả hàng / Hoàn tiền</template>
                        <template v-else>Đổi hàng (Trả + Mua mới)</template>
                    </h3>
                    <p class="text-sm text-slate-600 mt-0.5">
                        <template v-if="mode === 'return'">Chọn đơn hàng và sản phẩm cần trả</template>
                        <template v-else>Chọn sản phẩm trả và thêm sản phẩm mới vào giỏ</template>
                    </p>
                </div>
                <button @click="close"
                    class="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto p-6 space-y-4">
                <!-- Step 1: Search and Select Order -->
                <div v-if="!selectedOrder" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Tìm kiếm đơn hàng</label>
                        <input v-model="searchQuery" type="text" placeholder="Nhập mã đơn, tên hoặc SĐT khách hàng..."
                            class="w-full h-11 px-4 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all">
                    </div>

                    <!-- Order List -->
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        <div v-if="filteredOrders.length === 0" class="text-center py-8 text-slate-400">
                            <svg class="w-16 h-16 mx-auto mb-2 opacity-20" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p>Không tìm thấy đơn hàng</p>
                        </div>

                        <div v-for="order in filteredOrders" :key="order.id" @click="selectOrder(order)"
                            class="p-4 border-2 border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <div class="font-bold text-slate-800">{{ order.orderNumber }}</div>
                                    <div class="text-sm text-slate-500">{{ new Date(order.date).toLocaleString('vi-VN')
                                        }}</div>
                                </div>
                                <div class="text-right">
                                    <div class="font-bold text-blue-600">{{ formatPrice(order.total) }} ₫</div>
                                    <div v-if="order.customer" class="text-xs text-slate-500">{{ order.customer.name }}
                                    </div>
                                </div>
                            </div>
                            <div class="text-xs text-slate-600">
                                {{ order.items.length }} sản phẩm • {{ order.employee }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Select Return Items -->
                <div v-else class="space-y-4">
                    <!-- Selected Order Info -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <div class="font-bold text-blue-800">{{ selectedOrder.orderNumber }}</div>
                                <div class="text-sm text-blue-600">{{ new
                                    Date(selectedOrder.date).toLocaleString('vi-VN') }}</div>
                            </div>
                            <button @click="backToSearch" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                Chọn đơn khác
                            </button>
                        </div>
                    </div>

                    <!-- Return Items Selection -->
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Chọn sản phẩm cần trả</label>
                        <div class="space-y-2 max-h-64 overflow-y-auto">
                            <div v-for="item in returnItems" :key="item.id"
                                class="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="font-medium text-slate-800">{{ item.name }}</div>
                                    <div class="text-sm text-slate-500">{{ formatPrice(item.price) }} ₫ × {{ item.maxQty
                                        }}</div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-sm text-slate-600">Trả:</span>
                                    <div class="flex items-center gap-1 bg-slate-100 rounded p-0.5">
                                        <button @click="updateQty(item, -1)"
                                            class="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-600 shadow-sm hover:text-blue-600 disabled:opacity-30"
                                            :disabled="item.returnQty <= 0">
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M20 12H4" />
                                            </svg>
                                        </button>
                                        <input type="text" :value="item.returnQty" readonly
                                            class="w-10 text-center bg-transparent text-sm font-semibold focus:outline-none">
                                        <button @click="updateQty(item, 1)"
                                            class="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-600 shadow-sm hover:text-blue-600 disabled:opacity-30"
                                            :disabled="item.returnQty >= item.maxQty">
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    </div>
                                    <span class="text-sm font-bold text-amber-600 w-24 text-right">
                                        {{ formatPrice(item.price * item.returnQty) }} ₫
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Return Reason -->
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Lý do trả hàng</label>
                        <textarea v-model="returnReason" rows="2"
                            class="w-full px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all resize-none"
                            placeholder="Ví dụ: Sản phẩm lỗi, không vừa ý..."></textarea>
                    </div>

                    <!-- Exchange Mode: Current Cart -->
                    <div v-if="mode === 'exchange'" class="border-t pt-4">
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-sm font-medium text-slate-700">Sản phẩm mua mới ({{ cart.length
                                }})</label>
                            <button @click="close" class="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                + Thêm sản phẩm
                            </button>
                        </div>
                        <div v-if="cart.length > 0"
                            class="space-y-2 max-h-32 overflow-y-auto bg-slate-50 rounded-lg p-3">
                            <div v-for="item in cart" :key="item.id" class="flex justify-between text-sm">
                                <span class="text-slate-700">{{ item.name }} × {{ item.quantity }}</span>
                                <span class="font-semibold">{{ formatPrice(item.price * item.quantity) }} ₫</span>
                            </div>
                        </div>
                        <div v-else class="text-center py-4 text-slate-400 text-sm bg-slate-50 rounded-lg">
                            Chưa có sản phẩm mới. Vui lòng thêm sản phẩm vào giỏ hàng.
                        </div>
                    </div>

                    <!-- Summary -->
                    <div class="bg-slate-50 rounded-lg p-4 space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-600">Tổng tiền hàng trả:</span>
                            <span class="font-semibold text-amber-600">{{ formatPrice(returnTotal) }} ₫</span>
                        </div>
                        <div v-if="mode === 'exchange'" class="flex justify-between text-sm">
                            <span class="text-slate-600">Tổng tiền hàng mới:</span>
                            <span class="font-semibold text-blue-600">{{ formatPrice(totalAmount) }} ₫</span>
                        </div>
                        <div class="pt-2 border-t border-slate-200 flex justify-between">
                            <span class="font-bold text-lg">
                                <template v-if="mode === 'return'">Số tiền hoàn:</template>
                                <template v-else-if="finalReturnAmount >= 0">Khách cần trả thêm:</template>
                                <template v-else>Hoàn lại khách:</template>
                            </span>
                            <span class="font-bold text-2xl"
                                :class="mode === 'return' || finalReturnAmount < 0 ? 'text-green-600' : 'text-blue-600'">
                                {{ formatPrice(Math.abs(finalReturnAmount)) }} ₫
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t">
                <button @click="close"
                    class="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                    Hủy bỏ
                </button>
                <button v-if="selectedOrder" @click="process"
                    class="px-6 py-3 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95"
                    :class="mode === 'return' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'">
                    {{ mode === 'return' ? 'Xác nhận trả hàng' : 'Xác nhận đổi hàng' }}
                </button>
            </div>
        </div>
    </div>
</template>
