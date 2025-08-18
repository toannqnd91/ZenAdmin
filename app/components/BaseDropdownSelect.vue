<script setup lang="ts">
/* eslint-disable */
import { ref, computed, watch, nextTick } from 'vue'
import CustomCheckbox from '@/components/CustomCheckbox.vue'

interface Option {
    id: string | number
    label: string
}

const props = defineProps<{
    modelValue: string | number | Array<string | number> | null
    options: Option[]
    placeholder?: string
    multiple?: boolean
    addNewLabel?: string
    loading?: boolean
    class?: string
    /**
     * How to display selected values in multiple mode
     * - 'labels': show joined labels (default)
     * - 'count': show selected count text
     */
    multipleDisplay?: 'labels' | 'count'
    /** Text prefix for count mode, e.g., 'Đã chọn' */
    selectedCountText?: string
        /** Text suffix for count mode, e.g., 'giá trị' */
        selectedCountSuffix?: string
        /** When provided, switch to count mode once selection count >= this number */
        countWhenAtLeast?: number
}>()
const emit = defineEmits(['update:modelValue', 'add-new'])
const search = ref('')
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const filteredOptions = computed(() => {
    if (!search.value) return props.options
    return props.options.filter(opt => opt.label.toLowerCase().includes(search.value.toLowerCase()))
})
const selectedCount = computed(() => (Array.isArray(props.modelValue) ? props.modelValue.length : 0))
const showCount = computed(() => {
    if (!props.multiple) return false
    const count = selectedCount.value
    if (!count) return false
    if (props.multipleDisplay === 'count') return true
    if (typeof props.countWhenAtLeast === 'number') return count >= props.countWhenAtLeast
    return false
})
const isSelected = (id: string | number) => {
    if (Array.isArray(props.modelValue)) return props.modelValue.includes(id)
    return props.modelValue === id
}
function toggleOption(id: string | number) {
    if (props.multiple) {
        const arr = Array.isArray(props.modelValue) ? [...props.modelValue] : []
        const idx = arr.indexOf(id)
        if (idx > -1) arr.splice(idx, 1)
        else arr.push(id)
        emit('update:modelValue', arr)
    } else {
        emit('update:modelValue', id)
        isOpen.value = false
    }
}
function handleAddNew() {
    emit('add-new', search.value)
    search.value = ''
    nextTick(() => {
        isOpen.value = false
    })
}
function handleClickOutside(e: MouseEvent) {
    if (!dropdownRef.value?.contains(e.target as Node)) {
        isOpen.value = false
    }
}
watch(isOpen, (open) => {
    if (open) {
        document.addEventListener('mousedown', handleClickOutside)
    } else {
        document.removeEventListener('mousedown', handleClickOutside)
    }
})
</script>

<template>
    <!-- eslint-disable vue/html-indent, vue/max-attributes-per-line -->
    <div ref="dropdownRef" class="relative">
        <div
            :class="[props.class, 'flex items-center cursor-pointer', { 'opacity-50 pointer-events-none': props.loading }]"
            @click="isOpen = !isOpen"
        >
            <span v-if="!props.multiple && props.modelValue">
                {{ options.find(o => o.id === props.modelValue)?.label || props.placeholder || '' }}
            </span>
                    <span v-else-if="props.multiple && Array.isArray(props.modelValue) && props.modelValue.length">
                        <template v-if="showCount">
                            {{ (props.selectedCountText || 'Đã chọn') + ' ' + props.modelValue.length + ' ' + (props.selectedCountSuffix || 'giá trị') }}
                        </template>
                <template v-else>
                    {{ props.modelValue.map(id => options.find(o => o.id === id)?.label).filter(Boolean).join(', ') }}
                </template>
            </span>
            <span v-else class="text-gray-400">{{ props.placeholder || 'Chọn...' }}</span>
            <svg class="ml-auto h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
        <div v-if="isOpen" class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
            <div class="p-2">
                <input
                    v-model="search"
                    type="text"
                    class="w-full h-[36px] px-3 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    :placeholder="'Tìm kiếm...'"
                >
            </div>
            <div
                v-if="props.addNewLabel && search && !filteredOptions.length"
                class="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2"
                @click="handleAddNew"
            >
                <span class="text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                </span>
                <span>{{ props.addNewLabel }} "{{ search }}"</span>
            </div>
            <div v-else>
                <div
                    v-for="opt in filteredOptions"
                    :key="opt.id"
                    class="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-100"
                    @click="toggleOption(opt.id)"
                >
                    <CustomCheckbox
                        v-if="props.multiple"
                        :model-value="isSelected(opt.id)"
                        @update:model-value="toggleOption(opt.id)"
                        class="mr-2"
                    />
                    <span v-else-if="isSelected(opt.id)" class="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </span>
                    <span>{{ opt.label }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
input[type="checkbox"] {
    accent-color: #2563eb;
}
</style>
