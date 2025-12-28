<template>
    <div class="h-full flex bg-slate-50">
        <!-- Left Column: Orders List -->
        <div class="w-80 flex flex-col bg-white border-r border-slate-200">
            <!-- Search & Filter -->
            <SearchInput v-model="searchQuery" :show-date-range="true" v-model:start-date="startDate"
                v-model:end-date="endDate" placeholder="Tìm đơn hàng theo mã, khách hàng, SĐT..." />

            <!-- Status Filters -->
            <div class="px-3 pb-3 flex gap-1.5 border-b border-slate-200">
                <button v-for="status in statuses" :key="status.value" @click="selectedStatus = status.value"
                    class="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                    :class="selectedStatus === status.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
                    {{ status.label }}
                </button>
            </div>

            <!-- Orders List -->
            <div class="flex-1 overflow-y-auto">
                <div v-for="order in filteredOrders" :key="order.id"
                    class="p-4 border-b border-slate-100 cursor-pointer transition-colors"
                    :class="selectedOrder?.id === order.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'"
                    @click="selectOrder(order)">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <div class="font-bold text-slate-800">#{{ order.code }}</div>
                            <div class="text-xs text-slate-500 mt-1">{{ order.createdAt }}</div>
                        </div>
                        <span class="px-2.5 py-1 rounded-full text-xs font-medium"
                            :class="getStatusClass(order.status)">
                            {{ getStatusLabel(order.status) }}
                        </span>
                    </div>

                    <div class="space-y-1.5 text-sm">
                        <div class="flex items-center gap-2 text-slate-600">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {{ order.customerName || 'Khách lẻ' }}
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-slate-500">{{ order.itemCount }} sản phẩm</span>
                            <span class="font-semibold text-blue-600">{{ formatPrice(order.total) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-if="filteredOrders.length === 0"
                    class="flex flex-col items-center justify-center py-16 text-slate-400">
                    <svg class="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="text-sm font-medium">Không tìm thấy đơn hàng</p>
                </div>
            </div>
        </div>

        <!-- Right Column: Order Detail -->
        <div class="flex-1 flex flex-col">
            <!-- Order Detail Content -->
            <div v-if="selectedOrder" class="flex-1 overflow-y-auto p-6">
                <!-- Order Header -->
                <div class="bg-white rounded-lg border border-slate-200 p-5 mb-4">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h2 class="text-2xl font-bold text-slate-800">#{{ selectedOrder.code }}</h2>
                            <p class="text-sm text-slate-500 mt-1">{{ selectedOrder.createdAt }}</p>
                        </div>
                        <span class="px-3 py-1.5 rounded-full text-sm font-medium"
                            :class="getStatusClass(selectedOrder.status)">
                            {{ getStatusLabel(selectedOrder.status) }}
                        </span>
                    </div>

                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div class="text-slate-500 mb-1">Khách hàng</div>
                            <div class="font-medium text-slate-800">{{ selectedOrder.customerName || 'Khách lẻ' }}</div>
                        </div>
                        <div>
                            <div class="text-slate-500 mb-1">Số điện thoại</div>
                            <div class="font-medium text-slate-800">{{ selectedOrder.customerPhone || '-' }}</div>
                        </div>
                        <div>
                            <div class="text-slate-500 mb-1">Nhân viên</div>
                            <div class="font-medium text-slate-800">{{ selectedOrder.employee }}</div>
                        </div>
                        <div>
                            <div class="text-slate-500 mb-1">Phương thức thanh toán</div>
                            <div class="font-medium text-slate-800">{{ selectedOrder.paymentMethod }}</div>
                        </div>
                    </div>
                </div>

                <!-- Order Items -->
                <div class="bg-white rounded-lg border border-slate-200 p-5 mb-4">
                    <h3 class="font-semibold text-slate-800 mb-4">Chi tiết sản phẩm</h3>
                    <div class="space-y-3">
                        <div v-for="item in selectedOrder.items" :key="item.id"
                            class="flex gap-4 pb-3 border-b border-slate-100 last:border-0">
                            <div class="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                                <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name"
                                    class="w-full h-full object-cover" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-medium text-slate-800">{{ item.name }}</div>
                                <div class="text-sm text-slate-500 mt-0.5">{{ formatPrice(item.price) }} x {{
                                    item.quantity }}</div>
                            </div>
                            <div class="text-right">
                                <div class="font-semibold text-slate-800">{{ formatPrice(item.price * item.quantity) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Order Summary -->
                <div class="bg-white rounded-lg border border-slate-200 p-5">
                    <h3 class="font-semibold text-slate-800 mb-4">Tổng kết đơn hàng</h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-slate-600">Tổng tiền hàng ({{ selectedOrder.itemCount }} sản phẩm)</span>
                            <span class="font-medium text-slate-800">{{ formatPrice(selectedOrder.subtotal) }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-600">Giảm giá</span>
                            <span class="font-medium text-red-600">-{{ formatPrice(selectedOrder.discount) }}</span>
                        </div>
                        <div class="flex justify-between pt-2 border-t border-slate-200">
                            <span class="font-semibold text-slate-800">Khách phải trả</span>
                            <span class="text-xl font-bold text-blue-600">{{ formatPrice(selectedOrder.total) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else class="flex-1 flex flex-col items-center justify-center text-slate-400">
                <svg class="w-20 h-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-lg font-medium">Chọn đơn hàng để xem chi tiết</p>
            </div>

            <!-- Action Buttons -->
            <div v-if="selectedOrder" class="p-4 bg-white border-t border-slate-200 flex gap-3">
                <button
                    class="flex-1 h-11 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    In hóa đơn
                </button>
                <button
                    class="flex-1 h-11 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                    Xuất Excel
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SearchInput from '~/components/pos/SearchInput.vue'

const searchQuery = ref('')
const selectedStatus = ref('all')
const startDate = ref('')
const endDate = ref('')
const selectedOrder = ref<any>(null)

function clearDates() {
    startDate.value = ''
    endDate.value = ''
}

const statuses = [
    { value: 'all', label: 'Tất cả' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'pending', label: 'Chờ xử lý' },
]

// Mock data with detailed items
const orders = ref([
    {
        id: 1,
        code: 'DH001',
        customerName: 'Nguyễn Văn A',
        customerPhone: '0901234567',
        employee: 'Phạm Văn Toàn',
        paymentMethod: 'Tiền mặt',
        itemCount: 2,
        subtotal: 115000,
        discount: 0,
        total: 115000,
        status: 'completed',
        createdAt: '28/12/2024 14:30',
        items: [
            { id: 1, name: 'Cà phê đen đá', price: 25000, quantity: 1, imageUrl: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=400&q=80' },
            { id: 2, name: 'Trà vải hạt sen', price: 90000, quantity: 1, imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80' },
        ]
    },
    {
        id: 2,
        code: 'DH002',
        customerName: 'Trần Thị B',
        customerPhone: '0912345678',
        employee: 'Phạm Văn Toàn',
        paymentMethod: 'Chuyển khoản',
        itemCount: 5,
        subtotal: 280000,
        discount: 0,
        total: 280000,
        status: 'completed',
        createdAt: '28/12/2024 13:15',
        items: [
            { id: 1, name: 'Cà phê sữa đá', price: 29000, quantity: 3, imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80' },
            { id: 2, name: 'Bạc xỉu', price: 32000, quantity: 2, imageUrl: 'https://images.unsplash.com/photo-1585849834997-6a1b2d77d13e?w=400&q=80' },
        ]
    },
    {
        id: 3,
        code: 'DH003',
        customerName: null,
        customerPhone: null,
        employee: 'Phạm Văn Toàn',
        paymentMethod: 'Tiền mặt',
        itemCount: 2,
        subtotal: 75000,
        discount: 0,
        total: 75000,
        status: 'pending',
        createdAt: '28/12/2024 12:00',
        items: [
            { id: 1, name: 'Espresso', price: 35000, quantity: 1, imageUrl: 'https://images.unsplash.com/photo-1510591509098-f40718131299?w=400&q=80' },
            { id: 2, name: 'Latte', price: 40000, quantity: 1, imageUrl: 'https://images.unsplash.com/photo-1570968992193-6e5c9f506821?w=400&q=80' },
        ]
    },
])

const filteredOrders = computed(() => {
    let result = orders.value
    if (selectedStatus.value !== 'all') {
        result = result.filter(o => o.status === selectedStatus.value)
    }
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(o =>
            o.code.toLowerCase().includes(query) ||
            o.customerName?.toLowerCase().includes(query)
        )
    }
    return result
})

function selectOrder(order: any) {
    selectedOrder.value = order
}

function getStatusClass(status: string) {
    const classes = {
        completed: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-700',
        cancelled: 'bg-red-100 text-red-700',
    }
    return classes[status as keyof typeof classes] || 'bg-slate-100 text-slate-700'
}

function getStatusLabel(status: string) {
    const labels = {
        completed: 'Hoàn thành',
        pending: 'Chờ xử lý',
        cancelled: 'Đã hủy',
    }
    return labels[status as keyof typeof labels] || status
}

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}
</script>
