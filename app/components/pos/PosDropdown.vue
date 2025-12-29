<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
    options?: any[]
    modelValue?: any
    displayKey?: string // Field name to display object options
    valueKey?: string // Field name to compare/emit value
    placeholder?: string
    width?: string
    placement?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

const props = withDefaults(defineProps<Props>(), {
    options: () => [],
    displayKey: 'name',
    valueKey: 'id',
    width: 'w-56',
    placement: 'bottom-right'
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)

function toggle() {
    isOpen.value = !isOpen.value
}

function close() {
    isOpen.value = false
}

function select(option: any) {
    emit('update:modelValue', option)
    emit('change', option)
    close()
}

// Helpers
const getDisplay = (option: any) => {
    if (typeof option === 'object' && option !== null) {
        return option[props.displayKey] || JSON.stringify(option)
    }
    return option
}

const isSelected = (option: any) => {
    if (props.modelValue === option) return true

    // Object comparison
    if (typeof option === 'object' && props.modelValue && typeof props.modelValue === 'object') {
        return option[props.valueKey] === props.modelValue[props.valueKey]
    }
    return false
}

// Computes dropdown position classes
const dropdownClasses = computed(() => {
    const base = 'absolute z-50 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in-up origin-top'
    const posClasses: Record<string, string> = {
        'top-left': 'bottom-full left-0 mb-2 origin-bottom-left',
        'top-right': 'bottom-full right-0 mb-2 origin-bottom-right',
        'bottom-left': 'top-full left-0 mt-2 origin-top-left',
        'bottom-right': 'top-full right-0 mt-2 origin-top-right',
    }

    return `${base} ${props.width} ${posClasses[props.placement] || posClasses['bottom-right']}`
})
</script>

<template>
    <div class="relative">
        <!-- Trigger -->
        <div @click="toggle" class="cursor-pointer">
            <slot name="trigger" :isOpen="isOpen" :value="modelValue" :display="getDisplay(modelValue)">
                <button
                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                    <span>{{ modelValue ? getDisplay(modelValue) : placeholder }}</span>
                    <svg class="w-4 h-4 text-slate-400" :class="{ 'rotate-180': isOpen }" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </slot>
        </div>

        <!-- Backdrop -->
        <div v-if="isOpen" @click="close" class="fixed inset-0 z-40 cursor-default bg-transparent"></div>

        <!-- Dropdown Menu -->
        <div v-if="isOpen" :class="dropdownClasses">
            <div class="py-1 max-h-[300px] overflow-y-auto">
                <template v-for="(opt, idx) in options" :key="idx">
                    <button @click="select(opt)"
                        class="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 group"
                        :class="isSelected(opt) ? 'bg-blue-50/50 text-blue-600 font-bold' : 'text-slate-700'">

                        <slot name="option" :option="opt" :selected="isSelected(opt)">
                            <span>{{ getDisplay(opt) }}</span>
                            <svg v-if="isSelected(opt)" class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 13l4 4L19 7" />
                            </svg>
                        </slot>
                    </button>
                </template>
            </div>
        </div>
    </div>
</template>