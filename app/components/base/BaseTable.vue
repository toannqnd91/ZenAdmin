<script setup lang="ts">
import { computed } from 'vue'

export interface TableColumn {
  key: string
  label: string
  class?: string
  sortable?: boolean
  render?: (item: Record<string, unknown>) => unknown
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

  // Configuration
  title: string
  columns: TableColumn[]
  addButton?: AddButton
  addButtonDropdownItems?: any[]
  actions?: TableAction[]

  // Row actions
  rowClickEnabled?: boolean
  rowClickHandler?: (item: Record<string, unknown>) => void

  // Styling
  showFilter?: boolean
  searchPlaceholder?: string

  // Colgroup widths
  colWidths?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  rowClickEnabled: true,
  showFilter: true,
  searchPlaceholder: 'Tìm kiếm...',
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

const emit = defineEmits<{
  'update:q': [string]
  'update:rowSelection': [Record<string, boolean>]
  'update:pagination': [{ pageIndex: number, pageSize: number }]
  'delete': [string[]]
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

// const start = computed(() => props.pagination.pageIndex * props.pagination.pageSize)
// const end = computed(() => start.value + props.pagination.pageSize)
// const pageItems = computed(() => filtered.value.slice(start.value, end.value))
const pageItems = filtered // Hiển thị tất cả rows

/* selection */
const isSelected = (id: string | number) => !!props.rowSelection?.[String(id)]
const setRowSelected = (id: string | number, v: boolean) => {
  const next = { ...(props.rowSelection || {}) }
  next[String(id)] = v
  emit('update:rowSelection', next)
}
const selectedCount = computed(() => Object.values(props.rowSelection || {}).filter(Boolean).length)

const pageAllSelected = computed(() => pageItems.value.length > 0 && pageItems.value.every(it => isSelected(it.id)))
const pageSomeSelected = computed(() => pageItems.value.some(it => isSelected(it.id)))
const selectAllState = computed<'none' | 'some' | 'all'>(() =>
  pageAllSelected.value ? 'all' : (pageSomeSelected.value ? 'some' : 'none')
)

const toggleAllPage = () => {
  const targetValue = !(selectAllState.value === 'all')
  const next = { ...(props.rowSelection || {}) }
  for (const it of pageItems.value) next[String(it.id)] = targetValue
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
  const item = pageItems.value[idx]
  if (item && props.rowClickHandler) props.rowClickHandler(item)
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
</script>

<template>
  <div class="bg-white border-gray-200 relative">
    <!-- Top bar -->
    <div class="flex items-center justify-between gap-3 px-6 py-5">
      <h2 class="text-lg font-semibold">
        {{ title }}
      </h2>

      <div class="flex items-center gap-3">
        <button
          v-if="showFilter"
          class="h-9 w-9 inline-flex items-center justify-center rounded-md
                  border border-gray-300 bg-white hover:bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-blue-400"
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

        <div class="relative w-full max-w-xs">
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

        <template v-if="addButtonDropdownItems && addButtonDropdownItems.length">
          <UDropdownMenu :items="addButtonDropdownItems" :popper="{ placement: 'bottom-end' }">
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
          class="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-[#1b64f2] hover:bg-[#155ae0] text-white font-medium whitespace-nowrap text-sm"
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
      </div>
    </div>

    <div v-if="selectedCount === 0" class="border-t border-gray-200" />

    <!-- Selection toolbar -->
    <div
      v-if="selectedCount > 0"
      class="bg-white border-t border-gray-200 px-6"
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
            @click="emit('delete', Object.keys(rowSelection).filter(id => rowSelection[id]))"
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
      class="px-6"
      @click="onBodyClick"
    >
      <table class="w-full table-fixed text-sm">
        <colgroup>
          <col class="w-14">
          <template v-if="props.colWidths && props.colWidths.length === columns.length">
            <col v-for="(w, idx) in props.colWidths" :key="'colw'+idx" :style="{ width: w }" />
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
          <col class="w-[60px]">
        </colgroup>
        <thead class="text-gray-500">
          <tr class="h-14" :class="{ hidden: selectedCount > 0 }">
            <th class="py-0">
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
              :class="column.class || 'py-3 text-left font-medium'"
            >
              {{ column.label }}
            </th>
            <th class="py-3 text-left font-medium pr-4">
              <!-- Cột actions -->
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in pageItems"
            :key="String(item.id)"
            class="group/row border-t border-gray-200 row-band"
            :class="{ 'is-active': isSelected(String(item.id)) }"
          >
            <!-- Row checkbox -->
            <td class="py-4 align-middle">
              <div class="w-14 h-full flex items-center justify-start">
                <button
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
              class="py-4"
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
            <td class="py-4 pr-4">
              <div class="flex justify-end">
                <slot
                  name="row-actions"
                  :item="item"
                >
                  <button
                    type="button"
                    class="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
                    @click.stop
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
                </slot>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="h-6 border-t border-gray-200" />
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-end px-6 pb-4">
      <slot name="header-actions" />
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
</style>
