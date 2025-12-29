<template>
    <div class="h-full flex bg-slate-50">
        <!-- Left Column: Shift List -->
        <PosSidebar class="w-96 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] z-10">
            <template #header>
                <!-- Header Stats (Blue Card - Current Shift) -->
                <div>
                    <div
                        class="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white relative overflow-hidden shadow-md z-10">
                        <!-- BG Pattern -->
                        <div class="absolute right-0 top-0 p-4 opacity-10">
                            <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                            </svg>
                        </div>

                        <div class="relative z-10">
                            <div class="flex items-center justify-between mb-2">
                                <div class="text-indigo-100 text-xs font-bold uppercase tracking-wider opacity-90">Ca
                                    hiện tại</div>
                                <span
                                    class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-400 text-green-900 shadow-sm">ĐANG
                                    MỞ</span>
                            </div>
                            <div class="text-3xl font-bold mb-1 tracking-tight">Ca Sáng</div>
                            <div class="text-indigo-100 text-sm opacity-90 mb-6">Nhân viên: Nguyễn Văn A</div>

                            <div class="grid grid-cols-2 gap-8 border-t border-white/10 pt-4">
                                <div>
                                    <div class="text-indigo-100/70 text-xs mb-1 font-medium">Bắt đầu</div>
                                    <div class="font-bold text-lg text-white">08:00</div>
                                </div>
                                <div class="border-l border-white/10 pl-8">
                                    <div class="text-indigo-100/70 text-xs mb-1 font-medium">Doanh thu</div>
                                    <div class="font-bold text-lg text-emerald-300">3.8M</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Search -->
                    <div class="p-3 bg-white border-b border-slate-200">
                        <SearchInput v-model="searchQuery" :show-date-range="true" v-model:start-date="startDate"
                            v-model:end-date="endDate" @clear-dates="clearDates" placeholder="Tìm ca làm việc..." />
                    </div>
                </div>
            </template>

            <!-- Shift History List -->
            <div
                class="px-4 py-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 sticky top-0 z-10">
                Lịch sử ca làm việc
            </div>

            <PosListItem v-for="shift in shiftHistory" :key="shift.id" :active="selectedShift?.id === shift.id"
                @click="selectShift(shift)">
                <div class="flex flex-col gap-1">
                    <div class="flex items-start justify-between">
                        <div class="font-bold text-slate-800 text-[15px] group-hover:text-blue-700 transition-colors">{{
                            shift.name
                        }}</div>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border shadow-sm"
                            :class="shift.status === 'Đã đóng' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-green-100 text-green-700 border-green-200'">
                            {{ shift.status }}
                        </span>
                    </div>
                    <div class="flex justify-between items-center text-xs text-slate-500">
                        <span>{{ shift.date }} • {{ shift.employee }}</span>
                    </div>
                    <div class="flex justify-between items-center mt-1">
                        <span class="text-xs text-slate-400 bg-slate-100 px-1.5 rounded">{{ shift.orderCount }}
                            đơn</span>
                        <span class="font-bold text-emerald-600 text-sm">{{ formatPrice(shift.revenue) }}</span>
                    </div>
                </div>
            </PosListItem>

            <template #footer>
                <div class="p-4 bg-white grid grid-cols-2 gap-3 border-t border-slate-100">
                    <button
                        class="h-10 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98]">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Báo cáo
                    </button>
                    <button
                        class="h-10 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all font-bold text-sm shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 active:scale-[0.98]">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Đóng ca
                    </button>
                </div>
            </template>
        </PosSidebar>

        <!-- Right Column: Shift Detail -->
        <div class="flex-1 flex flex-col bg-slate-50 min-w-0">
            <div v-if="selectedShift" class="flex-1 overflow-y-auto flex flex-col">
                <!-- Header: Matches OrderLookup layout -->
                <div class="bg-white px-8 py-6 border-b border-slate-200">
                    <div class="flex items-start justify-between mb-8">
                        <div>
                            <div class="flex items-center gap-3 mb-2">
                                <h1 class="text-3xl font-bold text-slate-800 tracking-tight">
                                    {{ selectedShift.name }}
                                </h1>
                                <span
                                    class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm"
                                    :class="selectedShift.status === 'Đã đóng'
                                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                                        : 'bg-green-100 text-green-700 border-green-200'">
                                    {{ selectedShift.status }}
                                </span>
                            </div>
                            <p class="text-slate-500 font-medium">{{ selectedShift.date }}</p>
                        </div>

                        <div class="flex gap-3">
                            <button
                                class="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 text-sm active:scale-[0.98]">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                In báo cáo
                            </button>
                        </div>
                    </div>

                    <!-- Metadata Grid -->
                    <div class="grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
                        <!-- Employee -->
                        <div class="group">
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Nhân viên
                            </div>
                            <div
                                class="font-semibold text-slate-800 text-base group-hover:text-blue-600 transition-colors cursor-pointer">
                                {{ selectedShift.employee }}
                            </div>
                        </div>

                        <!-- Revenue -->
                        <div>
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Doanh thu
                            </div>
                            <div class="font-bold text-xl tracking-tight text-emerald-600">
                                +{{ formatPrice(selectedShift.revenue) }}
                            </div>
                        </div>

                        <!-- Time -->
                        <div>
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Thời gian
                            </div>
                            <div class="font-medium text-slate-800 text-base">{{ selectedShift.startTime }} - {{
                                selectedShift.endTime }}</div>
                        </div>

                        <!-- Order Count -->
                        <div>
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Số đơn hàng
                            </div>
                            <div class="font-medium text-slate-800 text-base">{{ selectedShift.orderCount }} đơn</div>
                        </div>
                    </div>
                </div>

                <!-- Detailed Content: Condensed View & Matches Cashbook -->
                <div class="bg-white pb-6 flex-1">
                    <div
                        class="px-8 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                        <h3 class="font-bold text-slate-700 text-sm uppercase tracking-wider">Tổng kết ca làm việc</h3>
                    </div>

                    <div class="px-8">
                        <!-- Opening Cash -->
                        <div class="py-5 border-b border-slate-50">
                            <div class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5">Tiền đầu ca
                            </div>
                            <div class="text-slate-800 text-base font-bold tracking-tight">
                                {{ formatPrice(2000000) }}
                            </div>
                        </div>

                        <!-- Closing Cash -->
                        <div class="py-5 border-b border-slate-50">
                            <div class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5">Tiền cuối ca
                                (Thực tế)
                            </div>
                            <div class="text-slate-800 text-lg font-bold tracking-tight">
                                {{ formatPrice(2000000 + selectedShift.revenue) }}
                            </div>
                        </div>

                        <!-- Difference -->
                        <div class="py-5">
                            <div class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5">Chênh lệch
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="text-emerald-600 font-bold text-base tracking-tight">
                                    +{{ formatPrice(selectedShift.revenue) }}
                                </div>
                                <span
                                    class="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">KHỚP</span>
                            </div>
                            <div class="text-xs text-slate-400 mt-2 italic">
                                Tổng thu ({{ formatPrice(selectedShift.revenue) }}) - Tổng chi (0 ₫)
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <PosEmptyState v-else message="Chọn ca làm việc để xem chi tiết"
                sub-message="Thông tin doanh thu và tiền mặt" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SearchInput from '~/components/pos/SearchInput.vue'
import PosEmptyState from '~/components/pos/PosEmptyState.vue'

const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')
const selectedShift = ref<any>(null)

function clearDates() {
    startDate.value = ''
    endDate.value = ''
}

const shiftHistory = ref([
    { id: 1, name: 'Ca Tối (27/12)', date: '27/12/2024', startTime: '18:00', endTime: '22:00', employee: 'Trần Thị B', orderCount: 18, revenue: 2850000, status: 'Đã đóng' },
    { id: 2, name: 'Ca Chiều (27/12)', date: '27/12/2024', startTime: '13:00', endTime: '18:00', employee: 'Nguyễn Văn A', orderCount: 32, revenue: 4250000, status: 'Đã đóng' },
    { id: 3, name: 'Ca Sáng (27/12)', date: '27/12/2024', startTime: '08:00', endTime: '13:00', employee: 'Nguyễn Văn A', orderCount: 25, revenue: 3150000, status: 'Đã đóng' },
])

function selectShift(shift: any) {
    selectedShift.value = shift
}

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}
</script>
