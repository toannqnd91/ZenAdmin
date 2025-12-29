<template>
    <div :class="{ 'p-3': !noPadding }">
        <!-- Input Wrapper -->
        <div class="relative">
            <div v-if="icon || $slots.icon"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <slot name="icon">
                    <svg v-if="icon === 'search'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </slot>
            </div>

            <input :value="modelValue" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
                :type="type" :placeholder="placeholder" :disabled="disabled" :readonly="readonly"
                class="w-full rounded-xl border border-transparent bg-slate-100 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                :class="[
                    icon || $slots.icon ? 'pl-10 pr-4' : 'px-4',
                    sizeClass,
                    inputClass
                ]" />
        </div>

        <!-- Date Range Picker -->
        <div v-if="showDateRange" class="mt-3">
            <DateRangePicker :start-date="internalStartDate" :end-date="internalEndDate"
                @update:start-date="updateStartDate" @update:end-date="updateEndDate" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import DateRangePicker from './DateRangePicker.vue'

interface Props {
    modelValue: string | number
    placeholder?: string
    showDateRange?: boolean
    startDate?: string
    endDate?: string
    type?: string
    icon?: string
    noPadding?: boolean
    inputClass?: string
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: '',
    showDateRange: false,
    startDate: '',
    endDate: '',
    type: 'text',
    icon: '', // 'search' or empty
    noPadding: false,
    inputClass: '',
    size: 'md',
    disabled: false,
    readonly: false
})

const emit = defineEmits<{
    'update:modelValue': [value: string | number]
    'update:startDate': [value: string]
    'update:endDate': [value: string]
}>()

const sizeClass = computed(() => {
    switch (props.size) {
        case 'sm': return 'h-9 text-xs'
        case 'lg': return 'h-12 text-base'
        default: return 'h-11 text-sm' // Default 'md' changed to h-11 to match PosSettings style primarily
    }
})

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
