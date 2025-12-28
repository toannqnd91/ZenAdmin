<template>
    <div class="h-full flex bg-slate-50">
        <!-- Left Column: Shift List -->
        <div class="w-80 flex flex-col bg-white border-r border-slate-200">
            <!-- Search & Date Range -->
            <SearchInput v-model="searchQuery" :show-date-range="true" v-model:start-date="startDate"
                v-model:end-date="endDate" @clear-dates="clearDates" placeholder="Tìm ca làm việc..." />

            <!-- Current Shift Info -->
            <div class="border-b border-slate-200 p-4">
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                    <div class="flex items-center justify-between mb-2">
                        <div class="text-xs text-blue-600 font-medium">Ca hiện tại</div>
                        <div class="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">Đang
                            mở</div>
                    </div>
                    <div class="text-lg font-bold text-blue-900">Ca sáng</div>
                    <div class="text-xs text-slate-600 mt-1">08:00 - Nguyễn Văn A</div>
                </div>
            </div>

            <!-- Shift Stats -->
            <div class="border-b border-slate-200 p-4">
                <div class="grid grid-cols-2 gap-2">
                    <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
                        <div class="text-[10px] text-slate-600 mb-0.5">Số đơn</div>
                        <div class="text-lg font-bold text-slate-800">24</div>
                    </div>
                    <div class="bg-green-50 rounded-lg p-2 border border-green-200">
                        <div class="text-[10px] text-green-600 mb-0.5">Doanh thu</div>
                        <div class="text-sm font-bold text-green-700">3.8M</div>
                    </div>
                </div>
            </div>

            <!-- Shift History -->
            <div class="flex-1 overflow-y-auto">
                <div class="p-3 text-xs font-medium text-slate-600 bg-slate-50">Lịch sử ca làm việc</div>
                <div v-for="shift in shiftHistory" :key="shift.id"
                    class="p-4 border-b border-slate-100 cursor-pointer transition-colors"
                    :class="selectedShift?.id === shift.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'"
                    @click="selectShift(shift)">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <div class="font-medium text-slate-800">{{ shift.name }}</div>
                            <div class="text-xs text-slate-500 mt-0.5">{{ shift.date }}</div>
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                            {{ shift.status }}
                        </span>
                    </div>
                    <div class="flex items-center justify-between text-xs">
                        <span class="text-slate-500">{{ shift.employee }}</span>
                        <span class="font-semibold text-green-600">{{ formatPrice(shift.revenue) }}</span>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="p-4 bg-white border-t border-slate-200 space-y-2">
                <button
                    class="w-full h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm">
                    Đóng ca
                </button>
                <button
                    class="w-full h-10 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm">
                    Xem báo cáo ca
                </button>
            </div>
        </div>

        <!-- Right Column: Shift Detail -->
        <div class="flex-1 flex flex-col">
            <div v-if="selectedShift" class="flex-1 overflow-y-auto p-6">
                <!-- Shift Detail Card -->
                <div class="bg-white rounded-lg border border-slate-200 p-6">
                    <div class="flex items-start justify-between mb-6">
                        <div>
                            <h2 class="text-2xl font-bold text-slate-800">{{ selectedShift.name }}</h2>
                            <p class="text-sm text-slate-500 mt-1">{{ selectedShift.date }}</p>
                        </div>
                        <span class="px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                            {{ selectedShift.status }}
                        </span>
                    </div>

                    <!-- Shift Info -->
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-slate-50 rounded-lg p-4">
                            <div class="text-sm text-slate-500 mb-1">Thời gian</div>
                            <div class="font-semibold text-slate-800">{{ selectedShift.startTime }} - {{
                                selectedShift.endTime }}</div>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-4">
                            <div class="text-sm text-slate-500 mb-1">Nhân viên</div>
                            <div class="font-semibold text-slate-800">{{ selectedShift.employee }}</div>
                        </div>
                    </div>

                    <!-- Stats -->
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div class="text-sm text-blue-600 mb-1">Số đơn hàng</div>
                            <div class="text-3xl font-bold text-blue-900">{{ selectedShift.orderCount }}</div>
                        </div>
                        <div class="bg-green-50 rounded-lg p-4 border border-green-200">
                            <div class="text-sm text-green-600 mb-1">Doanh thu</div>
                            <div class="text-3xl font-bold text-green-900">{{ formatPrice(selectedShift.revenue) }}
                            </div>
                        </div>
                    </div>

                    <!-- Additional Details -->
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between py-2 border-b border-slate-100">
                            <span class="text-slate-600">Tiền đầu ca</span>
                            <span class="font-medium text-slate-800">{{ formatPrice(2000000) }}</span>
                        </div>
                        <div class="flex justify-between py-2 border-b border-slate-100">
                            <span class="text-slate-600">Tiền cuối ca</span>
                            <span class="font-medium text-slate-800">{{ formatPrice(2000000 + selectedShift.revenue)
                                }}</span>
                        </div>
                        <div class="flex justify-between py-2">
                            <span class="text-slate-600">Chênh lệch</span>
                            <span class="font-semibold text-green-600">{{ formatPrice(selectedShift.revenue) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else class="flex-1 flex flex-col items-center justify-center text-slate-400">
                <svg class="w-20 h-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-lg font-medium">Chọn ca để xem chi tiết</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SearchInput from '~/components/pos/SearchInput.vue'

const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')
const selectedShift = ref<any>(null)

function clearDates() {
    startDate.value = ''
    endDate.value = ''
}

const shiftHistory = ref([
    { id: 1, name: 'Ca tối', date: '27/12/2024', startTime: '18:00', endTime: '22:00', employee: 'Trần Thị B', orderCount: 18, revenue: 2850000, status: 'Đã đóng' },
    { id: 2, name: 'Ca chiều', date: '27/12/2024', startTime: '13:00', endTime: '18:00', employee: 'Nguyễn Văn A', orderCount: 32, revenue: 4250000, status: 'Đã đóng' },
])

function selectShift(shift: any) {
    selectedShift.value = shift
}

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}
</script>
