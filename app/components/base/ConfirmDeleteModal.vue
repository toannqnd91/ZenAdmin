<script setup lang="ts">
interface Props {
    isOpen: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    title: 'Xác nhận xoá',
    message: 'Bạn có chắc chắn muốn xoá?',
    confirmText: 'Xoá',
    cancelText: 'Huỷ',
    loading: false
})

const emit = defineEmits<{
    (e: 'update:isOpen', value: boolean): void
    (e: 'confirm'): void
    (e: 'cancel'): void
}>()

const handleConfirm = () => {
    emit('confirm')
}

const handleCancel = () => {
    emit('cancel')
    emit('update:isOpen', false)
}
</script>

<template>
    <UModal :model-value="isOpen" @update:model-value="emit('update:isOpen', $event)">
        <UCard>
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
                    <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" @click="handleCancel" />
                </div>
            </template>

            <div class="py-4">
                <p class="text-gray-700 dark:text-gray-300">{{ message }}</p>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <UButton :label="cancelText" color="neutral" variant="outline" @click="handleCancel"
                        :disabled="loading" />
                    <UButton :label="confirmText" color="error" @click="handleConfirm" :loading="loading" />
                </div>
            </template>
        </UCard>
    </UModal>
</template>
