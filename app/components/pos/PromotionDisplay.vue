<template>
    <div class="space-y-2">
        <!-- Applied Promotions - Compact -->
        <div v-if="appliedPromotions.length > 0">
            <!-- Collapsible Header -->
            <button @click="isExpanded = !isExpanded"
                class="w-full flex items-center justify-between p-2 rounded-lg hover:bg-pink-50 transition-colors group">
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    <span class="text-xs font-semibold text-slate-700">{{ appliedPromotions.length }} khuyến mãi</span>
                </div>
                <svg class="w-4 h-4 text-slate-400 transition-transform" :class="{ 'rotate-180': isExpanded }"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <!-- Expanded Content -->
            <div v-show="isExpanded" class="space-y-2 mt-2">
                <div v-for="promo in appliedPromotions" :key="promo.promotionId"
                    class="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-2 relative">
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1.5 mb-1">
                                <svg class="w-3.5 h-3.5 text-pink-500 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7" />
                                </svg>
                                <h5 class="font-semibold text-xs text-slate-800 truncate">{{ promo.promotionName }}</h5>
                            </div>
                            <p class="text-[10px] text-slate-600 leading-tight">{{ promo.description }}</p>

                            <!-- Gift Items - Compact -->
                            <div v-if="promo.giftItems && promo.giftItems.length > 0" class="mt-1.5">
                                <div v-for="gift in promo.giftItems" :key="gift.productId"
                                    class="flex items-center gap-1.5 text-[10px] text-green-600">
                                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                    </svg>
                                    <span class="font-medium">{{ gift.productName }} x{{ gift.quantity }}</span>
                                </div>
                            </div>

                            <!-- Discount Amount - Compact -->
                            <div v-if="promo.discountAmount && promo.discountAmount > 0" class="mt-1">
                                <span class="text-xs font-bold text-pink-600">-{{ formatPrice(promo.discountAmount)
                                }}₫</span>
                            </div>
                        </div>

                        <button @click="$emit('remove-promotion', promo.promotionId)"
                            class="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors flex-shrink-0">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Available Promotions - Very Compact, Collapsed by Default -->
        <div v-if="availablePromotions.length > 0">
            <button @click="isAvailableExpanded = !isAvailableExpanded"
                class="w-full flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 transition-colors">
                <div class="flex items-center gap-2">
                    <svg class="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-[10px] font-medium text-slate-600">{{ availablePromotions.length }} KM sắp
                        đạt</span>
                </div>
                <svg class="w-3.5 h-3.5 text-slate-400 transition-transform"
                    :class="{ 'rotate-180': isAvailableExpanded }" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <div v-show="isAvailableExpanded" class="space-y-1.5 mt-1.5">
                <div v-for="promo in availablePromotions" :key="promo.id"
                    class="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <div class="flex items-start gap-1.5">
                        <svg class="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <div class="flex-1 min-w-0">
                            <h5 class="font-semibold text-xs text-slate-800 truncate">{{ promo.name }}</h5>
                            <p class="text-[10px] text-slate-600 mt-0.5 leading-tight">{{ getPromotionHint(promo) }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AppliedPromotion, Promotion } from '~/utils/promotionEngine'

interface Props {
    appliedPromotions: AppliedPromotion[]
    availablePromotions?: Promotion[]
    cartTotal?: number
}

const props = withDefaults(defineProps<Props>(), {
    availablePromotions: () => [],
    cartTotal: 0
})

const emit = defineEmits(['remove-promotion'])

const isExpanded = ref(true) // Applied promotions expanded by default
const isAvailableExpanded = ref(false) // Available promotions collapsed by default

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN').format(price)
}

function getPromotionHint(promo: Promotion): string {
    switch (promo.type) {
        case 'buy_x_get_y':
            const buyQty = promo.conditions.buyQuantity || 0
            const giftQty = promo.rewards.giftQuantity || 0
            const category = promo.conditions.buyCategories?.[0] || 'sản phẩm'
            return `Mua thêm để đủ ${buyQty} ${category} và nhận ${giftQty} quà tặng`

        case 'total_discount':
            const minAmount = promo.conditions.minTotalAmount || 0
            const remaining = minAmount - props.cartTotal
            if (remaining > 0) {
                return `Mua thêm ${formatPrice(remaining)}₫ để được giảm ${promo.rewards.discountValue}${promo.rewards.discountType === 'percent' ? '%' : '₫'}`
            }
            return `Đơn hàng đủ điều kiện giảm ${promo.rewards.discountValue}${promo.rewards.discountType === 'percent' ? '%' : '₫'}`

        case 'bundle':
            return 'Thêm sản phẩm combo để được giá ưu đãi'

        default:
            return promo.name
    }
}
</script>
