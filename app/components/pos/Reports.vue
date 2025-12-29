<template>
    <div class="h-full flex bg-slate-50">
        <!-- Left Column: Report Types -->
        <PosSidebar class="w-96 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] z-10">
            <template #header>
                <!-- Overview Card -->
                <div>
                    <div
                        class="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 text-white relative overflow-hidden shadow-md z-10">
                        <div class="absolute right-0 top-0 p-4 opacity-10">
                            <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                            </svg>
                        </div>

                        <div class="relative z-10">
                            <div class="text-purple-100 text-xs font-bold uppercase tracking-wider opacity-90 mb-1">
                                Doanh thu tháng này</div>
                            <div class="text-3xl font-bold mb-1 tracking-tight">{{ formatPrice(summary.revenue) }}</div>
                            <div class="text-purple-100 text-sm opacity-90 mb-6 flex items-center gap-1">
                                <span class="bg-white/20 px-1.5 rounded text-xs font-bold">↑ 12.5%</span>
                                so với tháng trước
                            </div>

                            <div class="grid grid-cols-2 gap-8 border-t border-white/10 pt-4">
                                <div>
                                    <div class="text-purple-100/70 text-xs mb-1 font-medium">Đơn hàng</div>
                                    <div class="font-bold text-lg text-white">1,250</div>
                                </div>
                                <div class="border-l border-white/10 pl-8">
                                    <div class="text-purple-100/70 text-xs mb-1 font-medium">Lợi nhuận</div>
                                    <div class="font-bold text-lg text-emerald-300">{{ formatPrice(summary.profit) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Report List Header -->
            <div
                class="px-4 py-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 sticky top-0 z-10">
                Loại báo cáo
            </div>

            <!-- Report Types List -->
            <PosListItem v-for="report in reportTypes" :key="report.id" :active="selectedReportId === report.id"
                @click="selectedReportId = report.id">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm"
                        :class="report.color">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="report.icon" />
                        </svg>
                    </div>
                    <div>
                        <div class="font-bold text-slate-800 text-[15px] group-hover:text-blue-700 transition-colors">{{
                            report.name
                            }}</div>
                        <div class="text-xs text-slate-500 mt-0.5">{{ report.description }}</div>
                    </div>
                </div>
            </PosListItem>
        </PosSidebar>

        <!-- Right Column: Report Detail -->
        <div class="flex-1 flex flex-col bg-slate-50 min-w-0">
            <!-- Header -->
            <div class="bg-white px-8 py-6 border-b border-slate-200 shrink-0 z-20 relative">
                <div class="flex items-start justify-between mb-8">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <h1 class="text-3xl font-bold text-slate-800 tracking-tight">
                                {{ activeReport.name }}
                            </h1>
                        </div>
                        <div class="flex items-center gap-2">
                            <!-- Employee Filter -->
                            <PosDropdown v-model="selectedEmployee" :options="employees" width="w-56"
                                placement="bottom-right">
                                <template #trigger="{ isOpen, display }">
                                    <button
                                        class="h-7 px-3 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5"
                                        :class="selectedEmployee.id !== 'all' ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'">
                                        <span>{{ display }}</span>
                                        <svg class="w-3 h-3 transition-transform duration-200"
                                            :class="{ 'rotate-180': isOpen }" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </template>
                            </PosDropdown>

                            <div class="w-px h-6 bg-slate-200 mx-1"></div>

                            <button v-for="range in dateRanges" :key="range.value"
                                @click="selectedDateRange = range.value"
                                class="h-7 px-3 rounded-full text-xs font-bold transition-all border"
                                :class="selectedDateRange === range.value ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'">
                                {{ range.label }}
                            </button>
                        </div>
                    </div>

                    <div class="flex gap-3">
                        <button
                            class="h-10 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-bold shadow-md shadow-green-600/20 flex items-center justify-center gap-2 text-sm active:scale-[0.98]">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Xuất Excel
                        </button>
                    </div>
                </div>

                <!-- Quick Stats Grid (Contextual) -->
                <div class="grid grid-cols-3 gap-8 text-sm">
                    <div v-for="(stat, index) in activeReportStats" :key="index">
                        <div
                            class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            {{ stat.label }}
                        </div>
                        <div class="font-bold text-xl tracking-tight text-slate-800" :class="stat.color">
                            {{ stat.value }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto flex flex-col">
                <!-- Detailed List/Table -->
                <div class="bg-white pb-6 flex-1">
                    <div
                        class="px-8 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                        <h3 class="font-bold text-slate-700 text-sm uppercase tracking-wider">Chi tiết {{
                            activeReport.name.toLowerCase() }}</h3>
                    </div>

                    <div class="px-8">
                        <!-- Iterate over rows -->
                        <div v-for="(row, idx) in activeReportData" :key="idx"
                            class="py-4 border-b border-slate-50 flex items-center justify-between group hover:bg-slate-50/50 transition-colors -mx-4 px-4 rounded-lg">
                            <div class="flex items-center gap-4">
                                <!-- Rank/Icon -->
                                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                    :class="idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'">
                                    {{ idx + 1 }}
                                </div>

                                <div>
                                    <div class="font-bold text-slate-800 text-[15px]">{{ row.main }}</div>
                                    <div class="text-xs text-slate-500 font-medium">{{ row.sub }}</div>
                                </div>
                            </div>

                            <div class="text-right">
                                <div class="font-bold text-slate-800 text-base tracking-tight">{{ row.value }}</div>
                                <div class="text-xs text-slate-400">{{ row.subValue }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const selectedReportId = ref('revenue')
const selectedDateRange = ref('week')

const employees = [
    { id: 'all', name: 'Tất cả nhân viên' },
    { id: 1, name: 'Nguyễn Văn A' },
    { id: 2, name: 'Trần Thị B' },
    { id: 3, name: 'Lê Văn C' }
]
const selectedEmployee = ref(employees[0] || { id: 'all', name: 'Tất cả nhân viên' })

const dateRanges = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'week', label: 'Tuần này' },
    { value: 'month', label: 'Tháng này' },
    { value: 'year', label: 'Năm nay' },
]

const summary = ref({
    revenue: 128500000,
    profit: 42300000
})

const reportTypes = [
    {
        id: 'revenue',
        name: 'Báo cáo doanh thu',
        description: 'Theo thời gian thực',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'bg-emerald-500'
    },
    {
        id: 'products',
        name: 'Sản phẩm bán chạy',
        description: 'Top sản phẩm & danh mục',
        icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
        color: 'bg-blue-500'
    },
    {
        id: 'customers',
        name: 'Khách hàng thân thiết',
        description: 'Xu hướng khách hàng',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        color: 'bg-purple-500'
    },
]

const activeReport = computed(() => {
    return reportTypes.find(r => r.id === selectedReportId.value) || reportTypes[0]
})

const activeReportStats = computed(() => {
    if (selectedReportId.value === 'revenue') {
        return [
            { label: 'Tổng doanh thu', value: formatPrice(128500000), color: 'text-emerald-600' },
            { label: 'Lợi nhuận gộp', value: formatPrice(42300000), color: 'text-blue-600' },
            { label: 'Trung bình đơn', value: formatPrice(185000), color: 'text-slate-800' },
        ]
    } else if (selectedReportId.value === 'products') {
        return [
            { label: 'Sản phẩm bán ra', value: '1,250', color: 'text-blue-600' },
            { label: 'Danh mục top', value: 'Cà phê', color: 'text-slate-800' },
            { label: 'Tồn kho cảnh báo', value: '3', color: 'text-red-500' },
        ]
    } else {
        return [
            { label: 'Tổng khách hàng', value: '850', color: 'text-purple-600' },
            { label: 'Khách mới', value: '45', color: 'text-emerald-600' },
            { label: 'Quay lại', value: '805', color: 'text-slate-800' },
        ]
    }
})

const activeReportData = computed(() => {
    if (selectedReportId.value === 'revenue') {
        // Daily breakdown
        return [
            { main: '29/12/2024', sub: 'Chủ nhật', value: formatPrice(15200000), subValue: '125 đơn hàng' },
            { main: '28/12/2024', sub: 'Thứ bảy', value: formatPrice(18500000), subValue: '142 đơn hàng' },
            { main: '27/12/2024', sub: 'Thứ sáu', value: formatPrice(12100000), subValue: '98 đơn hàng' },
            { main: '26/12/2024', sub: 'Thứ năm', value: formatPrice(10500000), subValue: '85 đơn hàng' },
            { main: '25/12/2024', sub: 'Thứ tư', value: formatPrice(11200000), subValue: '92 đơn hàng' },
        ]
    } else if (selectedReportId.value === 'products') {
        // Top products
        return [
            { main: 'Cà phê sữa đá', sub: 'Cà phê', value: '450 ly', subValue: formatPrice(15200000) },
            { main: 'Bạc xỉu đá', sub: 'Cà phê', value: '320 ly', subValue: formatPrice(10500000) },
            { main: 'Trà đào cam sả', sub: 'Trà', value: '280 ly', subValue: formatPrice(12100000) },
            { main: 'Cà phê đen', sub: 'Cà phê', value: '150 ly', subValue: formatPrice(4500000) },
            { main: 'Trà sữa trân châu', sub: 'Trà sữa', value: '120 ly', subValue: formatPrice(5200000) },
        ]
    } else {
        // Customers
        return [
            { main: 'Nguyễn Văn A', sub: '0901234567', value: formatPrice(5200000), subValue: '12 đơn hàng' },
            { main: 'Trần Thị B', sub: '0909876543', value: formatPrice(4800000), subValue: '10 đơn hàng' },
            { main: 'Lê Văn C', sub: '0912345678', value: formatPrice(3500000), subValue: '8 đơn hàng' },
            { main: 'Phạm Thị D', sub: '0987654321', value: formatPrice(2100000), subValue: '5 đơn hàng' },
        ]
    }
})

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}
</script>
