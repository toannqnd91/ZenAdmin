<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseNumberInput from '@/components/base/BaseNumberInput.vue'

interface Props {
    modelValue: boolean
    currentDebt: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'update:modelValue': [boolean]
    'submit': [{ newDebt: number; note: string }]
}>()

const open = ref(false)
const newDebt = ref<number | null>(null)
const note = ref('')

watch(() => props.modelValue, (val) => {
    open.value = val
    if (val) {
        newDebt.value = null
        note.value = ''
    }
})

watch(open, (val) => {
    emit('update:modelValue', val)
})

function formatMoney(n: number) {
    return `${Number(n || 0).toLocaleString('vi-VN')}`
}

function submit() {
    // Allow 0 debt
    if (newDebt.value === null || newDebt.value === undefined) return

    emit('submit', {
        newDebt: newDebt.value,
        note: note.value
    })
}
</script>

<template>
    <BaseModal :model-value="open" title="Điều chỉnh công nợ" class="w-full max-w-lg">
        <div class="space-y-4 py-2">
            <!-- Current Debt -->
            <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700">Nợ hiện tại</label>
                <div
                    class="w-full h-10 px-3 flex items-center bg-gray-100 rounded-md border border-gray-200 text-sm text-gray-900">
                    {{ formatMoney(currentDebt) }}
                    <span class="ml-auto text-gray-500 font-medium">đ</span>
                </div>
            </div>

            <!-- New Debt -->
            <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700">Nợ sau chỉnh sửa</label>
                <div class="relative">
                    <BaseNumberInput v-model="newDebt" :allow-decimal="false" group-separator="." decimal-separator=","
                        placeholder="Nhập nợ sau chỉnh sửa"
                        class="w-full h-10 pr-8 pl-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400" />
                    <span
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none font-medium">đ</span>
                </div>
            </div>

            <!-- Note -->
            <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700">Ghi chú</label>
                <div class="relative">
                    <textarea v-model="note" rows="3" placeholder="Nhập ghi chú" maxlength="250"
                        class="w-full p-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none placeholder-gray-400"></textarea>
                    <div class="absolute bottom-2 right-2 text-xs text-gray-400">
                        {{ note.length }}/250
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-3 w-full pt-2">
                <button type="button"
                    class="px-4 py-2 bg-white border border-primary-200 text-primary-600 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none hover:text-primary-700 transition-colors"
                    @click="open = false">
                    Hủy
                </button>
                <button type="button"
                    class="px-4 py-2 bg-blue-500 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-600 focus:outline-none shadow-sm transition-colors"
                    :disabled="newDebt === null" :class="{ 'opacity-50 cursor-not-allowed': newDebt === null }"
                    @click="submit">
                    Xác nhận
                </button>
            </div>
        </template>
    </BaseModal>
</template>
