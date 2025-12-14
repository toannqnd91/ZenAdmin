<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'

const props = defineProps<{
    modelValue: boolean
    currentNote: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit', note: string): void
}>()

const open = ref(false)
// Local state for the note
const note = ref('')

// Sync modelValue -> open
watch(() => props.modelValue, (val) => {
    open.value = val
    if (val) {
        // Reset note when opening
        note.value = props.currentNote || ''
    }
})

// Sync open -> modelValue
watch(open, (val) => {
    emit('update:modelValue', val)
})

const onSubmit = () => {
    if (note.value.length > 1000) {
        // Simple validation (though textarea usually prevents nothing, we can just clamp or show error. 
        // adhering to previous constraint)
        return
    }
    emit('submit', note.value)
    open.value = false
}
</script>

<template>
    <BaseModal :model-value="open" title="Cập nhật ghi chú" @close="open = false">
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nội dung ghi chú</label>
                <UTextarea v-model="note" :rows="5" placeholder="Nhập ghi chú cho đơn hàng..." autofocus
                    class="w-full" />
                <div class="mt-1 text-xs text-gray-500 text-right">
                    {{ note.length }}/1000
                </div>
            </div>
        </div>

        <template #footer>
            <UButton color="neutral" variant="ghost" @click="open = false">
                Hủy
            </UButton>
            <UButton color="primary" @click="onSubmit" :disabled="note.length > 1000">
                Lưu thay đổi
            </UButton>
        </template>
    </BaseModal>
</template>
