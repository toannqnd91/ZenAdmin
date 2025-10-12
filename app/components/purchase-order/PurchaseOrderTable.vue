<script setup lang="ts">
import BaseTable from '@/components/base/BaseTable.vue'

interface PurchaseOrderRow {
  id: string | number
  code: string
  date: string
  supplier: string
  status: string
  total: number
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
  data: PurchaseOrderRow[]
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
  { key: 'code', label: 'Mã đơn', sortable: true },
  { key: 'date', label: 'Ngày', sortable: true },
  { key: 'supplier', label: 'Nhà cung cấp', sortable: true },
  { key: 'status', label: 'Trạng thái', sortable: true },
  { key: 'total', label: 'Tổng tiền', sortable: true }
]
const colWidths = [
  '140px', // code
  '150px', // date
  '200px', // supplier
  '140px', // status
  '160px' // total
]

function formatMoney(v: number | string) {
  if (v == null || v === '') return ''
  const num = typeof v === 'string' ? Number(v) : v
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(num) + 'đ'
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
    title="Đơn mua hàng"
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
    search-placeholder="Tìm mã đơn, nhà cung cấp"
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
    <template #column-total="{ value }">
      <span class="font-semibold tabular-nums text-sky-700">
        {{ formatMoney(value as string | number) }}
      </span>
    </template>
  </BaseTable>
</template>
