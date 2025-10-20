<script setup lang="ts">
import BaseTable from '@/components/base/BaseTable.vue'

interface DamageItemRow {
  id: string | number
  code: string
  date: string
  warehouseName: string
  statusLabel: string
  approvedOn: string
  createdByName: string
}

interface TableTab {
  label: string
  value: string
  count?: number
}
interface AddButton {
  label: string
  href?: string
  handler?: () => void
}

const props = defineProps<{
  data: DamageItemRow[]
  loading?: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
  tabs?: TableTab[]
  totalRecords?: number
  totalPages?: number
  addButton?: AddButton
}>()

const emit = defineEmits<{
  'update:q': [string]
  'update:row-selection': [Record<string, boolean>]
  'update:pagination': [{ pageIndex: number, pageSize: number }]
  'update:tab': [string]
  'navigate-code': [string]
}>()

const columns = [
  { key: 'code', label: 'Mã phiếu hủy', sortable: true },
  { key: 'date', label: 'Ngày tạo', sortable: true },
  { key: 'warehouseName', label: 'Chi nhánh', sortable: true },
  { key: 'statusLabel', label: 'Trạng thái', sortable: true },
  { key: 'approvedOn', label: 'Ngày duyệt', sortable: true },
  { key: 'createdByName', label: 'Người tạo', sortable: true }
]
const colWidths = [
  '160px', // code
  '170px', // date
  '200px', // warehouse
  '140px', // status
  '170px', // approved
  '180px' // created by
]

function statusPillClass(label: string) {
  const key = (label || '').toLowerCase()
  if (key.includes('đang') || key.includes('processing')) {
    return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'
  }
  if (key.includes('hoàn thành') || key.includes('approved') || key.includes('complete')) {
    return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200'
  }
  return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200'
}
</script>

<template>
  <BaseTable
    :data="(props.data as unknown as Record<string, unknown>[])"
    :loading="props.loading"
    :q="props.q"
    :row-selection="props.rowSelection"
    :pagination="props.pagination"
    :columns="columns"
    :col-widths="colWidths"
    title="Phiếu hủy hàng"
    hide-title
    :tabs="props.tabs"
    tabs-style="underline"
    tabs-separate-line
    :total-pages="props.totalPages"
    :total-records="props.totalRecords"
    :add-button="props.addButton"
    :show-row-actions="false"
    :selectable="true"
    :show-filter="false"
    body-padding="px-6"
    header-padding-x="px-6"
    footer-padding="px-6 pb-4"
    search-placeholder="Tìm mã phiếu, chi nhánh"
    hide-search
    @update:q="val => emit('update:q', val)"
    @update:row-selection="val => emit('update:row-selection', val)"
    @update:pagination="val => emit('update:pagination', val)"
    @update:tab="val => emit('update:tab', val)"
  >
    <template #filters-line>
      <slot name="filters-line" />
    </template>
    <template #tabs-line-actions>
      <slot name="tabs-line-actions" />
    </template>
    <template #column-code="{ value, item }">
      <button
        class="text-primary-600 font-medium hover:underline"
        type="button"
        @click="emit('navigate-code', (item as any).code as string)"
      >
        {{ value }}
      </button>
    </template>
    <template #column-statusLabel="{ value }">
      <span :class="statusPillClass(String(value || ''))">{{ value }}</span>
    </template>
  </BaseTable>
</template>
