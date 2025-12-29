<template>
    <div class="h-full flex bg-slate-50">
        <!-- Left Column: Transactions List -->
        <!-- Left Column: Transactions List -->
        <PosSidebar class="w-96 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] z-10">
            <template #header>
                <!-- Header Stats (Flush) -->
                <div>
                    <!-- Blue Card Flush -->
                    <div
                        class="bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white relative overflow-hidden shadow-md z-10">
                        <div class="absolute right-0 top-0 p-4 opacity-10">
                            <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.15-1.46-3.27-3.4h1.96c.1 1.05 1.06 1.9 2.69 1.9 1.66 0 2.54-.93 2.54-1.84 0-1.42-1.65-1.9-4.26-2.63C8.4 11.23 6.91 9.71 6.94 7.6c.03-1.87 1.4-3.5 3.1-3.87V2H13.4v1.83c1.55.3 2.72 1.34 2.97 3.23h-2c-.17-.9-1.07-1.55-2.22-1.55-1.46 0-2.3.94-2.31 1.62.01 1.15 1.84 1.5 4.09 2.14 2.9.83 4.54 2.12 4.52 4.56-.03 2.15-1.56 3.73-3.34 4.06z" />
                            </svg>
                        </div>
                        <div class="relative z-10">
                            <div class="text-blue-100 text-xs font-bold mb-1 uppercase tracking-wider opacity-90">Tồn
                                quỹ hiện tại
                            </div>
                            <div class="text-4xl font-bold mb-6 tracking-tight">{{ formatPrice(stats.balance) }}</div>
                            <div class="grid grid-cols-2 gap-8 border-t border-white/10 pt-4">
                                <div>
                                    <div class="text-blue-100/70 text-xs mb-1 font-medium">Tổng thu</div>
                                    <div class="font-bold text-xl text-emerald-300">{{ formatPrice(stats.income) }}
                                    </div>
                                </div>
                                <div class="border-l border-white/10 pl-8">
                                    <div class="text-blue-100/70 text-xs mb-1 font-medium">Tổng chi</div>
                                    <div class="font-bold text-xl text-rose-300">{{ formatPrice(stats.expense) }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Search (Flush below stats) -->
                    <div class="p-3 bg-white border-b border-slate-200">
                        <div class="relative">
                            <input type="text" v-model="searchQuery" placeholder="Tìm giao dịch..."
                                class="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all">
                            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Transactions List -->
            <PosListItem v-for="transaction in filteredTransactions" :key="transaction.id"
                :active="selectedTransaction?.id === transaction.id" @click="selectTransaction(transaction)">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                        :class="transaction.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path v-if="transaction.type === 'income'" stroke-linecap="round" stroke-linejoin="round"
                                stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-center mb-0.5">
                            <span class="font-bold text-slate-800 text-[15px] truncate pr-2">{{
                                transaction.category }}</span>
                            <!-- Increased Font Size to text-[15px] and font-bold to match OrderLookup sidebar -->
                            <span class="text-xs font-bold whitespace-nowrap"
                                :class="transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'">
                                {{ transaction.type === 'income' ? '+' : '-' }}{{
                                    formatPrice(transaction.amount) }}
                            </span>
                        </div>
                        <div class="flex justify-between items-center text-xs text-slate-500">
                            <span class="truncate pr-2">{{ transaction.description }}</span>
                            <span class="whitespace-nowrap">{{ formatDateShort(transaction.createdAt) }}</span>
                        </div>
                    </div>
                </div>
            </PosListItem>

            <template #empty>
                <div v-if="filteredTransactions.length === 0"
                    class="flex flex-col items-center justify-center py-10 text-slate-400">
                    <p class="text-sm">Không có giao dịch nào</p>
                </div>
            </template>

            <!-- Add Button Footer -->
            <template #footer>
                <div class="p-4">
                    <button
                        class="w-full h-11 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 active:scale-[0.98]">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Tạo phiếu thu / chi
                    </button>
                </div>
            </template>
        </PosSidebar>

        <!-- Right Column: Transaction Detail -->
        <div class="flex-1 flex flex-col bg-slate-50 min-w-0">
            <div v-if="selectedTransaction" class="flex-1 overflow-y-auto flex flex-col">
                <!-- Header: Matches OrderLookup layout -->
                <div class="bg-white px-8 py-6 border-b border-slate-200">
                    <div class="flex items-start justify-between mb-8">
                        <div>
                            <div class="flex items-center gap-3 mb-2">
                                <h1 class="text-3xl font-bold text-slate-800 tracking-tight font-mono">
                                    {{ selectedTransaction.type === 'income' ? 'RVN' : 'PAY' }}{{
                                        selectedTransaction.id.toString().padStart(5, '0') }}
                                </h1>
                                <span
                                    class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm"
                                    :class="selectedTransaction.type === 'income'
                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                        : 'bg-rose-100 text-rose-700 border-rose-200'">
                                    {{ selectedTransaction.type === 'income' ? 'Phiếu thu' : 'Phiếu chi' }}
                                </span>
                            </div>
                            <p class="text-slate-500 font-medium">{{ selectedTransaction.createdAt }}</p>
                        </div>

                        <div class="flex gap-3">
                            <button
                                class="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 text-sm active:scale-[0.98]">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                In phiếu
                            </button>
                        </div>
                    </div>

                    <!-- Metadata Grid: Matches OrderLookup layout exactly -->
                    <div class="grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
                        <!-- Subject -->
                        <div class="group">
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {{ selectedTransaction.type === 'income' ? 'Khách hàng' : 'Người nhận' }}
                            </div>
                            <div
                                class="font-semibold text-slate-800 text-base group-hover:text-blue-600 transition-colors cursor-pointer">
                                {{ selectedTransaction.type === 'income' ? 'Khách lẻ' : 'Người nhận' }}
                            </div>
                        </div>

                        <!-- Amount -->
                        <div>
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Giá trị
                            </div>
                            <div class="font-bold text-xl tracking-tight"
                                :class="selectedTransaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'">
                                {{ selectedTransaction.type === 'income' ? '+' : '-' }}{{
                                    formatPrice(selectedTransaction.amount) }}
                            </div>
                        </div>

                        <!-- Branch -->
                        <div>
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Chi nhánh
                            </div>
                            <div class="font-medium text-slate-800 text-base">Cửa hàng chính</div>
                        </div>

                        <!-- Payment Method -->
                        <div>
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Thanh toán
                            </div>
                            <div class="font-medium text-slate-800 text-base">{{ selectedTransaction.paymentMethod ||
                                'Tiền mặt'
                            }}</div>
                        </div>
                    </div>
                </div>

                <!-- Detailed Content: Condensed View & Matched Font Sizes -->
                <div class="bg-white pb-6 flex-1">
                    <div
                        class="px-8 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                        <!-- Update: text-xs -> text-sm similar to OrderLookup -->
                        <h3 class="font-bold text-slate-700 text-sm uppercase tracking-wider">Thông tin chi tiết</h3>
                    </div>

                    <div class="px-8">
                        <!-- Description -->
                        <div class="py-5 border-b border-slate-50">
                            <!-- Update: text-[11px] -> text-xs -->
                            <div class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5">Diễn giải
                                <span class="text-red-500">*</span>
                            </div>
                            <div class="text-slate-800 text-base leading-relaxed font-medium">
                                {{ selectedTransaction.note || selectedTransaction.description }}
                            </div>
                        </div>

                        <!-- Reference Case -->
                        <div class="py-5 border-b border-slate-50">
                            <div class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5">Tham chiếu
                            </div>
                            <div class="text-slate-500 italic text-sm">Không có mã tham chiếu</div>
                        </div>

                        <!-- Proof Images -->
                        <div class="py-5 border-b border-slate-50">
                            <div class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">Ảnh chứng từ
                            </div>
                            <div
                                class="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group bg-slate-50/30">
                                <div
                                    class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span class="text-xs font-bold text-slate-700 group-hover:text-blue-700 mb-0.5">Tải ảnh
                                    lên</span>
                                <span class="text-[10px] text-slate-400">PNG, JPG tối đa 2MB</span>
                            </div>
                        </div>

                        <!-- Original Docs Link -->
                        <div class="py-5">
                            <div class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">Chứng từ gốc
                            </div>
                            <div
                                class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group max-w-sm">
                                <div
                                    class="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    #</div>
                                <div class="flex-1">
                                    <div class="text-blue-600 font-bold text-sm group-hover:underline">TRX{{
                                        selectedTransaction.id }}</div>
                                    <div class="text-[11px] text-slate-500">Đơn hàng bán</div>
                                </div>
                                <div class="font-mono font-bold text-slate-700 text-sm">{{
                                    formatPrice(selectedTransaction.amount) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State (Clean & Synchronized) -->
            <PosEmptyState v-else message="Chọn giao dịch để xem chi tiết" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const searchQuery = ref('')
const activeTab = ref('all') // all, income, expense
const selectedTransaction = ref<any>(null)

const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'income', label: 'Khoản Thu' },
    { id: 'expense', label: 'Khoản Chi' }
]

const stats = ref({
    income: 5280000,
    expense: 1450000,
    balance: 3830000,
})

const transactions = ref([
    { id: 1, type: 'income', description: 'Doanh thu bán hàng', amount: 850000, category: 'Bán hàng', createdAt: '28/12/2024 15:30', note: 'Đơn #DH001, #DH002', paymentMethod: 'Tiền mặt', creator: 'Phạm Văn Toàn' },
    { id: 2, type: 'expense', description: 'Nhập nguyên liệu cà phê', amount: 450000, category: 'Nhập hàng', createdAt: '28/12/2024 10:00', note: 'NCC: Công ty Cà Phê Sạch. Đã thanh toán đủ.', paymentMethod: 'Chuyển khoản', creator: 'Nguyễn Văn A' },
    { id: 3, type: 'income', description: 'Bán hàng mang về', amount: 620000, category: 'Bán hàng', createdAt: '27/12/2024 18:45', note: null, paymentMethod: 'Tiền mặt', creator: 'Trần Thị B' },
    { id: 4, type: 'expense', description: 'Tiền điện tháng 12', amount: 1000000, category: 'Chi phí', createdAt: '25/12/2024 09:00', note: 'Thanh toán tiền điện cửa hàng', paymentMethod: 'Chuyển khoản', creator: 'Admin' },
])

const filteredTransactions = computed(() => {
    let result = transactions.value

    // Filter by Tab
    if (activeTab.value !== 'all') {
        result = result.filter(t => t.type === activeTab.value)
    }

    // Filter by Search
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(t =>
            t.description.toLowerCase().includes(query) ||
            t.category.toLowerCase().includes(query)
        )
    }

    return result
})

function selectTransaction(transaction: any) {
    selectedTransaction.value = transaction
}

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

function formatDateShort(dateString: string) {
    return dateString.split(' ')[1] // 15:30
}

function getTransactionDateLabel(type: string) {
    return type === 'income' ? 'Ngày nhận tiền' : 'Ngày chi tiền'
}
</script>
