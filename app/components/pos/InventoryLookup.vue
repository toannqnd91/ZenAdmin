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
                    <div
                        class="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name"
                            class="w-full h-full object-cover" />
                        <svg v-else class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
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
            <div v-if="selectedItem" class="flex-1 overflow-y-auto flex flex-col">
                <!-- Product Header -->
                <div class="bg-white px-8 py-6 border-b border-slate-200">
                    <div class="flex items-start justify-between mb-8">
                        <div>
                            <div class="flex items-center gap-3 mb-2">
                                <h2 class="text-3xl font-bold text-slate-800 tracking-tight">{{ selectedItem.name }}
                                </h2>
                                <span
                                    class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm"
                                    :class="getStockBadgeClass(selectedItem.stock)">
                                    {{ getStockStatus(selectedItem.stock) }}
                                </span>
                            </div>
                            <p class="text-slate-500 font-medium">SKU: {{ selectedItem.sku }}</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
                        <div>
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Giá bán
                            </div>
                            <div class="font-semibold text-slate-800 text-base">{{ formatPrice(selectedItem.price) }}
                            </div>
                        </div>
                        <div>
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Tồn kho
                            </div>
                            <div class="font-semibold text-base" :class="getStockClass(selectedItem.stock)">{{
                                selectedItem.stock }} sản phẩm</div>
                        </div>
                        <div>
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                Danh mục
                            </div>
                            <div class="font-medium text-slate-800 text-base">{{ selectedItem.category || '-' }}</div>
                        </div>
                        <div>
                            <div
                                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Barcode
                            </div>
                            <div class="font-medium text-slate-800 text-base font-mono">{{ selectedItem.barcode || '-'
                            }}</div>
                        </div>
                    </div>
                </div>

                <!-- Stock Stats Section -->
                <div class="bg-white pb-6 flex-1">
                    <div
                        class="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                        <h3 class="font-bold text-slate-700 text-sm uppercase tracking-wider">Thông tin kho hàng</h3>
                    </div>
                    <div class="px-8 py-6">
                        <div class="grid grid-cols-3 gap-4">
                            <!-- Current Stock -->
                            <div
                                class="bg-white p-5 rounded-xl border-2 border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all group">
                                <div class="flex items-start justify-between mb-3">
                                    <div class="text-xs font-bold text-blue-700 uppercase tracking-wide">Tồn kho khả
                                        dụng</div>
                                    <div
                                        class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                </div>
                                <div class="text-5xl font-bold tracking-tight mb-2"
                                    :class="getStockClass(selectedItem.stock)">
                                    {{ selectedItem.stock }}</div>
                                <div class="text-xs text-slate-500 font-medium">Đơn vị: Sản phẩm</div>
                            </div>

                            <!-- In Transaction -->
                            <div
                                class="bg-white p-5 rounded-xl border-2 border-gray-200 hover:border-amber-300 hover:shadow-lg transition-all group">
                                <div class="flex items-start justify-between mb-3">
                                    <div class="text-xs font-bold text-gray-700 uppercase tracking-wide">Đang giao dịch
                                    </div>
                                    <div
                                        class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                                        <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div
                                    class="text-5xl font-bold text-gray-800 tracking-tight group-hover:text-amber-600 transition-colors mb-2">
                                    0</div>
                                <div class="text-xs text-slate-500 font-medium">Tạm giữ trong đơn hàng</div>
                            </div>

                            <!-- Incoming Stock -->
                            <div
                                class="bg-white p-5 rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all group">
                                <div class="flex items-start justify-between mb-3">
                                    <div class="text-xs font-bold text-gray-700 uppercase tracking-wide">Đang về hàng
                                    </div>
                                    <div
                                        class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                        <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <div
                                    class="text-5xl font-bold text-gray-800 tracking-tight group-hover:text-emerald-600 transition-colors mb-2">
                                    0</div>
                                <div class="text-xs text-slate-500 font-medium">Từ nhà cung cấp</div>
                            </div>
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

// Mock data
const inventory = ref([
    { id: 1, name: 'Sản phẩm A', sku: 'SKU001', barcode: '1234567890', stock: 45, price: 150000, category: 'Điện tử', imageUrl: '' },
    { id: 2, name: 'Sản phẩm B', sku: 'SKU002', barcode: '0987654321', stock: 12, price: 250000, category: 'Thời trang', imageUrl: '' },
    { id: 3, name: 'Sản phẩm C', sku: 'SKU003', barcode: '1122334455', stock: 0, price: 350000, category: 'Gia dụng', imageUrl: '' },
])

const filteredInventory = computed(() => {
    if (!searchQuery.value) return inventory.value
    const query = searchQuery.value.toLowerCase()
    return inventory.value.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.barcode.includes(query)
    )
})

const selectItem = (item: any) => {
    selectedItem.value = item
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

const getStockClass = (stock: number) => {
    if (stock === 0) return 'text-red-600'
    if (stock < 20) return 'text-orange-600'
    return 'text-emerald-600'
}

const getStockBadgeClass = (stock: number) => {
    if (stock === 0) return 'bg-red-100 text-red-700 border-red-200'
    if (stock < 20) return 'bg-orange-100 text-orange-700 border-orange-200'
    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
}

const getStockStatus = (stock: number) => {
    if (stock === 0) return 'Hết hàng'
    if (stock < 20) return 'Sắp hết'
    return 'Còn hàng'
}
</script>
