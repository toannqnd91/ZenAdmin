<script setup lang="ts">
/* eslint-disable */
import { ref, computed, watch, nextTick } from 'vue'
import CustomCheckbox from '@/components/CustomCheckbox.vue'

interface Option {
    id: string | number
    label: string
    children?: Option[]
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
type FlatItem = { opt: Option, depth: number }

function flattenOptions(list: Option[], depth = 0): FlatItem[] {
    const out: FlatItem[] = []
    for (const o of (list || [])) {
        out.push({ opt: o, depth })
        if (Array.isArray(o.children) && o.children.length) {
            out.push(...flattenOptions(o.children, depth + 1))
        }
    }
    return out
}

function findOptionById(id: string | number | null | undefined, list: Option[]): Option | undefined {
    if (id == null) return undefined
    for (const o of list) {
        if (o.id === id) return o
        if (o.children && o.children.length) {
            const f = findOptionById(id, o.children)
            if (f) return f
        }
    }
    return undefined
}

const filteredFlat = computed<FlatItem[]>(() => {
    const all = flattenOptions(props.options || [])
    if (!search.value) return all
    const term = search.value.toLowerCase()
    return all.filter(it => (it.opt.label || '').toLowerCase().includes(term))
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

const hasChildren = (o?: Option) => !!(o && Array.isArray(o.children) && o.children.length)
const getDescendantIds = (o?: Option): Array<string | number> => {
    if (!o || !Array.isArray(o.children)) return []
    const out: Array<string | number> = []
    for (const ch of o.children) {
        out.push(ch.id)
        if (ch.children && ch.children.length) out.push(...getDescendantIds(ch))
    }
    return out
}
const isNodeChecked = (o: Option): boolean => {
    if (!props.multiple) return isSelected(o.id)
    const current = new Set(Array.isArray(props.modelValue) ? props.modelValue as Array<string | number> : [])
    if (!hasChildren(o)) return current.has(o.id)
    const all = getDescendantIds(o)
    if (!all.length) return current.has(o.id)
    return all.every(id => current.has(id))
}
const isNodeIndeterminate = (o: Option): boolean => {
    if (!props.multiple) return false
    if (!hasChildren(o)) return false
    const current = new Set(Array.isArray(props.modelValue) ? props.modelValue as Array<string | number> : [])
    const all = getDescendantIds(o)
    if (!all.length) return false
    const some = all.some(id => current.has(id))
    const every = all.every(id => current.has(id))
    return some && !every
}

function toggleOption(id: string | number) {
    // legacy toggle by id (leaf or single select)
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

function toggleNode(o: Option, next?: boolean) {
    if (!props.multiple) {
        emit('update:modelValue', o.id)
        isOpen.value = false
        return
    }
    const set = new Set(Array.isArray(props.modelValue) ? (props.modelValue as Array<string | number>) : [])
    const targets = [o.id, ...getDescendantIds(o)]
    const currentlyAll = targets.every(id => set.has(id))
    const targetState = typeof next === 'boolean' ? next : !currentlyAll
    if (targetState) {
        for (const id of targets) set.add(id)
    } else {
        for (const id of targets) set.delete(id)
    }
    emit('update:modelValue', Array.from(set))
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
            <div class="flex-1 min-w-0 overflow-hidden">
                <span v-if="!props.multiple && props.modelValue" class="block truncate">
                    {{ findOptionById(props.modelValue as (string | number), options)?.label || props.placeholder || '' }}
                </span>
                <span v-else-if="props.multiple && Array.isArray(props.modelValue) && props.modelValue.length" class="block truncate">
                    <template v-if="showCount">
                        {{ (props.selectedCountText || 'Đã chọn') + ' ' + props.modelValue.length + ' ' + (props.selectedCountSuffix || 'giá trị') }}
                    </template>
                    <template v-else>
                        {{ props.modelValue.map(id => findOptionById(id, options)?.label).filter(Boolean).join(', ') }}
                    </template>
                </span>
                <span v-else class="text-gray-400 block truncate">{{ props.placeholder || 'Chọn...' }}</span>
            </div>
            <svg class="ml-2 h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                v-if="props.addNewLabel && search && !filteredFlat.length"
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
            <div v-else class="max-h-80 overflow-auto">
                <div
                    v-for="item in filteredFlat"
                    :key="item.opt.id"
                    class="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-100"
                    @click="toggleNode(item.opt)"
                >
                    <CustomCheckbox
                        v-if="props.multiple"
                        :model-value="isNodeChecked(item.opt)"
                        :indeterminate="isNodeIndeterminate(item.opt)"
                        @update:model-value="(v:boolean) => toggleNode(item.opt, v)"
                        class="mr-2"
                    />
                    <span v-else-if="isSelected(item.opt.id)" class="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </span>
                    <span :style="{ paddingLeft: (item.depth * 16) + 'px' }">{{ item.opt.label }}</span>
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
