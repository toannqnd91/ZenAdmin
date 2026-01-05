<script setup lang="ts">
interface AppliedPromotion {
    promotionId: string
    promotionName: string
    description: string
    type: string
    giftItems?: any[]
    discountAmount?: number
}

interface Voucher {
    code: string
    amount: number
    type: 'percent' | 'amount'
    value?: number
}

interface Props {
    show: boolean
    appliedPromotions: AppliedPromotion[]
    appliedVoucher: Voucher | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'remove-promotion', promotionId: string): void
    (e: 'remove-voucher'): void
}>()

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN').format(price)
}

function getPromotionIcon(type: string) {
    switch (type) {
        case 'buy_x_get_y':
            return '🎁'
        case 'discount_percent':
            return '💯'
        case 'discount_amount':
            return '💰'
        case 'gift':
            return '🎉'
        default:
            return '✨'
    }
}

function getTotalDiscount() {
    let total = 0
    props.appliedPromotions.forEach(promo => {
        if (promo.discountAmount) {
            total += promo.discountAmount
        }
    })
    if (props.appliedVoucher) {
        total += props.appliedVoucher.amount
    }
    return total
}
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="show"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                @click.self="$emit('close')">
                <div
                    class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                    <!-- Header -->
                    <div
                        class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">Khuyến mãi đang áp dụng</h2>
                                <p class="text-sm text-white/80">{{ appliedPromotions.length + (appliedVoucher ? 1 : 0)
                                    }} chương trình</p>
                            </div>
                        </div>
                        <button @click="$emit('close')"
                            class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 overflow-y-auto p-6">
                        <!-- Applied Voucher -->
                        <div v-if="appliedVoucher" class="mb-4">
                            <h3 class="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                                Mã giảm giá
                            </h3>
                            <div
                                class="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 relative overflow-hidden group">
                                <div class="absolute top-0 right-0 w-20 h-20 bg-purple-500 opacity-10 rounded-bl-full">
                                </div>
                                <div class="relative flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                                            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24"
                                                stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p class="font-mono font-bold text-lg text-purple-600">{{
                                                appliedVoucher.code }}</p>
                                            <p class="text-sm text-slate-600">
                                                Giảm {{ appliedVoucher.type === 'percent' ? `${appliedVoucher.value}%` :
                                                    `${formatPrice(appliedVoucher.amount)}₫` }}
                                            </p>
                                        </div>
                                    </div>
                                    <button @click="$emit('remove-voucher')"
                                        class="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-white/50 transition-colors">
                                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Applied Promotions -->
                        <div v-if="appliedPromotions.length > 0">
                            <h3 class="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                </svg>
                                Khuyến mãi tự động
                            </h3>
                            <div class="space-y-3">
                                <div v-for="promo in appliedPromotions" :key="promo.promotionId"
                                    class="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors group">
                                    <div class="flex items-start justify-between gap-3">
                                        <div class="flex items-start gap-3 flex-1">
                                            <div class="text-3xl">{{ getPromotionIcon(promo.type) }}</div>
                                            <div class="flex-1">
                                                <h4 class="font-semibold text-slate-800 mb-1">{{ promo.promotionName }}
                                                </h4>
                                                <p class="text-sm text-slate-600 mb-2">{{ promo.description }}</p>

                                                <!-- Discount Amount -->
                                                <div v-if="promo.discountAmount"
                                                    class="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold">
                                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                                                        stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                            stroke-width="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Giảm {{ formatPrice(promo.discountAmount) }}₫
                                                </div>

                                                <!-- Applied Items (Gift items) -->
                                                <div v-if="promo.giftItems && promo.giftItems.length > 0" class="mt-2">
                                                    <p class="text-xs text-slate-500 mb-1">Quà tặng:</p>
                                                    <div class="flex flex-wrap gap-1">
                                                        <span v-for="(item, idx) in promo.giftItems.slice(0, 3)"
                                                            :key="idx"
                                                            class="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                                                            {{ item.productName }} (x{{ item.quantity }})
                                                        </span>
                                                        <span v-if="promo.giftItems.length > 3"
                                                            class="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                            +{{ promo.giftItems.length - 3 }} sản phẩm
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button @click="$emit('remove-promotion', promo.promotionId)"
                                            class="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors shrink-0">
                                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Empty State -->
                        <div v-if="appliedPromotions.length === 0 && !appliedVoucher" class="text-center py-12">
                            <div
                                class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg class="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                            </div>
                            <p class="text-slate-500 font-medium">Chưa có khuyến mãi nào</p>
                            <p class="text-sm text-slate-400 mt-1">Thêm sản phẩm để nhận ưu đãi</p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="border-t border-slate-200 px-6 py-4 bg-slate-50">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-slate-600">Tổng tiết kiệm</p>
                                <p class="text-2xl font-bold text-green-600">{{ formatPrice(getTotalDiscount()) }}₫</p>
                            </div>
                            <button @click="$emit('close')"
                                class="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
    transition: transform 0.3s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
    transform: scale(0.9);
}
</style>
