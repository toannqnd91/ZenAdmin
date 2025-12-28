<template>
    <div class="h-full flex bg-slate-50">
        <!-- Left Column: Transactions List -->
        <div class="w-80 flex flex-col bg-white border-r border-slate-200">
            <!-- Search & Date Range -->
            <SearchInput v-model="searchQuery" :show-date-range="true" v-model:start-date="startDate"
                v-model:end-date="endDate" @clear-dates="clearDates" placeholder="Tìm giao dịch..." />

            <!-- Header Stats -->
            <div class="border-b border-slate-200 p-4">
                <div class="grid grid-cols-3 gap-2">
                    <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-2 border border-green-200">
                        <div class="text-[10px] text-green-600 font-medium mb-0.5">Thu</div>
                        <div class="text-sm font-bold text-green-700">{{ formatPrice(stats.income) }}</div>
                    </div>
                    <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-2 border border-red-200">
                        <div class="text-[10px] text-red-600 font-medium mb-0.5">Chi</div>
                        <div class="text-sm font-bold text-red-700">{{ formatPrice(stats.expense) }}</div>
                    </div>
                    <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 border border-blue-200">
                        <div class="text-[10px] text-blue-600 font-medium mb-0.5">Tồn quỹ</div>
                        <div class="text-sm font-bold text-blue-700">{{ formatPrice(stats.balance) }}</div>
                    </div>
                </div>
            </div>

            <!-- Transactions List -->
            <div class="flex-1 overflow-y-auto">
                <div v-for="transaction in transactions" :key="transaction.id"
                    class="p-4 border-b border-slate-100 cursor-pointer transition-colors"
                    :class="selectedTransaction?.id === transaction.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'"
                    @click="selectTransaction(transaction)">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            :class="transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path v-if="transaction.type === 'income'" stroke-linecap="round"
                                    stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M20 12H4" />
                            </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-slate-800 text-sm truncate">{{ transaction.description }}</div>
                            <div class="text-xs text-slate-500 mt-0.5">{{ transaction.createdAt }}</div>
                            <div class="flex items-center justify-between mt-1">
                                <span class="text-xs text-slate-500">{{ transaction.category }}</span>
                                <span class="font-semibold text-sm"
                                    :class="transaction.type === 'income' ? 'text-green-600' : 'text-red-600'">
                                    {{ transaction.type === 'income' ? '+' : '-' }}{{ formatPrice(transaction.amount) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add Transaction Button -->
            <div class="p-4 bg-white border-t border-slate-200">
                <button
                    class="w-full h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                    + Thêm giao dịch
                </button>
            </div>
        </div>

        <!-- Right Column: Transaction Detail -->
        <div class="flex-1 flex flex-col">
            <div v-if="selectedTransaction" class="flex-1 overflow-y-auto p-6">
                <!-- Transaction Detail Card -->
                <div class="bg-white rounded-lg border border-slate-200 p-6">
                    <div class="flex items-start justify-between mb-6">
                        <div>
                            <h2 class="text-2xl font-bold text-slate-800">{{ selectedTransaction.description }}</h2>
                            <p class="text-sm text-slate-500 mt-1">{{ selectedTransaction.createdAt }}</p>
                        </div>
                        <div class="w-12 h-12 rounded-lg flex items-center justify-center"
                            :class="selectedTransaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path v-if="selectedTransaction.type === 'income'" stroke-linecap="round"
                                    stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M20 12H4" />
                            </svg>
                        </div>
                    </div>

                    <!-- Amount -->
                    <div class="bg-slate-50 rounded-lg p-4 mb-6">
                        <div class="text-sm text-slate-500 mb-1">Số tiền</div>
                        <div class="text-3xl font-bold"
                            :class="selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'">
                            {{ selectedTransaction.type === 'income' ? '+' : '-' }}{{
                                formatPrice(selectedTransaction.amount) }}
                        </div>
                    </div>

                    <!-- Details -->
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between py-2 border-b border-slate-100">
                            <span class="text-slate-600">Loại giao dịch</span>
                            <span class="font-medium text-slate-800">{{ selectedTransaction.type === 'income' ? 'Thu' :
                                'Chi' }}</span>
                        </div>
                        <div class="flex justify-between py-2 border-b border-slate-100">
                            <span class="text-slate-600">Danh mục</span>
                            <span class="font-medium text-slate-800">{{ selectedTransaction.category }}</span>
                        </div>
                        <div class="flex justify-between py-2 border-b border-slate-100">
                            <span class="text-slate-600">Thời gian</span>
                            <span class="font-medium text-slate-800">{{ selectedTransaction.createdAt }}</span>
                        </div>
                        <div v-if="selectedTransaction.note" class="py-2">
                            <div class="text-slate-600 mb-1">Ghi chú</div>
                            <div class="font-medium text-slate-800">{{ selectedTransaction.note }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else class="flex-1 flex flex-col items-center justify-center text-slate-400">
                <svg class="w-20 h-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-lg font-medium">Chọn giao dịch để xem chi tiết</p>
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
const selectedTransaction = ref<any>(null)

function clearDates() {
    startDate.value = ''
    endDate.value = ''
}

const stats = ref({
    income: 5280000,
    expense: 1450000,
    balance: 3830000,
})

const transactions = ref([
    { id: 1, type: 'income', description: 'Doanh thu bán hàng', amount: 850000, category: 'Bán hàng', createdAt: '28/12/2024 15:30', note: 'Đơn #DH001, #DH002' },
    { id: 2, type: 'expense', description: 'Nhập nguyên liệu', amount: 450000, category: 'Nhập hàng', createdAt: '28/12/2024 10:00', note: 'NCC: Công ty ABC' },
    { id: 3, type: 'income', description: 'Doanh thu bán hàng', amount: 620000, category: 'Bán hàng', createdAt: '27/12/2024 18:45', note: null },
])

function selectTransaction(transaction: any) {
    selectedTransaction.value = transaction
}

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}
</script>
