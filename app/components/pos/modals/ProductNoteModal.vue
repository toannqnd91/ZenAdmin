<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'

interface CartItem {
    id: number
    name: string
    price: number
    quantity: number
    note?: string
}

interface Props {
    show: boolean
    item: CartItem | null
}

interface Emits {
    (e: 'update:show', value: boolean): void
    (e: 'save', payload: { note: string; price: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tempNote = ref('')
const tempPrice = ref(0)
const noteInput = ref<HTMLTextAreaElement | null>(null)
const priceInput = ref<HTMLInputElement | null>(null)

// Format for display
function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN').format(price)
}

function close() {
    emit('update:show', false)
}

function save() {
    emit('save', { note: tempNote.value, price: Number(tempPrice.value) })
    close()
}

function addQuickNote(note: string) {
    // Append or add note
    if (!tempNote.value) {
        tempNote.value = note
    } else {
        // Check if note already exists to avoid duplication
        const parts = tempNote.value.split(',').map(s => s.trim())
        if (!parts.includes(note)) {
            tempNote.value += `, ${note}`
        }
    }
}

watch(() => props.show, (newVal) => {
    if (newVal && props.item) {
        tempNote.value = props.item.note || ''
        tempPrice.value = props.item.price

        // Auto focus appropriate input if needed, but usually user clicks to open specific action
        // For now, no auto focus override or let's default to note
    }
})
</script>

<template>
    <div v-if="show"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up"
        @click.self="close">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <!-- Header -->
            <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                    <h3 class="font-bold text-lg text-slate-800">Tùy chỉnh sản phẩm</h3>
                    <p class="text-sm text-slate-500 font-medium" v-if="item">{{ item.name }}</p>
                </div>
                <button @click="close"
                    class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="p-6 space-y-6">

                <!-- 1. Price Edit Section -->
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Đơn giá bán</label>
                    <div class="relative">
                        <input ref="priceInput" v-model="tempPrice" type="number"
                            class="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-lg text-slate-800 transition-all"
                            placeholder="0">
                        <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₫</span>
                    </div>
                    <p class="text-xs text-slate-400 mt-1 italic">Sửa giá trực tiếp cho món này trong giỏ hàng</p>
                </div>

                <div class="border-t border-slate-100"></div>

                <!-- 2. Note Section -->
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Ghi chú / Yêu cầu thêm</label>
                    <textarea ref="noteInput" v-model="tempNote" rows="3"
                        class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium resize-none mb-3"
                        placeholder="VD: Không đá, Ít ngọt..."></textarea>

                    <!-- Quick Tags -->
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="tag in ['Ít đường', 'Không đường', 'Ít đá', 'Không đá', 'Mang về', 'Nóng', 'Nhiều sữa']"
                            :key="tag" @click="addQuickNote(tag)"
                            class="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all select-none">
                            {{ tag }}
                        </button>
                        <button @click="tempNote = ''"
                            class="px-3 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100">Xóa
                            note</button>
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="pt-4 flex gap-3 justify-end">
                    <button @click="close"
                        class="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">
                        Hủy
                    </button>
                    <button @click="save"
                        class="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-[0.98]">
                        Xác nhận thay đổi
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
