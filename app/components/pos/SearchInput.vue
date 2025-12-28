<template>
    <div>
        <!-- Search Input -->
        <div class="p-3">
            <div class="relative">
                <input :value="modelValue"
                    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" type="text"
                    :placeholder="placeholder"
                    class="w-full h-9 pl-9 pr-3 rounded-lg border border-transparent bg-slate-100 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>

        <!-- Date Range Picker -->
        <div v-if="showDateRange" class="px-3 pb-3">
            <DateRangePicker :start-date="internalStartDate" :end-date="internalEndDate"
                @update:start-date="updateStartDate" @update:end-date="updateEndDate" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import DateRangePicker from './DateRangePicker.vue'

interface Props {
    modelValue: string
    placeholder?: string
    showDateRange?: boolean
    startDate?: string
    endDate?: string
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Tìm kiếm...',
    showDateRange: false,
    startDate: '',
    endDate: ''
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'update:startDate': [value: string]
    'update:endDate': [value: string]
}>()

const internalStartDate = ref<Date | null>(null)
const internalEndDate = ref<Date | null>(null)

// Convert string to Date
watch(() => props.startDate, (newVal) => {
    internalStartDate.value = newVal ? new Date(newVal) : null
}, { immediate: true })

watch(() => props.endDate, (newVal) => {
    internalEndDate.value = newVal ? new Date(newVal) : null
}, { immediate: true })

function updateStartDate(date: Date | null) {
    internalStartDate.value = date
    if (date) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        emit('update:startDate', `${year}-${month}-${day}`)
    } else {
        emit('update:startDate', '')
    }
}

function updateEndDate(date: Date | null) {
    internalEndDate.value = date
    if (date) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        emit('update:endDate', `${year}-${month}-${day}`)
    } else {
        emit('update:endDate', '')
    }
}

</script>
