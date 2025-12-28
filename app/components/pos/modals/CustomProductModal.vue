<script setup lang="ts">
interface ProductForm {
    name: string
    price: number
}

interface Props {
    show: boolean
    form: ProductForm
}

interface Emits {
    (e: 'update:show', value: boolean): void
    (e: 'update:form', value: ProductForm): void
    (e: 'add'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function close() {
    emit('update:show', false)
}

function add() {
    if (!props.form.name || props.form.price <= 0) {
        alert('Vui lòng nhập tên sản phẩm và giá hợp lệ')
        return
    }
    emit('add')
}

function updateField(field: keyof ProductForm, value: string | number) {
    emit('update:form', { ...props.form, [field]: value })
}
</script>

<template>
    <div v-if="show"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 class="font-bold text-lg text-slate-800">Thêm sản phẩm tùy chỉnh</h3>
                <button @click="close"
                    class="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">
                        Tên sản phẩm <span class="text-red-500">*</span>
                    </label>
                    <input :value="form.name" @input="updateField('name', ($event.target as HTMLInputElement).value)"
                        type="text"
                        class="w-full h-11 px-4 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all font-medium"
                        placeholder="Nhập tên sản phẩm..." @keyup.enter="add">
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">
                        Giá bán <span class="text-red-500">*</span>
                    </label>
                    <input :value="form.price"
                        @input="updateField('price', Number(($event.target as HTMLInputElement).value))" type="number"
                        class="w-full h-11 px-4 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all font-medium"
                        placeholder="0" @keyup.enter="add">
                </div>

                <div class="mt-6 flex gap-3 justify-end">
                    <button @click="close"
                        class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                        Hủy bỏ
                    </button>
                    <button @click="add"
                        class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                        Thêm vào đơn
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
