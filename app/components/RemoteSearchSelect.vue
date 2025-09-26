<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'

type GenericItem = Record<string, unknown>
type FetchFn = (search: string) => Promise<GenericItem[]>

interface Props {
  modelValue: GenericItem | GenericItem[] | null
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
  searchable?: boolean // when false, hide search input
  dropdownMaxHeight?: number | string // max height of dropdown items area
  searchInTrigger?: boolean // when true, type in the top trigger instead of dropdown
  resetSearchOnOpen?: boolean // when true, clear search on open to show full list
  multiple?: boolean // when true, allow selecting multiple items
  autoWidth?: boolean // when true, dropdown width fits content (min aligned to trigger)
  borderless?: boolean // when true, remove outer borders and use subtle hover bg
  fullWidth?: boolean // when false, do not force w-full on trigger container
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
const longestLabelPx = ref<number | null>(null)

const maxDisplay = computed(() => props.maxDisplayLength ?? 30)
const maxListStyle = computed(() => {
  const v = props.dropdownMaxHeight
  if (v == null) return 'max-height: 380px;'
  if (typeof v === 'number') return `max-height: ${v}px;`
  return `max-height: ${v};`
})

function itemLabel(item: GenericItem): string {
  if (props.getDisplayText) return props.getDisplayText(item)
  if (props.labelField && item && item[props.labelField] !== undefined) return String(item[props.labelField])
  try {
    return String(item)
  } catch {
    return ''
  }
}

const displayText = computed(() => {
  if (props.multiple) {
    const arr = Array.isArray(props.modelValue) ? props.modelValue : []
    if (!arr.length) return props.placeholder || 'Chọn...'
    const text = arr.map(itemLabel).filter(Boolean).join(', ')
    return text.length > maxDisplay.value ? text.slice(0, maxDisplay.value) + '...' : text
  }
  if (!props.modelValue) return props.placeholder || 'Chọn...'
  const text = itemLabel(props.modelValue as GenericItem)
  return text.length > maxDisplay.value ? text.slice(0, maxDisplay.value) + '...' : text
})

async function runFetch(searchOverride?: string) {
  if (!props.fetchFn) return
  loading.value = true
  error.value = null
  try {
    const q = typeof searchOverride === 'string' ? searchOverride : search.value
    const data = await props.fetchFn(q)
    items.value = Array.isArray(data) ? data : []
    if (props.autoWidth) {
      // Measure longest label roughly using canvas (faster than DOM measuring each render)
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (ctx) {
          // approximate font used in items: text-sm (Tailwind ~14px) with normal weight
          ctx.font = '400 14px ui-sans-serif, system-ui, sans-serif'
          let max = 0
          for (const it of items.value) {
            const label = itemLabel(it)
            const w = ctx.measureText(label).width
            if (w > max) max = w
          }
          // Add padding (left+right 24px) plus space for check icon (~20px) + scrollbar reserve (if any)
          longestLabelPx.value = Math.ceil(max + 24 + 20 + 4)
        }
      } catch {
        longestLabelPx.value = null
      }
    }
  } catch (e) {
    error.value = (e instanceof Error ? e.message : 'Lỗi tải dữ liệu')
    items.value = []
  } finally {
    loading.value = false
  }
}

// Derive a stable item key and selection matcher
function itemKey(item: GenericItem): string {
  if (props.getItemKey) return String(props.getItemKey(item))
  const obj = item as Record<string, unknown>
  const candidates = ['id', 'slug', 'code', 'value'] as const
  for (const key of candidates) {
    const v = obj[key]
    if (typeof v === 'string' || typeof v === 'number') return String(v)
  }
  try {
    return JSON.stringify(item)
  } catch {
    return String(item)
  }
}
const selectedKey = computed(() => (!props.multiple && props.modelValue ? itemKey(props.modelValue as GenericItem) : null))
const selectedKeys = computed<Set<string>>(() => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return new Set(props.modelValue.map(it => itemKey(it)))
  }
  const s = selectedKey.value
  return new Set(s ? [s] : [])
})
function isSelected(item: GenericItem) {
  return selectedKeys.value.has(itemKey(item))
}

function openDropdown() {
  if (props.disabled) return
  open.value = true
  // Show full list on open without clearing the input text
  if (props.resetSearchOnOpen !== false) {
    runFetch('')
  } else {
    runFetch()
  }
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
  // If typing in trigger while closed, auto open and fetch
  if (!open.value && props.searchInTrigger && props.searchable !== false) {
    openDropdown()
  }
  if (!open.value) return
  if (debounceTimer) window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => runFetch(), props.debounce ?? 300)
})

function selectItem(item: GenericItem) {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const k = itemKey(item)
    const idx = current.findIndex(it => itemKey(it) === k)
    if (idx >= 0) current.splice(idx, 1)
    else current.push(item)
    emit('update:modelValue', current)
    emit('select', item)
    // keep dropdown open for multi-select
    return
  }
  emit('update:modelValue', item)
  emit('select', item)
  closeDropdown()
}

function clearSelection(e: MouseEvent) {
  e.stopPropagation()
  if (props.multiple) emit('update:modelValue', [])
  else emit('update:modelValue', null)
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
  <div class="relative" :class="props.fullWidth !== false ? 'w-full' : 'inline-flex'">
    <div
      ref="triggerRef"
      class="h-9 px-3 rounded-md text-sm flex items-center cursor-pointer transition-all duration-150 focus:outline-none"
      :class="[
        props.fullWidth !== false ? 'w-full' : 'w-auto',
        disabled ? 'opacity-60 cursor-not-allowed' : '',
        open && !props.borderless ? 'ring-2 ring-primary-500 border border-primary-500 bg-white' : '',
        open && props.borderless ? 'ring-2 ring-primary-500 bg-white' : '',
        !open && props.borderless ? 'bg-transparent hover:bg-gray-50' : '',
        !open && !props.borderless ? 'border border-gray-300 bg-white' : ''
      ]"
      tabindex="0"
      @click="toggleDropdown"
    >
      <div class="flex-1 min-w-0 flex items-center overflow-hidden">
        <!-- Optional left content in trigger, e.g., icon/avatar of selected item -->
        <slot name="trigger-left" :value="modelValue" />
        <template v-if="searchable !== false && searchInTrigger && open">
          <input
            v-model="search"
            type="text"
            class="w-full h-7 px-0 border-0 outline-none bg-transparent text-gray-900 placeholder-gray-400"
            :placeholder="placeholder || 'Tìm kiếm...'"
            @click.stop
          >
        </template>
        <span v-else class="block w-full truncate text-gray-900" :class="{ 'text-gray-400': !modelValue }">{{ displayText }}</span>
      </div>
      <button
        v-if="clearable && ((Array.isArray(modelValue) ? modelValue.length > 0 : !!modelValue)) && !disabled"
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
      :class="[
        'absolute left-0 top-full z-50 bg-white rounded-md shadow-lg mt-2',
        props.borderless ? 'border border-gray-200' : 'border border-gray-300',
        props.autoWidth ? 'w-auto' : 'w-full'
      ]"
      :style="props.autoWidth ? {
        minWidth: (triggerRef?.offsetWidth || 0) + 'px',
        width: longestLabelPx != null && longestLabelPx > (triggerRef?.offsetWidth || 0)
          ? longestLabelPx + 'px'
          : undefined
      } : undefined"
    >
      <slot name="add-action" />
      <div v-if="searchable !== false && !searchInTrigger" class="px-3 pt-2 pb-2">
        <input
          v-model="search"
          type="text"
          class="w-full h-9 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400"
          :placeholder="placeholder || 'Tìm kiếm...'"
          :disabled="((Array.isArray(modelValue) ? modelValue.length > 0 : !!modelValue) && !clearable)"
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
        <div class="overflow-auto" :style="maxListStyle">
          <div
            v-for="item in items"
            :key="itemKey(item)"
            class="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all"
            :class="{ 'bg-primary-50': isSelected(item) }"
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
            <svg
              v-if="isSelected(item)"
              class="w-4 h-4 text-primary-600 ml-2 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 11.586l6.543-6.543a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
