<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'

type GenericItem = Record<string, unknown>
type FetchFn = (search: string) => Promise<GenericItem[]>

interface Props {
  modelValue: GenericItem | null
  fetchFn: FetchFn
  placeholder?: string
  labelField?: string
  getDisplayText?: (item: GenericItem) => string
  getItemSubtitle?: (item: GenericItem) => string | null | undefined
  getItemKey?: (item: GenericItem) => string | number
  debounce?: number
  disabled?: boolean
  clearable?: boolean
  maxDisplayLength?: number
  openKey?: string // e.g. F4
}
const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'select', 'clear'])

const open = ref(false)
const search = ref('')
const items = ref<GenericItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
let debounceTimer: number | undefined

const maxDisplay = computed(() => props.maxDisplayLength ?? 30)

const displayText = computed(() => {
  if (!props.modelValue) return props.placeholder || 'Chọn...'
  let text: string
  if (props.getDisplayText) text = props.getDisplayText(props.modelValue)
  else if (props.labelField && props.modelValue && props.modelValue[props.labelField] !== undefined) text = String(props.modelValue[props.labelField])
  else text = String(props.modelValue)
  return text.length > maxDisplay.value ? text.slice(0, maxDisplay.value) + '...' : text
})

async function runFetch() {
  if (!props.fetchFn) return
  loading.value = true
  error.value = null
  try {
    const data = await props.fetchFn(search.value)
    items.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = (e instanceof Error ? e.message : 'Lỗi tải dữ liệu')
    items.value = []
  } finally {
    loading.value = false
  }
}

function openDropdown() {
  if (props.disabled) return
  open.value = true
  if (!items.value.length) runFetch()
  nextTick(() => document.addEventListener('mousedown', handleClickOutside))
}
function closeDropdown() {
  open.value = false
  document.removeEventListener('mousedown', handleClickOutside)
}
function toggleDropdown() {
  if (open.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}
function handleClickOutside(e: MouseEvent) {
  if (!dropdownRef.value || !triggerRef.value) return
  if (!dropdownRef.value.contains(e.target as Node) && !triggerRef.value.contains(e.target as Node)) {
    closeDropdown()
  }
}

watch(search, () => {
  if (!open.value) return
  if (debounceTimer) window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => runFetch(), props.debounce ?? 300)
})

function selectItem(item: GenericItem) {
  emit('update:modelValue', item)
  emit('select', item)
  closeDropdown()
}

function clearSelection(e: MouseEvent) {
  e.stopPropagation()
  emit('update:modelValue', null)
  emit('clear')
  search.value = ''
  runFetch()
}

function handleKey(e: KeyboardEvent) {
  if (props.openKey && e.key === props.openKey) {
    e.preventDefault()
    if (open.value) {
      closeDropdown()
    } else {
      openDropdown()
    }
  }
}

onMounted(() => {
  if (props.openKey) window.addEventListener('keydown', handleKey)
})

onBeforeUnmount(() => {
  if (props.openKey) window.removeEventListener('keydown', handleKey)
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div class="relative w-full">
    <div
      ref="triggerRef"
      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm flex items-center cursor-pointer transition-all duration-150 focus:outline-none"
      :class="{ 'ring-2 ring-primary-500 border-primary-500': open, 'opacity-60 cursor-not-allowed': disabled }"
      tabindex="0"
      @click="toggleDropdown"
    >
      <div class="flex-1 min-w-0 flex items-center overflow-hidden">
        <span class="block w-full truncate text-gray-900" :class="{ 'text-gray-400': !modelValue }">{{ displayText }}</span>
      </div>
      <button
        v-if="clearable && modelValue && !disabled"
        class="mr-1 text-gray-400 hover:text-gray-600"
        @click.stop="clearSelection"
      >
        ×
      </button>
      <svg
        class="w-4 h-4 text-gray-400 ml-2 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M19 9l-7 7-7-7"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
    <div
      v-if="open"
      ref="dropdownRef"
      class="absolute left-0 top-full z-50 w-full bg-white rounded-md shadow-lg border border-gray-300 mt-2"
    >
      <slot name="add-action" />
      <div class="px-3 pt-2 pb-2">
        <input
          v-model="search"
          type="text"
          class="w-full h-9 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400"
          :placeholder="placeholder || 'Tìm kiếm...'"
          :disabled="!!modelValue && !clearable"
          @click.stop
        >
      </div>
      <div v-if="loading" class="w-full px-3 py-4 text-center text-gray-500 text-sm">
        Đang tải...
      </div>
      <div v-else-if="error" class="w-full px-3 py-4 text-center text-red-500 text-sm">
        {{ error }}
      </div>
      <div v-else-if="items.length === 0" class="w-full px-3 py-4 text-center text-gray-500 text-sm rounded-b-md">
        Không có kết quả
      </div>
      <div v-else>
        <div
          v-for="item in items"
          :key="getItemKey ? getItemKey(item) : String((item as any).id ?? (item as any).slug ?? (item as any).code ?? (item as any).value ?? JSON.stringify(item))"
          class="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all"
          @click.stop="selectItem(item)"
        >
          <slot name="item" :item="item">
            <div class="flex-1">
              <div class="font-medium text-gray-900 text-sm">
                {{ getDisplayText ? getDisplayText(item) : (labelField ? (item[labelField] ?? '') : '') }}
              </div>
              <div v-if="getItemSubtitle && getItemSubtitle(item)" class="text-xs text-gray-500">
                {{ getItemSubtitle(item) }}
              </div>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>
