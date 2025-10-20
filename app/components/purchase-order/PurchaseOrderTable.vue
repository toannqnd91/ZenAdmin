<script setup lang="ts">
import BaseTable from '@/components/base/BaseTable.vue'

interface PurchaseOrderRow {
  id: string | number
  code: string
  date: string
  branchName: string
  statusLabel: string
  receiveStatus: string
  supplierName: string
  createdByName: string
  totalQuantity: number
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
  { key: 'code', label: 'Mã đơn nhập', sortable: true },
  { key: 'branchName', label: 'Chi nhánh nhập', sortable: true },
  { key: 'statusLabel', label: 'Trạng thái', sortable: true },
  { key: 'receiveStatus', label: 'Trạng thái nhập', sortable: true },
  { key: 'supplierName', label: 'Nhà cung cấp', sortable: true },
  { key: 'createdByName', label: 'Nhân viên tạo', sortable: true },
  { key: 'totalQuantity', label: 'Số lượng nhập', sortable: true, align: 'right' as const },
  { key: 'total', label: 'Giá trị đơn', sortable: true, align: 'right' as const }
]
const colWidths = [
  '100px', // Mã đơn (kèm ngày tạo bên dưới)
  '120px', // Chi nhánh nhập
  '120px', // Trạng thái
  '120px', // Trạng thái nhập
  '100px', // Nhà cung cấp
  '100px', // Nhân viên tạo
  '100px', // Số lượng nhập
  '100px' // Giá trị đơn
]

function formatMoney(v: number | string) {
  if (v == null || v === '') return ''
  const num = typeof v === 'string' ? Number(v) : v
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(num) + 'đ'
}

function statusPillClass(label: string) {
  const key = (label || '').toLowerCase()
  if (key.includes('giao dịch') || key.includes('processing')) {
    return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'
  }
  if (key.includes('hoàn thành') || key.includes('complete')) {
    return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200'
  }
  return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200'
}

function receivePillClass(label: string) {
  const key = (label || '').toLowerCase()
  if (key.includes('chưa nhập') || key.includes('not') || key.includes('pending')) {
    return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200'
  }
  if (key.includes('đã nhập') || key.includes('received')) {
    return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200'
  }
  if (key.includes('một phần') || key.includes('partial')) {
    return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200'
  }
  return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200'
}

function formatNumber(v: number | string) {
  if (v == null || v === '') return ''
  const num = typeof v === 'string' ? Number(v) : v
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(num)
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
      <div class="flex flex-col">
        <button
          class="text-primary-600 font-medium hover:underline text-left"
          type="button"
          @click="emit('navigate-code', (item as any).code as string)"
        >
          #{{ value }}
        </button>
        <span v-if="(item as any).date" class="text-xs text-gray-500 mt-0.5">{{ (item as any).date }}</span>
      </div>
    </template>
    <template #column-statusLabel="{ value }">
      <span :class="statusPillClass(String(value || ''))">{{ value }}</span>
    </template>
    <template #column-receiveStatus="{ value }">
      <span :class="receivePillClass(String(value || ''))">{{ value }}</span>
    </template>
    <template #column-totalQuantity="{ value }">
      <span class="tabular-nums">{{ formatNumber(value as string | number) }}</span>
    </template>
    <template #column-total="{ value }">
      <span class="font-semibold tabular-nums text-sky-700">
        {{ formatMoney(value as string | number) }}
      </span>
    </template>
  </BaseTable>
</template>
