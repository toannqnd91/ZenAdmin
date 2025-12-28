<script setup lang="ts">
import { ref, computed } from 'vue'

interface Product {
    id: number
    name: string
    price: number
    imageUrl?: string
    category?: string
    sku?: string
    barcode?: string
}

interface Props {
    show: boolean
    products: Product[]
    categories: string[]
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'add-to-cart'])

const selectedCategory = ref('Tất cả')
const searchQuery = ref('')
const imageErrors = ref<Record<number, boolean>>({})

const filteredProducts = computed(() => {
    let result = props.products

    if (selectedCategory.value !== 'Tất cả') {
        result = result.filter(p => p.category === selectedCategory.value)
    }

    if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase()
        result = result.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q) ||
            p.barcode?.includes(q)
        )
    }

    return result
})

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN').format(price)
}

function handleImageError(id: number) {
    imageErrors.value[id] = true
}

function getProductColor(id: number) {
    const colors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-amber-100', 'bg-red-100', 'bg-teal-100']
    return colors[id % colors.length]
}
</script>

<template>
    <div v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
        @click.self="$emit('close')">
        <div
            class="bg-white rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">

            <!-- Header -->
            <div class="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                <div class="flex items-center gap-4 flex-1">
                    <h2 class="text-xl font-bold text-slate-800 shrink-0">Chọn sản phẩm đổi</h2>
                    <!-- Search -->
                    <div class="relative max-w-md w-full">
                        <input v-model="searchQuery" type="text" placeholder="Tìm kiếm sản phẩm..."
                            class="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-0 transition-all">
                        <svg class="w-5 h-5 text-slate-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <button @click="$emit('close')"
                    class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Categories -->
            <div
                class="h-14 border-b border-slate-200 bg-white flex items-center gap-3 px-4 shrink-0 overflow-x-auto no-scrollbar">
                <button v-for="cat in categories" :key="cat" @click="selectedCategory = cat"
                    class="px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border"
                    :class="selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'">
                    {{ cat }}
                </button>
            </div>

            <!-- Grid -->
            <div class="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                <div v-if="filteredProducts.length > 0"
                    class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    <div v-for="product in filteredProducts" :key="product.id" @click="$emit('add-to-cart', product)"
                        class="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-400 hover:ring-1 hover:ring-blue-400 transition-all flex flex-col relative h-full">

                        <!-- Image -->
                        <div class="aspect-square relative overflow-hidden bg-slate-100">
                            <img v-if="!imageErrors[product.id] && product.imageUrl" :src="product.imageUrl"
                                :alt="product.name"
                                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                loading="lazy" @error="handleImageError(product.id)">
                            <div v-else
                                class="w-full h-full flex items-center justify-center text-slate-400 font-bold text-2xl"
                                :class="getProductColor(product.id)">
                                {{ product.name.charAt(0) }}
                            </div>

                            <!-- Add Overlay -->
                            <div
                                class="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div
                                    class="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                    + Thêm
                                </div>
                            </div>
                        </div>

                        <!-- Info -->
                        <div class="p-3 flex flex-col flex-1">
                            <h3
                                class="font-medium text-slate-700 text-sm line-clamp-2 mb-1 group-hover:text-blue-700 leading-snug">
                                {{ product.name }}</h3>
                            <div class="mt-auto pt-2 flex items-center justify-between">
                                <span class="font-bold text-slate-900">{{ formatPrice(product.price) }}</span>
                                <span class="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{{
                                    product.sku }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="h-full flex flex-col items-center justify-center text-slate-400">
                    <p>Không tìm thấy sản phẩm</p>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}
</style>
