<template>
    <div class="h-full flex bg-slate-50">
        <!-- Left Column: Orders List -->
        <PosSidebar class="w-80">
            <template #header>
                <!-- Search & Filter -->
                <PosInput v-model="searchQuery" :show-date-range="true" v-model:start-date="startDate"
                    v-model:end-date="endDate" placeholder="Tìm đơn hàng..." icon="search" size="sm" />

                <!-- Status Filters -->
                <div class="px-3 pb-3 flex gap-1.5 border-b border-slate-200">
                    <button v-for="status in statuses" :key="status.value" @click="selectedStatus = status.value"
                        class="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                        :class="selectedStatus === status.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
                        {{ status.label }}
                    </button>
                </div>
            </template>

            <!-- Orders List -->
            <PosListItem v-for="order in filteredOrders" :key="order.id" :active="selectedOrder?.id === order.id"
                @click="selectOrder(order)">
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <div class="font-bold text-slate-800">#{{ order.code }}</div>
                        <div class="text-xs text-slate-500 mt-1">{{ order.createdAt }}</div>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm"
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
            </PosListItem>

            <template #empty>
                <div v-if="filteredOrders.length === 0" class="text-center p-4">
                    <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="text-sm font-medium text-slate-400">Không tìm thấy đơn hàng</p>
                </div>
            </template>
        </PosSidebar>

        <!-- Right Column: Order Detail -->
        <div class="flex-1 flex flex-col bg-slate-50 min-w-0">
            <!-- Order Detail Content (Scrollable) -->
            <div v-if="selectedOrder" class="flex-1 overflow-y-auto flex flex-col">
                <!-- Order Header -->
                <div class="bg-white px-8 py-6 border-b border-slate-200">
                    <div class="flex items-start justify-between mb-8">
                        <div>
                            <div class="flex items-center gap-3 mb-2">
                                <h2 class="text-3xl font-bold text-slate-800 tracking-tight">#{{ selectedOrder.code }}
                                </h2>
                                <span
                                    class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm"
                                    :class="getStatusClass(selectedOrder.status)">
                                    {{ getStatusLabel(selectedOrder.status) }}
                                </span>
                            </div>
                            <p class="text-slate-500 font-medium">{{ selectedOrder.createdAt }}</p>
                        </div>

                        <!-- Action Buttons Moved Here -->
                        <div class="flex gap-3">
                            <button
                                class="h-10 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all font-bold flex items-center justify-center gap-2 text-sm shadow-sm active:scale-[0.98]">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Xuất Excel
                            </button>
                            <button
                                class="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 text-sm active:scale-[0.98]">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                In hóa đơn
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
                        <div class="group">
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Khách hàng
                            </div>
                            <div
                                class="font-semibold text-slate-800 text-base group-hover:text-blue-600 transition-colors cursor-pointer">
                                {{ selectedOrder.customerName || 'Khách lẻ' }}
                            </div>
                        </div>
                        <div>
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                Số điện thoại
                            </div>
                            <div class="font-medium text-slate-800 text-base font-mono">{{ selectedOrder.customerPhone
                                || '-' }}</div>
                        </div>
                        <div>
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Nhân viên
                            </div>
                            <div class="font-medium text-slate-800 text-base">{{ selectedOrder.employee }}</div>
                        </div>
                        <div>
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Thanh toán
                            </div>
                            <div class="font-medium text-slate-800 text-base">{{ selectedOrder.paymentMethod }}</div>
                        </div>
                    </div>
                </div>

                <!-- Order Items -->
                <div class="bg-white pb-6 flex-1">
                    <div
                        class="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                        <h3 class="font-bold text-slate-700 text-sm uppercase tracking-wider">Chi tiết sản phẩm</h3>
                        <span class="text-xs font-semibold text-slate-400">{{ selectedOrder.items?.length || 0 }}
                            món</span>
                    </div>
                    <div class="px-8 py-2">
                        <div v-for="item in selectedOrder.items" :key="item.id"
                            class="flex gap-4 items-center py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 -mx-8 px-8 transition-colors">
                            <div
                                class="w-14 h-14 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-100 shadow-sm">
                                <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name"
                                    class="w-full h-full object-cover" />
                                <div v-else
                                    class="w-full h-full flex items-center justify-center text-slate-300 font-bold">
                                    {{ item.name.charAt(0) }}
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-semibold text-slate-800 text-base mb-0.5">{{ item.name }}</div>
                                <div class="text-sm text-slate-500 font-medium">{{ formatPrice(item.price) }} x {{
                                    item.quantity }}</div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold text-slate-800 text-base">{{ formatPrice(item.price *
                                    item.quantity) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Summary Footer (Balanced Layout) -->
            <div v-if="selectedOrder"
                class="px-8 py-5 bg-white border-t border-slate-200 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div class="flex items-center justify-between gap-4">
                    <!-- Left: Breakdown Details -->
                    <div class="flex items-center gap-12">
                        <div>
                            <div class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Tổng tiền hàng
                            </div>
                            <div class="text-lg font-bold text-slate-700 font-mono">{{
                                formatPrice(selectedOrder.subtotal) }}</div>
                        </div>
                        <div>
                            <div class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Giảm giá</div>
                            <div class="text-lg font-bold text-red-600 font-mono">{{ selectedOrder.discount > 0 ? '-' :
                                '' }}{{ formatPrice(selectedOrder.discount) }}</div>
                        </div>
                        <!-- Order Note (If exists) -->
                        <div v-if="selectedOrder.customerName">
                            <div class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Khách hàng</div>
                            <div class="text-lg font-bold text-slate-700 truncate max-w-[150px]">{{
                                selectedOrder.customerName }}</div>
                        </div>
                    </div>

                    <!-- Right: Grand Total -->
                    <div class="flex items-center gap-6 pl-12 border-l border-slate-100">
                        <div class="text-right">
                            <div class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Khách phải trả
                            </div>
                            <div class="text-xs text-slate-400 font-medium">Đã thanh toán</div>
                        </div>
                        <div class="text-3xl font-bold text-blue-600 tracking-tight font-mono">{{
                            formatPrice(selectedOrder.total) }}</div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <!-- Empty State -->
            <PosEmptyState v-if="!selectedOrder" message="Chọn đơn hàng để xem chi tiết"
                sub-message="Thông tin chi tiết sẽ hiển thị ở đây" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PosInput from '~/components/pos/PosInput.vue'

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
