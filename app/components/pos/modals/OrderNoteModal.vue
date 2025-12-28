<script setup lang="ts">
interface Props {
    show: boolean
    note: string
}

interface Emits {
    (e: 'update:show', value: boolean): void
    (e: 'update:note', value: string): void
    (e: 'save'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function close() {
    emit('update:show', false)
}

function save() {
    emit('save')
    close()
}
</script>

<template>
    <div v-if="show"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 class="font-bold text-lg text-slate-800">Ghi chú đơn hàng</h3>
                <button @click="close"
                    class="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="p-6">
                <textarea :value="note" @input="$emit('update:note', ($event.target as HTMLInputElement).value)"
                    rows="4"
                    class="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all font-medium resize-none"
                    placeholder="Nhập ghi chú cho đơn hàng này..."></textarea>

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
