<template>
    <div class="h-full flex bg-slate-50">
        <!-- Left Column: Product List -->
        <PosSidebar class="w-80">
            <template #header>
                <!-- Search -->
                <PosInput v-model="searchQuery" :show-date-range="false" class="border-b border-slate-200"
                    placeholder="Tìm sản phẩm theo tên, mã SKU, barcode..." icon="search" size="sm" />
            </template>

            <!-- Inventory List -->
            <PosListItem v-for="item in filteredInventory" :key="item.id" :active="selectedItem?.id === item.id"
                @click="selectItem(item)">
                <div class="flex gap-3">
                    <div class="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                        <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name"
                            class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-slate-800 truncate">{{ item.name }}</div>
                        <div class="text-xs text-slate-500 mt-0.5">SKU: {{ item.sku }}</div>
                        <div class="flex items-center justify-between mt-1">
                            <span class="text-xs font-semibold" :class="getStockClass(item.stock)">{{ item.stock }}
                                sp</span>
                            <span class="text-sm font-semibold text-slate-700">{{ formatPrice(item.price) }}</span>
                        </div>
                    </div>
                </div>
            </PosListItem>

            <template #empty>
                <div v-if="filteredInventory.length === 0" class="text-center p-4">
                    <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p class="text-sm font-medium text-slate-400">Không tìm thấy sản phẩm</p>
                </div>
            </template>
        </PosSidebar>

        <!-- Right Column: Product Detail -->
        <div class="flex-1 flex flex-col bg-slate-50 min-w-0">
            <div v-if="selectedItem" class="flex-1 overflow-y-auto">
                <!-- Product Header -->
                <div class="bg-white px-8 py-8 border-b border-slate-200">
                    <div class="flex gap-8">
                        <!-- Large Image -->
                        <div
                            class="w-40 h-40 rounded-2xl bg-slate-50 flex-shrink-0 overflow-hidden border border-slate-100 shadow-sm relative group">
                            <img v-if="selectedItem.imageUrl" :src="selectedItem.imageUrl" :alt="selectedItem.name"
                                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                                <svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>

                        <!-- Info -->
                        <div class="flex-1 min-w-0 pt-2">
                            <div class="flex items-start justify-between mb-2">
                                <h2 class="text-3xl font-bold text-slate-900 leading-tight tracking-tight">{{
                                    selectedItem.name }}</h2>
                                <div class="px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide border shadow-sm"
                                    :class="getStockBadgeClass(selectedItem.stock)">
                                    {{ getStockStatus(selectedItem.stock) }}
                                </div>
                            </div>

                            <div class="flex items-center gap-3 mb-6">
                                <span
                                    class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-mono text-sm font-semibold border border-slate-200">
                                    SKU: {{ selectedItem.sku }}
                                </span>
                            </div>

                            <div class="flex items-baseline gap-2">
                                <span class="text-3xl font-bold text-blue-600 tracking-tight">{{
                                    formatPrice(selectedItem.price) }}</span>
                                <span class="text-slate-400 font-medium">/ sản phẩm</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stock & Stats -->
                <div class="p-8">
                    <h3 class="font-bold text-slate-800 mb-5 text-sm uppercase tracking-wider flex items-center gap-2">
                        <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Thông tin kho hàng
                    </h3>

                    <div class="grid grid-cols-3 gap-6">
                        <!-- Current Stock -->
                        <div
                            class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                            <div class="absolute right-0 top-0 p-4 opacity-5">
                                <svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                                    <path
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div class="relative">
                                <div class="text-sm font-medium text-slate-500 mb-1">Tồn kho khả dụng</div>
                                <div class="text-3xl font-bold tracking-tight"
                                    :class="getStockClass(selectedItem.stock)">{{
                                        selectedItem.stock }}</div>
                                <div class="mt-2 text-xs text-slate-400">Đơn vị: Sản phẩm</div>
                            </div>
                        </div>

                        <!-- Placeholder Stats (Mockup for professional feel) -->
                        <div
                            class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group">
                            <div class="text-sm font-medium text-slate-500 mb-1">Đang giao dịch</div>
                            <div
                                class="text-3xl font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
                                0</div>
                            <div class="mt-2 text-xs text-slate-400">Tạm giữ trong đơn hàng</div>
                        </div>

                        <div
                            class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group">
                            <div class="text-sm font-medium text-slate-500 mb-1">Đang về hàng</div>
                            <div
                                class="text-3xl font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
                                0</div>
                            <div class="mt-2 text-xs text-slate-400">Từ nhà cung cấp</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <PosEmptyState v-else message="Chọn sản phẩm để xem tồn kho"
                sub-message="Chi tiết số lượng và trạng thái xử lý" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PosInput from '~/components/pos/PosInput.vue'

const searchQuery = ref('')
const selectedItem = ref<any>(null)

// Mock inventory data
const inventory = ref([
    { id: 1, sku: 'CF001', name: 'Cà phê đen đá', stock: 45, price: 25000, imageUrl: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=400&q=80' },
    { id: 2, sku: 'CF002', name: 'Cà phê sữa đá', stock: 12, price: 29000, imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80' },
    { id: 3, sku: 'CF003', name: 'Bạc xỉu', stock: 3, price: 32000, imageUrl: 'https://images.unsplash.com/photo-1585849834997-6a1b2d77d13e?w=400&q=80' },
    { id: 4, sku: 'TS001', name: 'Trà sữa trân châu', stock: 0, price: 35000, imageUrl: null },
])

const filteredInventory = computed(() => {
    if (!searchQuery.value) return inventory.value
    const query = searchQuery.value.toLowerCase()
    return inventory.value.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query)
    )
})

function selectItem(item: any) {
    selectedItem.value = item
}

function getStockClass(stock: number) {
    if (stock === 0) return 'text-red-600'
    if (stock < 10) return 'text-yellow-600'
    return 'text-green-600'
}

function getStockBadgeClass(stock: number) {
    if (stock === 0) return 'bg-red-100 text-red-700'
    if (stock < 10) return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
}

function getStockStatus(stock: number) {
    if (stock === 0) return 'Hết hàng'
    if (stock < 10) return 'Sắp hết'
    return 'Còn hàng'
}

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}
</script>
