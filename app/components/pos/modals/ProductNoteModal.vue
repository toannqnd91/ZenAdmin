<script setup lang="ts">
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
    (e: 'save', note: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tempNote = ref('')

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN').format(price)
}

function close() {
    emit('update:show', false)
}

function save() {
    emit('save', tempNote.value)
    close()
}

function addQuickNote(note: string) {
    tempNote.value = tempNote.value ? tempNote.value + ', ' + note : note
}

watch(() => props.show, (newVal) => {
    if (newVal && props.item) {
        tempNote.value = props.item.note || ''
    }
})
</script>

<template>
    <div v-if="show"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 class="font-bold text-lg text-slate-800">Ghi chú sản phẩm</h3>
                <button @click="close"
                    class="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="p-6">
                <div v-if="item" class="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div class="font-medium text-slate-800">{{ item.name }}</div>
                    <div class="text-sm text-slate-500">{{ formatPrice(item.price) }} ₫ × {{ item.quantity }}</div>
                </div>

                <textarea v-model="tempNote" rows="4"
                    class="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all font-medium resize-none"
                    placeholder="Ví dụ: Ít đường, nhiều đá, không hành..."></textarea>

                <!-- Quick note suggestions -->
                <div class="mt-3 flex flex-wrap gap-2">
                    <button v-for="note in ['Ít đường', 'Nhiều đá', 'Không đá', 'Nóng', 'Ít ngọt']" :key="note"
                        type="button" @click="addQuickNote(note)"
                        class="px-3 py-1 text-xs rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                        {{ note }}
                    </button>
                </div>

                <div class="mt-6 flex gap-3 justify-end">
                    <button @click="close"
                        class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                        Hủy bỏ
                    </button>
                    <button @click="save"
                        class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                        Lưu ghi chú
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
