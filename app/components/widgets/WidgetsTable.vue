<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import type { WidgetInstance } from '@/composables/useWidgets'

interface Props {
  data: WidgetInstance[]
  loading: boolean
  q: string
  rowSelection: Record<string, boolean>
  getRowItems: (row: any) => unknown[]
  formatDate: (date: string | null) => string
  addButtonDropdownItems?: any[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:q': [string]
  'update:rowSelection': [Record<string, boolean>]
  'reorder': [Array<Record<string, unknown>>]
}>()

const columns: TableColumn[] = [
  { key: 'name', label: 'Tên widget', class: 'py-3 text-left font-medium' },
  { key: 'widgetType', label: 'Loại widget', class: 'py-3 text-left font-medium' },
  { key: 'widgetZone', label: 'Vị trí', class: 'py-3 text-left font-medium' },
  { key: 'publishStart', label: 'Bắt đầu', class: 'py-3 text-left font-medium' },
  { key: 'publishEnd', label: 'Kết thúc', class: 'py-3 text-left font-medium' }
]

const colWidths = [
  '28%', // name
  '18%', // widgetType
  '18%', // widgetZone
  '18%', // publishStart
  '18%' // publishEnd
]

// Row click navigation removed — clicking a row will no longer navigate
</script>

<template>
  <BaseTable
    :q="q"
    :row-selection="rowSelection"

    :data="data as unknown as Record<string, unknown>[]"
    :loading="loading"
    title="Danh sách widget"
    :columns="columns"
    :col-widths="colWidths"
    :add-button-dropdown-items="addButtonDropdownItems"
    search-placeholder="Tìm kiếm widget..."
    :draggable="true"
    drag-handle-class="drag-handle"
    :drag-animation="200"
    @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)"
    @reorder="(newOrder) => emit('reorder', newOrder)"
  >
    <template #column-name="{ value }">
      <div class="flex items-center">
        <div class="drag-handle mr-3 cursor-move" title="Kéo để di chuyển">
          <svg
            class="w-4 h-4 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="5" cy="5" r="2" />
            <circle cx="5" cy="10" r="2" />
            <circle cx="5" cy="15" r="2" />
            <circle cx="10" cy="5" r="2" />
            <circle cx="10" cy="10" r="2" />
            <circle cx="10" cy="15" r="2" />
          </svg>
        </div>
        <span class="font-semibold text-[15px]">{{ value }}</span>
      </div>
    </template>
    <template #column-publishStart="{ item }">
      <span>{{ props.formatDate((item as unknown as WidgetInstance).publishStart) }}</span>
    </template>
    <template #column-publishEnd="{ item }">
      <span>{{ props.formatDate((item as unknown as WidgetInstance).publishEnd) }}</span>
    </template>
    <template #row-actions="{ item }">
      <span v-for="action in props.getRowItems({ original: item as unknown as WidgetInstance }) as any[]" :key="action.label">
        <button
          v-if="action && action.type !== 'label' && action.type !== 'separator'"
          class="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 mr-2"
          :title="action.label"
          @click="action.onSelect"
        >
          <UIcon :name="action.icon" class="w-5 h-5 text-gray-500" />
        </button>
      </span>
    </template>
  </BaseTable>
</template>
