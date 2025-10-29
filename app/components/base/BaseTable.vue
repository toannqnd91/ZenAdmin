<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TableEmptyState from './TableEmptyState.vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { SortableEvent } from 'sortablejs'

export interface TableColumn {
  key: string
  label: string
  class?: string
  sortable?: boolean
  render?: (item: Record<string, unknown>) => unknown
  align?: 'left' | 'center' | 'right'
}

export interface TableAction {
  label: string
  icon: string
  handler: (selectedIds: string[]) => void
  variant?: 'primary' | 'secondary'
}

export interface AddButton {
  label: string
  href?: string
  handler?: () => void
}

interface Props {
  // Data & State
  data: Record<string, unknown>[]
  loading?: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination?: { pageIndex: number, pageSize: number }

  // Configuration
  title: string
  columns: TableColumn[]
  addButton?: AddButton
  addButtonDropdownItems?: unknown[]
  actions?: TableAction[]

  // Server pagination totals (optional)
  totalRecords?: number
  totalPages?: number

  // Row actions
  rowClickEnabled?: boolean
  rowClickHandler?: (item: Record<string, unknown>) => void

  // Styling
  showFilter?: boolean
  searchPlaceholder?: string
  showRowActions?: boolean
  selectable?: boolean

  // Colgroup widths
  colWidths?: string[]
  // Dragging
  draggable?: boolean
  dragHandleClass?: string
  dragAnimation?: number

  // Thêm prop tabs cho BaseTable
  tabs?: TableTab[]
  // When true, render the tabs as a standalone line above the header bar
  tabsSeparateLine?: boolean

  // Body (table container) horizontal padding utility classes
  bodyPadding?: string
  headerPaddingX?: string
  footerPadding?: string
  // Hide built-in search input (so parent can render its own in filters-line)
  hideSearch?: boolean
  // Hide title text completely
  hideTitle?: boolean
  // Tabs visual style: default 'pill' (current behavior) or 'underline'
  tabsStyle?: 'pill' | 'underline'

  // Empty state
  emptyTitle?: string
  emptyDescription?: string
  emptyActionLabel?: string
  emptyActionIcon?: string
}

interface TableTab {
  label: string
  value: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  rowClickEnabled: true,
  showFilter: false,
  showRowActions: true,
  selectable: true,
  searchPlaceholder: 'Tìm kiếm...',
  pagination: () => ({ pageIndex: 0, pageSize: 15 }),
  totalRecords: 0,
  totalPages: 1,
  bodyPadding: 'px-6',
  headerPaddingX: 'px-6',
  footerPadding: 'px-6 pb-4',
  tabsSeparateLine: false,
  hideSearch: false,
  hideTitle: false,
  tabsStyle: 'pill',
  emptyTitle: 'Chưa có dữ liệu',
  emptyDescription: 'Hiện chưa có bản ghi nào để hiển thị',
  emptyActionLabel: '',
  emptyActionIcon: 'i-lucide-plus',
  actions: () => [
    {
      label: 'Change Status',
      icon: 'M16.862 5.487a2.06 2.06 0 0 1 2.915 2.914l-9.193 9.193-3.09.343a.5.5 0 0 1-.553-.553l.343-3.09 9.193-9.193Z M15.5 7.5l1 1',
      handler: () => {},
      variant: 'secondary'
    },
    {
      label: 'Archived',
      icon: 'M3 7h18 M16 3v4M8 3v4 M3 7h18v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z',
      handler: () => {},
      variant: 'secondary'
    }
  ]
})

// Tab state

// Tab state: click đổi tab, emit khi đổi
// Track whether we've initialized the tab once to avoid overwriting user's selection
const currentTab = ref<string | undefined>(props.tabs?.[0]?.value)
let tabInitialized = false
watch(
  () => props.tabs,
  (val) => {
    if (!tabInitialized && val?.length) {
      currentTab.value = val[0]?.value
      tabInitialized = true
    }
  },
  { immediate: true }
)
const onTabClick = (val: string) => {
  if (currentTab.value !== val) {
    currentTab.value = val
    emit('update:tab', val)
  }
}

const emit = defineEmits<{
  'update:q': [string]
  'update:rowSelection': [Record<string, boolean>]
  'update:pagination': [{ pageIndex: number, pageSize: number }]
  'update:tab': [string]
  'delete': [string[]]
  'reorder': [Array<Record<string, unknown>>]
  'row-copy-id': [string | number]
  'row-edit': [string | number]
  'row-delete': [string | number]
  'empty-action': []
}>()

/* filter + paging */
const filtered = computed(() =>
  (props.data || []).filter((item) => {
    const searchTerms = (props.q || '').toLowerCase()
    return props.columns.some((col) => {
      const value = item[col.key]
      return String(value || '').toLowerCase().includes(searchTerms)
    })
  })
)

// Server-side paging: data already corresponds to current page; still allow client filtering within current page
const pageItems = filtered

// Pagination footer helpers
const currentPage = computed(() => (props.pagination?.pageIndex ?? 0) + 1)
const totalPages = computed(() => props.totalPages ?? 1)
const totalRecords = computed(() => props.totalRecords ?? 0)
const canPrev = computed(() => (props.pagination?.pageIndex ?? 0) > 0)
const canNext = computed(() => currentPage.value < totalPages.value)
const goPrev = () => {
  if (!canPrev.value) return
  const next = { pageIndex: (props.pagination.pageIndex || 0) - 1, pageSize: props.pagination.pageSize }
  emit('update:pagination', next)
}
const goNext = () => {
  if (!canNext.value) return
  const next = { pageIndex: (props.pagination.pageIndex || 0) + 1, pageSize: props.pagination.pageSize }
  emit('update:pagination', next)
}

// Build a compact page list with ellipses: e.g., 1 … 4 5 6 … 12
const maxButtons = 5
const pageList = computed<(number | string)[]>(() => {
  const total = Math.max(1, totalPages.value)
  const cur = Math.min(Math.max(1, currentPage.value), total)
  const pages: (number | string)[] = []
  const add = (p: number | string) => pages.includes(p) || pages.push(p)
  if (total <= maxButtons + 2) {
    for (let i = 1; i <= total; i++) add(i)
    return pages
  }
  const range = Math.floor(maxButtons / 2)
  const start = Math.max(2, cur - range)
  const end = Math.min(total - 1, cur + range)
  add(1)
  if (start > 2) add('…')
  for (let i = start; i <= end; i++) add(i)
  if (end < total - 1) add('…')
  add(total)
  return pages
})

const gotoPage = (p: number) => {
  const clamped = Math.min(Math.max(1, p), totalPages.value)
  const next = { pageIndex: clamped - 1, pageSize: props.pagination.pageSize }
  emit('update:pagination', next)
}

const rangeFrom = computed(() => (currentPage.value - 1) * props.pagination.pageSize + (pageItems.value.length ? 1 : 0))
const rangeTo = computed(() => (currentPage.value - 1) * props.pagination.pageSize + pageItems.value.length)

// Skeleton rows count while loading
const skeletonRows = computed(() => {
  const size = props.pagination?.pageSize ?? 10
  return Math.min(Math.max(size, 5), 10)
})

// Provide varied widths for skeletons so UI looks natural
const skeletonWidths = ['75%', '55%', '85%', '65%', '45%', '70%', '60%', '80%', '50%', '40%']

// Draggable items local copy when dragging is enabled. We keep a local mutable copy
const draggableItems = ref<Record<string, unknown>[]>([])
if (props.draggable) {
  // initialize
  draggableItems.value = (pageItems.value || []).slice()
}

watch(filtered, (v) => {
  if (props.draggable) {
    // sync when source data changes
    draggableItems.value = (v || []).slice()
  }
})

/* selection */
const isSelected = (id: string | number) => !!props.rowSelection?.[String(id)]
const setRowSelected = (id: string | number, v: boolean) => {
  const next = { ...(props.rowSelection || {}) }
  next[String(id)] = v
  emit('update:rowSelection', next)
}
const selectedCount = computed(() => props.selectable ? Object.values(props.rowSelection || {}).filter(Boolean).length : 0)

type LooseRow = Record<string, unknown> & { id?: string | number }
const selectableItems = computed(() => ((pageItems.value as unknown) as LooseRow[]).filter(it => String(it.id) !== 'summary'))
const pageAllSelected = computed(() => selectableItems.value.length > 0 && selectableItems.value.every(it => isSelected(String(it.id))))
const pageSomeSelected = computed(() => selectableItems.value.some(it => isSelected(String(it.id))))
const selectAllState = computed<'none' | 'some' | 'all'>(() =>
  pageAllSelected.value ? 'all' : (pageSomeSelected.value ? 'some' : 'none')
)

const toggleAllPage = () => {
  if (!props.selectable) return
  const targetValue = !(selectAllState.value === 'all')
  const next = { ...(props.rowSelection || {}) }
  for (const it of pageItems.value) {
    if (String((it as LooseRow).id) === 'summary') continue
    next[String((it as LooseRow).id!)] = targetValue
  }
  emit('update:rowSelection', next)
}

/* navigation */
const onBodyClick = (e: Event) => {
  if (!props.rowClickEnabled || !props.rowClickHandler) return

  const t = e.target as HTMLElement
  if (t.closest('[data-role="chk"]') || t.closest('button') || t.closest('[role="button"]')) return
  const tr = t.closest('tbody tr') as HTMLTableRowElement | null
  if (!tr) return
  const idx = Array.from(tr.parentElement!.children).indexOf(tr)
  // choose the currently rendered array
  const itemsArray = props.draggable ? draggableItems.value : pageItems.value
  const item = itemsArray[idx]
  if (item && String((item as LooseRow).id) !== 'summary' && props.rowClickHandler) props.rowClickHandler(item)
}

const isDragging = ref(false)

const onDragStart = () => {
  isDragging.value = true
}

const onDragEnd = (event: SortableEvent) => {
  isDragging.value = false
  // Only emit reorder if the index changed
  if (event.oldIndex !== undefined && event.newIndex !== undefined && event.oldIndex !== event.newIndex) {
    // Emit the new order (array of items)
    emit('reorder', draggableItems.value.slice())
  }
}

const onCheckboxKey = (e: KeyboardEvent, handler: () => void) => {
  if (e.code === 'Space' || e.key === ' ') {
    e.preventDefault()
    handler()
  }
}

// Handle add button click
const handleAddClick = () => {
  if (props.addButton?.handler) {
    props.addButton.handler()
  } else if (props.addButton?.href) {
    navigateTo(props.addButton.href)
  }
}

// Get column value with custom render support
const getColumnValue = (item: Record<string, unknown>, column: TableColumn) => {
  if (column.render) {
    return column.render(item)
  }
  return item[column.key]
}

// Resolve text alignment utility based on column.align
const getAlignClass = (align?: 'left' | 'center' | 'right') => {
  switch (align) {
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    default:
      return 'text-left'
  }
}

// Align skeleton block within cell similar to text alignment
const getSkeletonBlockClass = (align?: 'left' | 'center' | 'right') => {
  switch (align) {
    case 'center':
      return 'mx-auto'
    case 'right':
      return 'ml-auto'
    default:
      return ''
  }
}

// Resolve effective alignment using either explicit column.align or class utilities
const getColumnAlign = (column: TableColumn): 'left' | 'center' | 'right' => {
  if (column.align) return column.align
  const cls = column.class || ''
  if (/text-right/.test(cls)) return 'right'
  if (/text-center/.test(cls)) return 'center'
  return 'left'
}

/* Row action menu helpers */
const rowMenuOpenId = ref<string | null>(null)
const toggleRowMenu = (id: string | number) => {
  const key = String(id)
  rowMenuOpenId.value = rowMenuOpenId.value === key ? null : key
}
const isRowMenuOpen = (id: string | number) => rowMenuOpenId.value === String(id)
const onRowCopyId = (item: Record<string, unknown>) => {
  const id = (item as LooseRow).id as string | number
  try {
    navigator.clipboard.writeText(String(id))
  } catch (e) {
    void e
  }
  emit('row-copy-id', id)
  rowMenuOpenId.value = null
}
const onRowEdit = (item: Record<string, unknown>) => {
  const id = (item as LooseRow).id as string | number
  emit('row-edit', id)
  rowMenuOpenId.value = null
}
const onRowDelete = (item: Record<string, unknown>) => {
  const id = (item as LooseRow).id as string | number
  emit('row-delete', id)
  rowMenuOpenId.value = null
}
</script>

<template>
  <div class="bg-white border-gray-200 relative">
    <!-- Tabs separate line (optional) -->
    <template v-if="tabsSeparateLine && props.tabs && props.tabs.length">
      <div class="px-6 pt-4">
        <div class="flex items-center gap-4">
          <div class="tab-scroll-wrapper flex-1 min-w-0 relative">
            <div class="absolute left-0 right-0 bottom-0 h-px bg-gray-200 pointer-events-none" />
            <div class="tab-scroll flex flex-nowrap gap-2 overflow-x-auto overflow-y-visible overscroll-x-contain pr-4" role="tablist">
              <template v-if="props.tabsStyle === 'underline'">
                <button
                  v-for="tab in props.tabs"
                  :key="tab.value"
                  :class="[
                    'tab-btn relative whitespace-nowrap px-2.5 py-1 font-medium text-base transition',
                    currentTab === tab.value ? 'text-primary-700' : 'text-gray-600 hover:text-gray-800'
                  ]"
                  type="button"
                  role="tab"
                  :aria-selected="currentTab === tab.value"
                  @click="onTabClick(tab.value)"
                >
                  <span class="inline-flex items-center">
                    {{ tab.label }}
                    <span v-if="typeof tab.count === 'number'" class="ml-1 text-xs bg-gray-200 rounded px-1.5">{{ tab.count }}</span>
                  </span>
                  <span
                    v-if="currentTab === tab.value"
                    class="absolute left-0 right-0 bottom-0 h-px bg-primary-600"
                  />
                </button>
              </template>
              <template v-else>
                <button
                  v-for="tab in props.tabs"
                  :key="tab.value"
                  :class="[
                    'tab-btn relative whitespace-nowrap px-3 py-1 rounded font-medium text-base transition',
                    currentTab === tab.value
                      ? 'active bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  ]"
                  type="button"
                  role="tab"
                  :aria-selected="currentTab === tab.value"
                  @click="onTabClick(tab.value)"
                >
                  <span class="inline-flex items-center">
                    {{ tab.label }}
                    <span v-if="typeof tab.count === 'number'" class="ml-1 text-xs bg-gray-200 rounded px-1.5">{{ tab.count }}</span>
                  </span>
                </button>
              </template>
            </div>
          </div>
          <!-- New slot for actions aligned with tabs line -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <slot name="tabs-line-actions" />
          </div>
        </div>
      </div>
      <!-- Optional filters row when tabs are separate -->
      <div v-if="$slots['filters-line']" class="px-6 pt-2">
        <slot name="filters-line" />
      </div>
    </template>
    <!-- Top bar -->
    <div :class="['flex items-center gap-3', props.headerPaddingX, 'py-3']">
      <h2 class="text-lg font-semibold flex-1 min-w-0">
        <div class="table-title-bar flex items-center gap-4 w-full">
          <template v-if="!tabsSeparateLine && props.tabs && props.tabs.length">
            <div class="tab-scroll-wrapper flex-1 min-w-0 relative">
              <div class="absolute left-0 right-0 bottom-0 h-px bg-gray-200 pointer-events-none" />
              <div class="tab-scroll flex flex-nowrap gap-2 overflow-x-auto overflow-y-visible overscroll-x-contain py-1 pr-4 -mb-1" role="tablist">
                <template v-if="props.tabsStyle === 'underline'">
                  <button
                    v-for="tab in props.tabs"
                    :key="tab.value"
                    :class="[
                      'tab-btn relative whitespace-nowrap px-2.5 py-1 font-medium text-base transition',
                      currentTab === tab.value ? 'text-primary-700' : 'text-gray-600 hover:text-gray-800'
                    ]"
                    type="button"
                    role="tab"
                    :aria-selected="currentTab === tab.value"
                    @click="onTabClick(tab.value)"
                  >
                    <span class="inline-flex items-center">
                      {{ tab.label }}
                      <span v-if="typeof tab.count === 'number'" class="ml-1 text-xs bg-gray-200 rounded px-1.5">{{ tab.count }}</span>
                    </span>
                    <span
                      v-if="currentTab === tab.value"
                      class="absolute left-0 right-0 bottom-0 h-px bg-primary-600"
                    />
                  </button>
                </template>
                <template v-else>
                  <button
                    v-for="tab in props.tabs"
                    :key="tab.value"
                    :class="[
                      'tab-btn relative whitespace-nowrap px-3 py-1 rounded font-medium text-base transition',
                      currentTab === tab.value
                        ? 'active bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    ]"
                    type="button"
                    role="tab"
                    :aria-selected="currentTab === tab.value"
                    @click="onTabClick(tab.value)"
                  >
                    <span class="inline-flex items-center">
                      {{ tab.label }}
                      <span v-if="typeof tab.count === 'number'" class="ml-1 text-xs bg-gray-200 rounded px-1.5">{{ tab.count }}</span>
                    </span>
                  </button>
                </template>
              </div>
            </div>
          </template>
          <template v-else>
            <div
              v-if="!props.hideTitle"
              class="flex-1 min-w-0 text-lg font-semibold truncate"
            >
              {{ props.title }}
            </div>
          </template>
        </div>
      </h2>
      <div class="flex items-center gap-2 flex-shrink-0">
        <slot name="table-actions" />
      </div>

      <div class="flex items-center gap-3">
        <button
          v-if="showFilter"
          class="h-9 w-9 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          style="aspect-ratio: 1 / 1 !important;"
          title="Filter"
          aria-label="Filter"
        >
          <svg
            class="w-4 h-4 text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 3h12v4l-4 4v8l-4-2v-6l-4-4V3z" />
          </svg>
        </button>

        <div v-if="!props.hideSearch" class="relative w-full max-w-xs">
          <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            :placeholder="searchPlaceholder"
            class="h-9 w-full pl-9 pr-3 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-0 text-sm"
            :value="q"
            @input="$emit('update:q', ($event.target as HTMLInputElement).value)"
          >
        </div>

        <slot name="search-actions">
          <template v-if="addButtonDropdownItems && addButtonDropdownItems.length">
            <UDropdownMenu :items="(addButtonDropdownItems as any)" :popper="{ placement: 'bottom-end' }">
              <UButton
                label="Thêm widget"
                color="primary"
                variant="solid"
                icon="i-lucide-plus"
                class="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-[#1b64f2] hover:bg-[#155ae0] text-white font-medium whitespace-nowrap text-sm"
              />
            </UDropdownMenu>
          </template>
          <button
            v-else-if="addButton"
            class="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white font-medium whitespace-nowrap text-sm"
            type="button"
            @click="handleAddClick"
          >
            {{ addButton.label }}
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </slot>
      </div>
    </div>
    <!-- Filters line when tabs are inline (not separate) -->
    <div v-if="!tabsSeparateLine && $slots['filters-line']" class="px-6 -mt-3 mb-2">
      <slot name="filters-line" />
    </div>

    <div v-if="selectedCount === 0 && props.selectable" class="border-t border-gray-200" />

    <!-- Selection toolbar -->
    <div
      v-if="props.selectable && selectedCount > 0"
      :class="['bg-white border-t border-gray-200', props.headerPaddingX]"
    >
      <div class="flex items-center h-14">
        <div class="w-14 h-full flex items-center justify-start">
          <button
            type="button"
            class="inline-flex items-center justify-center h-5 w-5 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-1
                   bg-[#1b64f2] border-[#1b64f2] text-white"
            aria-label="Toggle all on page"
            @click="toggleAllPage"
          >
            <svg
              v-if="selectAllState!=='all'"
              class="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
            >
              <path d="M5 12h14" />
            </svg>
            <svg
              v-else
              class="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>

        <span class="text-sm font-medium ml-0">{{ selectedCount }} đã chọn</span>

        <div class="flex items-center gap-2 ml-6">
          <button
            v-for="action in actions"
            :key="action.label"
            type="button"
            class="h-8 inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 text-sm bg-white hover:bg-gray-50"
            @click="action.handler(Object.keys(rowSelection).filter(id => rowSelection[id]))"
          >
            {{ action.label }}
            <svg
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path :d="action.icon" />
            </svg>
          </button>

          <!-- Delete button -->
          <button
            type="button"
            class="h-8 inline-flex items-center gap-2 rounded-md border border-red-300 px-3 text-sm bg-white hover:bg-red-50 text-red-600"
            @click="() => { emit('delete', Object.keys(rowSelection).filter(id => rowSelection[id])); emit('update:rowSelection', {}); }"
          >
            Delete ({{ selectedCount }})
            <svg
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div
      :class="[props.bodyPadding, 'overflow-x-auto']"
    >
      <!-- Empty state -->
      <div v-if="!loading && (pageItems.length === 0)" class="py-10">
        <TableEmptyState
          :title="props.emptyTitle"
          :description="props.emptyDescription"
          :action-label="props.emptyActionLabel"
          :action-icon="props.emptyActionIcon"
          @action="$emit('empty-action')"
        />
      </div>

      <div
        v-else
        @click="onBodyClick"
      >
        <table class="w-full min-w-[64rem] table-fixed text-sm">
          <colgroup>
            <col v-if="props.selectable" class="w-14">
            <template v-if="props.colWidths && props.colWidths.length === columns.length">
              <col
                v-for="(w, idx) in props.colWidths"
                :key="'colw'+idx"
                :style="w ? { width: w } : undefined"
              >
            </template>
            <template v-else>
              <col
                v-for="(column, index) in columns"
                :key="column.key"
                :class="[
                  index === 0 ? 'min-w-[300px]' : '',
                  index === 1 ? 'w-[150px]' : '',
                  index === 2 ? 'w-[120px]' : '',
                  index === 3 ? 'w-[100px]' : '',
                  index === 4 ? 'w-[120px]' : '',
                  index >= 5 ? 'w-[100px]' : ''
                ]"
              >
            </template>
            <col v-if="props.showRowActions" class="w-[60px]">
          </colgroup>
          <thead class="text-gray-500">
            <tr class="h-14" :class="{ hidden: selectedCount > 0 }">
              <th v-if="props.selectable" class="py-0">
                <div class="w-14 h-full flex items-center justify-start">
                  <button
                    data-role="chk"
                    type="button"
                    role="checkbox"
                    :aria-checked="selectAllState==='all' ? 'true' : (selectAllState==='some' ? 'mixed' : 'false')"
                    :title="selectAllState==='all' ? 'Unselect all' : 'Select all'"
                    :class="[
                      'inline-flex items-center justify-center h-5 w-5 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-1',
                      selectAllState==='none'
                        ? 'bg-white border-gray-300 text-gray-400 focus:ring-blue-400'
                        : 'bg-[#1b64f2] border-[#1b64f2] text-white focus:ring-blue-400'
                    ]"
                    @click="toggleAllPage"
                    @keydown="onCheckboxKey($event, toggleAllPage)"
                  >
                    <svg
                      v-if="selectAllState==='all'"
                      class="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <svg
                      v-else-if="selectAllState==='some'"
                      class="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                    >
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                </div>
              </th>
              <th
                v-for="column in columns"
                :key="column.key"
                :class="[column.class || '', 'py-3 font-medium', getAlignClass(column.align)]"
              >
                {{ column.label }}
              </th>
              <th v-if="props.showRowActions" class="py-3 text-left font-medium pr-4">
                <!-- Cột actions -->
              </th>
            </tr>
          </thead>

          <!-- Loading skeleton -->
          <tbody v-if="loading">
            <tr
              v-for="n in skeletonRows"
              :key="`skeleton-${n}`"
              class="border-t border-gray-200"
            >
              <!-- Checkbox cell placeholder -->
              <td v-if="props.selectable" class="py-4 align-middle">
                <div class="w-14 h-full flex items-center">
                  <div class="h-5 w-5 rounded-md bg-gray-200 animate-pulse" aria-hidden="true" />
                </div>
              </td>

              <!-- Column placeholders -->
              <td
                v-for="(column, cIdx) in columns"
                :key="`scol-${column.key}-${cIdx}`"
                :class="['py-4', getAlignClass(getColumnAlign(column))]"
              >
                <div
                  :class="['h-4 rounded bg-gray-200 animate-pulse', getSkeletonBlockClass(getColumnAlign(column))]"
                  :style="{ width: skeletonWidths[cIdx % skeletonWidths.length] }"
                  aria-hidden="true"
                />
              </td>

              <!-- Actions cell placeholder -->
              <td v-if="props.showRowActions" class="py-4 pr-4">
                <div class="flex justify-end">
                  <div class="h-5 w-5 rounded-md bg-gray-200 animate-pulse" aria-hidden="true" />
                </div>
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="!props.draggable">
            <tr
              v-for="item in pageItems"
              :key="String(item.id)"
              class="group/row border-t border-gray-200 row-band"
              :class="{ 'is-active': isSelected(String(item.id)) }"
            >
              <!-- Row checkbox -->
              <td v-if="props.selectable" class="py-4 align-middle">
                <div class="w-14 h-full flex items-center justify-start">
                  <button
                    v-if="String(item.id) !== 'summary'"
                    data-role="chk"
                    type="button"
                    role="checkbox"
                    :aria-checked="isSelected(String(item.id)) ? 'true' : 'false'"
                    :class="[
                      'inline-flex items-center justify-center h-5 w-5 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-1',
                      isSelected(String(item.id))
                        ? 'bg-[#1b64f2] border-[#1b64f2] text-white focus:ring-blue-400'
                        : 'bg-white border-gray-300 text-gray-400 focus:ring-blue-400'
                    ]"
                    @click="setRowSelected(String(item.id), !isSelected(String(item.id)))"
                    @keydown="onCheckboxKey($event, () => setRowSelected(String(item.id), !isSelected(String(item.id))))"
                  >
                    <svg
                      v-if="isSelected(String(item.id))"
                      class="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                </div>
              </td>

              <!-- Dynamic columns -->
              <td
                v-for="column in columns"
                :key="column.key"
                :class="['py-4', getAlignClass(column.align)]"
              >
                <slot
                  :name="`column-${column.key}`"
                  :item="item"
                  :value="getColumnValue(item, column)"
                >
                  <!-- Default rendering -->
                  <template v-if="column.render">
                    <component
                      :is="column.render(item)"
                    />
                  </template>
                  <template v-else>
                    {{ getColumnValue(item, column) }}
                  </template>
                </slot>
              </td>

              <!-- actions -->
              <td v-if="props.showRowActions" class="py-4 pr-4">
                <div class="flex justify-end">
                  <template v-if="String(item.id) !== 'summary'">
                    <slot name="row-actions" :item="item">
                      <div class="relative inline-block text-left">
                        <button
                          type="button"
                          class="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
                          @click.stop="toggleRowMenu(item.id as string | number)"
                        >
                          <svg
                            class="w-5 h-5 text-gray-700"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <circle cx="12" cy="6" r="1" />
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="18" r="1" />
                          </svg>
                        </button>
                        <div
                          v-if="isRowMenuOpen(item.id as string | number)"
                          class="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white z-50 ring-black ring-opacity-5"
                        >
                          <div class="py-1">
                            <button
                              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              @click.stop="onRowCopyId(item)"
                            >
                              Copy ID
                            </button>
                            <button
                              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              @click.stop="onRowEdit(item)"
                            >
                              Sửa
                            </button>
                            <button
                              class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              @click.stop="onRowDelete(item)"
                            >
                              Xoá
                            </button>
                          </div>
                        </div>
                      </div>
                    </slot>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>

          <VueDraggable
            v-if="!loading && props.draggable"
            v-model="draggableItems"
            tag="tbody"
            :handle="'.' + (props.dragHandleClass || 'drag-handle')"
            :ghost-class="'ghost'"
            :chosen-class="'chosen'"
            :drag-class="'drag'"
            :animation="props.dragAnimation || 300"
            class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
            @start="onDragStart"
            @end="onDragEnd"
          >
            <tr
              v-for="item in draggableItems"
              :key="String(item.id)"
              class="group/row border-t border-gray-200 row-band"
              :class="{ 'is-active': isSelected(String(item.id)), 'opacity-60': isDragging }"
            >
              <!-- Row checkbox -->
              <td v-if="props.selectable" class="py-4 align-middle">
                <div class="w-14 h-full flex items-center justify-start">
                  <button
                    v-if="String(item.id) !== 'summary'"
                    data-role="chk"
                    type="button"
                    role="checkbox"
                    :aria-checked="isSelected(String(item.id)) ? 'true' : 'false'"
                    :class="[
                      'inline-flex items-center justify-center h-5 w-5 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-1',
                      isSelected(String(item.id))
                        ? 'bg-[#1b64f2] border-[#1b64f2] text-white focus:ring-blue-400'
                        : 'bg-white border-gray-300 text-gray-400 focus:ring-blue-400'
                    ]"
                    @click="setRowSelected(String(item.id), !isSelected(String(item.id)))"
                    @keydown="onCheckboxKey($event, () => setRowSelected(String(item.id), !isSelected(String(item.id))))"
                  >
                    <svg
                      v-if="isSelected(String(item.id))"
                      class="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                </div>
              </td>

              <!-- Dynamic columns -->
              <td
                v-for="column in columns"
                :key="column.key"
                :class="['py-4', getAlignClass(column.align)]"
              >
                <slot
                  :name="`column-${column.key}`"
                  :item="item"
                  :value="getColumnValue(item, column)"
                >
                  <!-- Default rendering -->
                  <template v-if="column.render">
                    <component
                      :is="column.render(item)"
                    />
                  </template>
                  <template v-else>
                    {{ getColumnValue(item, column) }}
                  </template>
                </slot>
              </td>

              <!-- actions -->
              <td v-if="props.showRowActions" class="py-4 pr-4">
                <div class="flex justify-end">
                  <template v-if="String(item.id) !== 'summary'">
                    <slot name="row-actions" :item="item">
                      <div class="relative inline-block text-left">
                        <button
                          type="button"
                          class="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
                          @click.stop="toggleRowMenu(item.id as string | number)"
                        >
                          <svg
                            class="w-5 h-5 text-gray-700"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <circle cx="12" cy="6" r="1" />
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="18" r="1" />
                          </svg>
                        </button>
                        <div
                          v-if="isRowMenuOpen(item.id as string | number)"
                          class="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white z-50 ring-1 ring-black ring-opacity-5"
                        >
                          <div class="py-1">
                            <button
                              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              @click.stop="onRowCopyId(item)"
                            >
                              Copy ID
                            </button>
                            <button
                              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              @click.stop="onRowEdit(item)"
                            >
                              Sửa
                            </button>
                            <button
                              class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              @click.stop="onRowDelete(item)"
                            >
                              Xoá
                            </button>
                          </div>
                        </div>
                      </div>
                    </slot>
                  </template>
                </div>
              </td>
            </tr>
          </VueDraggable>
        </table>
      </div>

      <div class="h-6 border-t border-gray-200" />
    </div>

    <!-- Footer -->
    <div :class="['flex items-center justify-between', props.footerPadding]">
      <slot name="header-actions" />
      <div class="flex w-full items-center justify-between text-sm text-gray-600">
        <span v-if="totalRecords">Hiển thị {{ rangeFrom }}–{{ rangeTo }} trên {{ totalRecords }}</span>
        <nav class="flex items-center gap-1 ml-auto" aria-label="Pagination">
          <button
            v-if="canPrev"
            type="button"
            class="h-8 w-8 inline-flex items-center justify-center rounded-full bg-white hover:bg-gray-50 disabled:opacity-50"
            aria-label="Trang trước"
            @click="goPrev"
          >
            <svg
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            v-for="p in pageList"
            :key="`p-${p}`"
            type="button"
            :disabled="p==='…'"
            :class="[
              'h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-full border text-sm',
              p===currentPage
                ? 'bg-primary-600 border-primary-600 text-white hover:bg-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            ]"
            @click="p!=='…' && gotoPage(p as number)"
          >
            {{ p }}
          </button>
          <button
            v-if="canNext"
            type="button"
            class="h-8 w-8 inline-flex items-center justify-center rounded-full bg-white hover:bg-gray-50 disabled:opacity-50"
            aria-label="Trang sau"
            @click="goNext"
          >
            <svg
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<style scoped>
.row-band:hover,
.row-band.is-active{
  /* 270deg: trái -> phải (giữa đậm #f9f8f7) */
  background-image: linear-gradient(
    270deg,
    rgba(255, 255, 255, 0) 0%,
    #f9f8f7 25%,
    #f9f8f7 71%,
    rgba(255, 255, 255, 0) 100%
  );
}
.row-band{
  transition: background-image .2s ease;
}

/* Vue Draggable Plus CSS Classes (copied from links page for consistent visuals) */
.ghost {
  opacity: 0.5;
  background: #f3f4f6;
  transform: rotate(2deg);
}

.chosen {
  opacity: 0.8;
  background: #e5e7eb;
}

.drag {
  opacity: 0.9;
  background: #ddd6fe;
  transform: rotate(-2deg);
  transition: all 0.3s ease;
}

/* Smooth animations and sortable classes */
tbody tr {
  transition: all 0.3s ease;
}

tbody tr.sortable-ghost {
  opacity: 0.4;
  background: #f3f4f6;
}

tbody tr.sortable-chosen {
  background: #e5e7eb;
}

tbody tr.sortable-drag {
  background: #ddd6fe;
  transform: rotate(1deg);
}

.tab-scroll-wrapper {
  min-width: 0;
}

.tab-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
  touch-action: pan-x;
  scroll-snap-type: x proximity;
}

.tab-scroll::-webkit-scrollbar {
  display: none;
}

/* Tab styles */
.tab-btn {
  outline: none;
  border: none;
  background: none;
  cursor: pointer;
  position: relative;
  scroll-snap-align: start;
}
.tab-btn.active,
.tab-btn.bg-primary-50 {
  font-weight: 600;
}
.tab-btn.active {
  color: var(--color-blue-700) !important;
}
.tab-btn.active::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -1px; /* aligned with baseline */
  height: 2px;
  background: var(--color-blue-600, #1b64f2);
  border-radius: 1px 1px 0 0;
}
.tab-btn:focus {
  box-shadow: 0 0 0 2px #1b64f233;
}
</style>
