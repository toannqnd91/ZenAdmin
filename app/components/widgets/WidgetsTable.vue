<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import type { WidgetInstance } from '@/composables/useWidgets'

interface Props {
  data: WidgetInstance[]
  loading: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
  getRowItems: (row: any) => unknown[]
  formatDate: (date: string | null) => string
  addButtonDropdownItems?: any[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:q': [string]
  'update:rowSelection': [Record<string, boolean>]
  'update:pagination': [{ pageIndex: number, pageSize: number }]
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
  '18%'  // publishEnd
]

const handleRowClick = (item: WidgetInstance) => {
  navigateTo(`/widgets/${item.id}/update`)
}
</script>

<template>
  <BaseTable
    :q="q"
    :row-selection="rowSelection"
    :pagination="pagination"
    :data="data"
    :loading="loading"
    title="Danh sách widget"
    :columns="columns"
    :col-widths="colWidths"
    :add-button-dropdown-items="addButtonDropdownItems"
    search-placeholder="Tìm kiếm widget..."
    :row-click-handler="handleRowClick"
    @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)"
  >
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
