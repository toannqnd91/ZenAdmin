<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface CustomerDraft {
    firstName: string
    lastName: string
    email: string
    phone: string
    birthDate: string
    gender: number | null
    marketingOptIn: boolean
}

interface Props {
    modelValue: boolean
    customer: any
}

const props = withDefaults(defineProps<Props>(), {
    customer: null
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'saved', data: any): void
}>()

const open = computed({
    get: () => props.modelValue,
    set: v => emit('update:modelValue', v)
})

const draft = ref<CustomerDraft>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: 0,
    marketingOptIn: false
})

const touched = ref({ firstName: false, lastName: false }) // Validate names
const lastNameError = computed(() => (touched.value.lastName && !draft.value.lastName.trim() ? 'Họ là bắt buộc' : ''))
const firstNameError = computed(() => (touched.value.firstName && !draft.value.firstName.trim() ? 'Tên là bắt buộc' : ''))
const hasErrors = computed(() => !!(firstNameError.value || lastNameError.value))

function reset() {
    if (props.customer) {
        const full = props.customer.fullName || ''
        const parts = full.trim().split(/\s+/)
        let last = ''
        let first = ''
        if (parts.length > 0) {
            last = parts[0]
            first = parts.slice(1).join(' ')
        }

        // Parse birthDate from "DD/MM/YYYY" or ISO to YYYY-MM-DD for input[type=date]
        // customer.birthDate in [id].vue is mapped to locale string "dd/MM/yyyy"
        // We need to try to parse it back or use the raw ISO if available (but we only pass the view model)
        // Let's assume we might need to parse "20/11/1990" -> "1990-11-20"
        let bDate = ''
        if (props.customer.birthDate) {
            // Try to parse "dd/mm/yyyy"
            const p = props.customer.birthDate.split('/')
            if (p.length === 3) {
                bDate = `${p[2]}-${p[1]}-${p[0]}`
            } else {
                // Try normal date parse
                const d = new Date(props.customer.birthDate)
                if (!isNaN(d.getTime())) {
                    bDate = d.toISOString().split('T')[0]
                }
            }
        }

        let genderVal = 2 // Khác
        if (props.customer.gender === 'Nam') genderVal = 0
        else if (props.customer.gender === 'Nữ') genderVal = 1
        else if (props.customer.gender === '0') genderVal = 0
        else if (props.customer.gender === '1') genderVal = 1

        draft.value = {
            lastName: last,
            firstName: first,
            email: props.customer.email || '',
            phone: props.customer.phone || '',
            birthDate: bDate,
            gender: genderVal,
            marketingOptIn: props.customer.marketingOptIn || false
        }
    }
    touched.value = { firstName: false, lastName: false }
}

watch(open, (v) => { if (v) reset() })

function save() {
    touched.value.firstName = true
    touched.value.lastName = true
    if (hasErrors.value) return

    const dataToSave = {
        firstName: draft.value.lastName.trim(),
        lastName: draft.value.firstName.trim(),
        email: draft.value.email || null,
        phoneNumber: draft.value.phone || null,
        birthDate: draft.value.birthDate ? new Date(draft.value.birthDate).toISOString() : null,
        gender: draft.value.gender,
        acceptsMarketing: draft.value.marketingOptIn
    }

    emit('saved', dataToSave)
    open.value = false
}

function close() {
    open.value = false
}
</script>

<template>
    <Teleport to="body">
        <div v-if="open" class="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4"
            @keydown.esc="close">
            <div class="bg-white w-full max-w-2xl rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-2rem)]"
                role="dialog" aria-modal="true" @click.stop>
                <!-- Header -->
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-semibold">Sửa thông tin khách hàng</h3>
                    <button class="text-gray-400 hover:text-gray-600 text-2xl leading-none" @click="close">
                        &times;
                    </button>
                </div>

                <!-- Body -->
                <div class="p-6 space-y-6 overflow-y-auto">
                    <!-- Name Row -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-xs font-medium text-gray-600 mb-1">Họ <span
                                    class="text-red-500">*</span></label>
                            <input v-model="draft.lastName" type="text"
                                class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                :class="lastNameError ? 'border-red-400 bg-red-50' : 'border-gray-300'"
                                @blur="touched.lastName = true" placeholder="Nhập họ">
                            <p v-if="lastNameError" class="text-xs text-red-600 mt-1">{{ lastNameError }}</p>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-600 mb-1">Tên <span
                                    class="text-red-500">*</span></label>
                            <input v-model="draft.firstName" type="text"
                                class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                :class="firstNameError ? 'border-red-400 bg-red-50' : 'border-gray-300'"
                                @blur="touched.firstName = true" placeholder="Nhập tên">
                            <p v-if="firstNameError" class="text-xs text-red-600 mt-1">{{ firstNameError }}</p>
                        </div>
                    </div>

                    <!-- Contact Row -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-xs font-medium text-gray-600 mb-1">Email</label>
                            <input v-model="draft.email" type="email"
                                class="w-full h-9 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Nhập email">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
                            <div class="relative">
                                <input v-model="draft.phone" type="text"
                                    class="w-full h-9 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Nhập số điện thoại">
                                <!-- Could add flag icon here if needed -->
                                <div class="absolute right-2 top-1.5 flex items-center gap-1">
                                    <span class="text-lg leading-none">🇻🇳</span>
                                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Personal Info Row -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-xs font-medium text-gray-600 mb-1">Ngày sinh</label>
                            <input v-model="draft.birthDate" type="date"
                                class="w-full h-9 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-600 mb-1">Giới tính</label>
                            <div class="flex items-center gap-6 h-9">
                                <label class="inline-flex items-center gap-2 cursor-pointer">
                                    <input type="radio" v-model="draft.gender" :value="0"
                                        class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500">
                                    <span class="text-sm text-gray-700">Nam</span>
                                </label>
                                <label class="inline-flex items-center gap-2 cursor-pointer">
                                    <input type="radio" v-model="draft.gender" :value="1"
                                        class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500">
                                    <span class="text-sm text-gray-700">Nữ</span>
                                </label>
                                <label class="inline-flex items-center gap-2 cursor-pointer">
                                    <input type="radio" v-model="draft.gender" :value="2"
                                        class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500">
                                    <span class="text-sm text-gray-700">Khác</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Marketing Checkbox -->
                    <div class="flex items-center gap-2">
                        <input id="marketing" v-model="draft.marketingOptIn" type="checkbox"
                            class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500">
                        <label for="marketing" class="text-sm text-gray-700 select-none">Nhận email quảng cáo</label>
                    </div>
                </div>

                <!-- Footer -->
                <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                    <button type="button"
                        class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
                        @click="close">
                        Hủy
                    </button>
                    <button type="button"
                        class="h-9 px-5 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
                        @click="save">
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
