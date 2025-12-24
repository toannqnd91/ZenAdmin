<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { localizationService } from '~/services/localization.service'

interface Props {
    modelValue: boolean
    entityType: string
    entityId: number
    currentName: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'saved'])

const isLoading = ref(false)
const isSaving = ref(false)

// Dynamic translation fields
const translationData = ref<Record<string, any>>({})

// Computed property to get field entries for rendering
const fieldEntries = computed(() => {
    return Object.entries(translationData.value)
})

watch(() => props.modelValue, (val) => {
    if (val) {
        loadTranslation()
    }
})

async function loadTranslation() {
    isLoading.value = true
    try {
        const result = await localizationService.getTranslation(props.entityType, props.entityId, 'en-US')

        if (result && result.success && result.data) {
            // Store all fields from API response
            translationData.value = { ...result.data }
        } else {
            // Initialize with empty object if no translation exists
            translationData.value = {}
        }
    } catch (error) {
        console.error('Error loading translation:', error)
        // Initialize with empty object on error
        translationData.value = {}
    } finally {
        isLoading.value = false
    }
}

async function handleSubmit() {
    isSaving.value = true
    try {
        const result = await localizationService.updateTranslation(
            props.entityType,
            props.entityId,
            'en-US',
            translationData.value as any
        )

        if (result && result.success) {
            emit('saved')
            emit('update:modelValue', false)
        } else {
            alert('Failed to save translation: ' + (result?.message || 'Unknown error'))
        }
    } catch (error) {
        console.error('Error saving translation:', error)
        alert('Failed to save translation')
    } finally {
        isSaving.value = false
    }
}

function handleCancel() {
    emit('update:modelValue', false)
}

// Helper function to format field name for display
function formatFieldName(fieldName: string): string {
    // Convert camelCase to Title Case with spaces
    return fieldName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim()
}
</script>

<template>
    <BaseModal :model-value="modelValue" title="English Translation" width-class="max-w-md"
        @update:model-value="emit('update:modelValue', $event)">
        <div v-if="isLoading" class="py-8 text-center">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-primary mb-2" />
            <p class="text-sm text-gray-600 dark:text-gray-400">Loading translation...</p>
        </div>

        <div v-else class="space-y-4">
            <!-- Vietnamese Name (full width) -->
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vietnamese Name
                </label>
                <input :value="currentName" disabled
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400" />
            </div>

            <!-- Dynamic fields (all full width) -->
            <div v-for="[fieldName, fieldValue] in fieldEntries" :key="fieldName">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ formatFieldName(fieldName) }}
                </label>
                <input v-model="translationData[fieldName]" type="text"
                    :placeholder="`Enter ${formatFieldName(fieldName)}`"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-3">
                <UButton label="Hủy" color="neutral" variant="ghost" @click="handleCancel" />
                <UButton label="Hoàn thành" color="primary" :disabled="isLoading" :loading="isSaving"
                    @click="handleSubmit" />
            </div>
        </template>
    </BaseModal>
</template>
