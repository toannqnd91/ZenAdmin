<template>
    <div class="h-full flex bg-slate-50">
        <!-- Left Column: Product List -->
        <div class="w-80 flex flex-col bg-white border-r border-slate-200">
            <!-- Search -->
            <SearchInput v-model="searchQuery" :show-date-range="false" class="border-b border-slate-200"
                placeholder="Tìm sản phẩm theo tên, mã SKU, barcode..." />

            <!-- Inventory List -->
            <div class="flex-1 overflow-y-auto">
                <div v-for="item in filteredInventory" :key="item.id"
                    class="p-4 border-b border-slate-100 cursor-pointer transition-colors"
                    :class="selectedItem?.id === item.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'"
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
                </div>

                <!-- Empty State -->
                <div v-if="filteredInventory.length === 0"
                    class="flex flex-col items-center justify-center py-16 text-slate-400">
                    <svg class="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p class="text-sm font-medium">Không tìm thấy sản phẩm</p>
                </div>
            </div>
        </div>

        <!-- Right Column: Product Detail -->
        <div class="flex-1 flex flex-col">
            <div v-if="selectedItem" class="flex-1 overflow-y-auto p-6">
                <!-- Product Detail Card -->
                <div class="bg-white rounded-lg border border-slate-200 p-6">
                    <div class="flex gap-6 mb-6">
                        <div class="w-32 h-32 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                            <img v-if="selectedItem.imageUrl" :src="selectedItem.imageUrl" :alt="selectedItem.name"
                                class="w-full h-full object-cover" />
                            <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
                                <svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                        <div class="flex-1">
                            <h2 class="text-2xl font-bold text-slate-800 mb-2">{{ selectedItem.name }}</h2>
                            <div class="space-y-2 text-sm">
                                <div class="flex items-center gap-2">
                                    <span class="text-slate-500">Mã SKU:</span>
                                    <span class="font-medium text-slate-800">{{ selectedItem.sku }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-slate-500">Giá bán:</span>
                                    <span class="text-xl font-bold text-blue-600">{{ formatPrice(selectedItem.price)
                                    }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Stock Info -->
                    <div class="bg-slate-50 rounded-lg p-4 mb-4">
                        <h3 class="font-semibold text-slate-800 mb-3">Thông tin tồn kho</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <div class="text-sm text-slate-500 mb-1">Tồn kho hiện tại</div>
                                <div class="text-2xl font-bold" :class="getStockClass(selectedItem.stock)">{{
                                    selectedItem.stock }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-slate-500 mb-1">Trạng thái</div>
                                <span class="inline-block px-3 py-1 rounded-full text-sm font-medium"
                                    :class="getStockBadgeClass(selectedItem.stock)">
                                    {{ getStockStatus(selectedItem.stock) }}
                                </span>
                            </div>
                        </div>
                    </div>


                </div>
            </div>

            <!-- Empty State -->
            <div v-else class="flex-1 flex flex-col items-center justify-center text-slate-400">
                <svg class="w-20 h-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p class="text-lg font-medium">Chọn sản phẩm để xem chi tiết</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SearchInput from '~/components/pos/SearchInput.vue'

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
