<template>
    <div class="h-full flex bg-slate-50">
        <!-- Left Column: Date Range & Summary -->
        <div class="w-80 flex flex-col bg-white border-r border-slate-200">
            <!-- Date Range Selector -->
            <div class="border-b border-slate-200 p-4">
                <div class="flex flex-col gap-2">
                    <button v-for="range in dateRanges" :key="range.value" @click="selectedRange = range.value"
                        class="px-3 py-2 rounded-lg text-sm font-medium transition-all text-left"
                        :class="selectedRange === range.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
                        {{ range.label }}
                    </button>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="flex-1 overflow-y-auto p-4 space-y-3">
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div class="text-xs text-blue-600 font-medium mb-1">Tổng doanh thu</div>
                    <div class="text-2xl font-bold text-blue-900">{{ formatPrice(summary.revenue) }}</div>
                    <div class="text-xs text-blue-600 mt-1">↑ 12% so với kỳ trước</div>
                </div>
                <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div class="text-xs text-green-600 font-medium mb-1">Lợi nhuận</div>
                    <div class="text-2xl font-bold text-green-900">{{ formatPrice(summary.profit) }}</div>
                    <div class="text-xs text-green-600 mt-1">↑ 8% so với kỳ trước</div>
                </div>
                <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div class="text-xs text-purple-600 font-medium mb-1">Đơn hàng</div>
                    <div class="text-2xl font-bold text-purple-900">{{ summary.orders }}</div>
                    <div class="text-xs text-purple-600 mt-1">Trung bình {{ Math.round(summary.orders / 7) }}/ngày</div>
                </div>
                <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                    <div class="text-xs text-orange-600 font-medium mb-1">Khách hàng</div>
                    <div class="text-2xl font-bold text-orange-900">{{ summary.customers }}</div>
                    <div class="text-xs text-orange-600 mt-1">{{ summary.newCustomers }} khách mới</div>
                </div>
            </div>

            <!-- Export Button -->
            <div class="p-4 bg-white border-t border-slate-200">
                <button
                    class="w-full h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Xuất Excel
                </button>
            </div>
        </div>

        <!-- Right Column: Charts & Details -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
            <!-- Top Products -->
            <div class="bg-white rounded-lg border border-slate-200 p-5">
                <h3 class="font-semibold text-slate-800 mb-4">Sản phẩm bán chạy</h3>
                <div class="space-y-3">
                    <div v-for="(product, index) in topProducts" :key="product.id" class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                            :class="index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'">
                            {{ index + 1 }}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-slate-800 truncate">{{ product.name }}</div>
                            <div class="text-sm text-slate-500">{{ product.sold }} đã bán</div>
                        </div>
                        <div class="font-semibold text-green-600">{{ formatPrice(product.revenue) }}</div>
                    </div>
                </div>
            </div>

            <!-- Revenue by Day -->
            <div class="bg-white rounded-lg border border-slate-200 p-5">
                <h3 class="font-semibold text-slate-800 mb-4">Doanh thu theo ngày</h3>
                <div class="space-y-3">
                    <div v-for="day in revenueByDay" :key="day.date" class="flex items-center gap-3">
                        <div class="text-sm text-slate-600 w-16">{{ day.date }}</div>
                        <div class="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div class="bg-blue-600 h-full rounded-full transition-all"
                                :style="{ width: day.percentage + '%' }"></div>
                        </div>
                        <div class="text-sm font-semibold text-slate-800 w-28 text-right">{{ formatPrice(day.amount) }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Revenue Chart Placeholder -->
            <div class="bg-white rounded-lg border border-slate-200 p-5">
                <h3 class="font-semibold text-slate-800 mb-4">Biểu đồ doanh thu</h3>
                <div class="h-64 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    <div class="text-center">
                        <svg class="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p class="text-sm">Biểu đồ sẽ được hiển thị ở đây</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const selectedRange = ref('week')

const dateRanges = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'week', label: 'Tuần này' },
    { value: 'month', label: 'Tháng này' },
]

const summary = ref({
    revenue: 28500000,
    profit: 12300000,
    orders: 156,
    customers: 89,
    newCustomers: 12,
})

const topProducts = ref([
    { id: 1, name: 'Cà phê sữa đá', sold: 45, revenue: 1305000 },
    { id: 2, name: 'Trà sữa trân châu', sold: 38, revenue: 1330000 },
    { id: 3, name: 'Bạc xỉu', sold: 32, revenue: 1024000 },
])

const revenueByDay = ref([
    { date: '28/12', amount: 4850000, percentage: 95 },
    { date: '27/12', amount: 5100000, percentage: 100 },
    { date: '26/12', amount: 3920000, percentage: 77 },
    { date: '25/12', amount: 4200000, percentage: 82 },
])

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}
</script>
