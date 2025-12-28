<script setup lang="ts">
interface CustomerForm {
    name: string
    phone: string
    address: string
}

interface Props {
    show: boolean
    form: CustomerForm
}

interface Emits {
    (e: 'update:show', value: boolean): void
    (e: 'update:form', value: CustomerForm): void
    (e: 'save'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function close() {
    emit('update:show', false)
}

function save() {
    if (!props.form.name || !props.form.phone) {
        alert('Vui lòng nhập tên và số điện thoại')
        return
    }
    emit('save')
}

function updateField(field: keyof CustomerForm, value: string) {
    emit('update:form', { ...props.form, [field]: value })
}
</script>

<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 class="text-lg font-bold text-slate-800">Thêm khách hàng mới</h3>
                <button @click="close" class="text-slate-400 hover:text-red-500 transition-colors">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">
                        Tên khách hàng <span class="text-red-500">*</span>
                    </label>
                    <input :value="form.name" @input="updateField('name', ($event.target as HTMLInputElement).value)"
                        type="text"
                        class="w-full h-11 px-4 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all font-medium"
                        placeholder="Ví dụ: Nguyễn Văn A">
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">
                        Số điện thoại <span class="text-red-500">*</span>
                    </label>
                    <input :value="form.phone" @input="updateField('phone', ($event.target as HTMLInputElement).value)"
                        type="tel"
                        class="w-full h-11 px-4 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all font-medium"
                        placeholder="Ví dụ: 0901234567">
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                    <input :value="form.address"
                        @input="updateField('address', ($event.target as HTMLInputElement).value)" type="text"
                        class="w-full h-11 px-4 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-0 transition-all font-medium"
                        placeholder="Ví dụ: 123 Đường ABC...">
                </div>
            </div>

            <div class="bg-slate-50 px-6 py-4 flex gap-3 justify-end">
                <button @click="close"
                    class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                    Hủy bỏ
                </button>
                <button @click="save"
                    class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                    Lưu khách hàng
                </button>
            </div>
        </div>
    </div>
</template>
