<script setup lang="ts">
import { ref } from 'vue'

interface Product {
    id: number
    sku: string
    name: string
    price: number
    imageUrl: string
    category: string
}

interface Props {
    products: Product[]
    getPrice?: (product: Product) => number
    showImages?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    products: () => [],
    getPrice: (p: Product) => p.price,
    showImages: true
})

const emit = defineEmits<{
    (e: 'add-to-cart', product: Product): void
}>()

const imageErrors = ref<Record<number, boolean>>({})

function handleImageError(id: number) {
    imageErrors.value[id] = true
}

function getProductColor(id: number) {
    const colors = ['bg-blue-100/50', 'bg-green-100/50', 'bg-purple-100/50', 'bg-amber-100/50', 'bg-red-100/50', 'bg-teal-100/50']
    return colors[id % colors.length]
}

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN').format(price)
}
</script>

<template>
    <div class="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div v-if="products.length > 0"
            class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 pb-20">
            <div v-for="product in products" :key="product.id" @click="$emit('add-to-cart', product)"
                class="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-400 transition-all flex flex-col h-full active:scale-[0.98]">
                <!-- Image -->
                <div v-if="showImages" class="aspect-square relative overflow-hidden transition-colors"
                    :class="imageErrors[product.id] ? getProductColor(product.id) : 'bg-slate-100'">
                    <!-- Real Image -->
                    <img v-if="!imageErrors[product.id] && product.imageUrl" :src="product.imageUrl" :alt="product.name"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy" @error="handleImageError(product.id)">

                    <!-- Fallback Content (Color + Initial/Name) -->
                    <div v-else class="w-full h-full flex items-center justify-center p-4 text-center">
                        <span class="font-bold text-lg leading-tight opacity-90 select-none text-slate-700">
                            {{ product.name }}
                        </span>
                    </div>

                    <!-- Hover Overlay -->
                    <div v-if="!imageErrors[product.id]"
                        class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>

                    <!-- SKU Badge -->
                    <div
                        class="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                        {{ product.sku }}
                    </div>
                </div>

                <!-- Info -->
                <div class="p-3 flex flex-col flex-1">
                    <h3
                        class="font-medium text-slate-700 text-sm line-clamp-2 mb-1 group-hover:text-blue-700 leading-snug">
                        {{ product.name }}
                    </h3>
                    <div class="mt-auto pt-2 flex items-center justify-between">
                        <span class="font-bold text-slate-900">{{ formatPrice(getPrice(product)) }}</span>
                        <button
                            class="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty result -->
        <div v-else class="h-full flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
            <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <p>Không tìm thấy sản phẩm nào</p>
        </div>
    </div>
</template>
