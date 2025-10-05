<script setup lang="ts">
import BaseTable from '@/components/base/BaseTable.vue'

interface CashFlowRow {
  id: string | number
  code: string
  date: string
  partnerName: string
  reason: string
  originalDoc: string
  amount: number // positive receipt, negative payment
}

interface CashFlowTab {
  label: string
  value: string
  count?: number
}

// Mirror BaseTable AddButton interface for pass-through
interface AddButton {
  label: string
  href?: string
  handler?: () => void
}

const props = defineProps<{
  data: CashFlowRow[]
  loading?: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
  tabs?: CashFlowTab[]
  totalRecords?: number
  totalPages?: number
  addButton?: AddButton
}>()

const emit = defineEmits<{
  'update:q': [string]
  'update:rowSelection': [Record<string, boolean>]
  'update:pagination': [{ pageIndex: number, pageSize: number }]
  'update:tab': [string]
  'navigate-code': [string]
}>()

// Table columns definition
const columns = [
  { key: 'code', label: 'Mã phiếu', sortable: true },
  { key: 'date', label: 'Ngày ghi nhận', sortable: true },
  { key: 'partnerName', label: 'Tên đối tượng', sortable: true },
  { key: 'reason', label: 'Lý do thu chi', sortable: true },
  { key: 'originalDoc', label: 'Mã chứng từ gốc', sortable: true },
  { key: 'amount', label: 'Số tiền', sortable: true }
]

// Emit handlers (wrapper to avoid TS template inference complaints)
function onUpdateQ(val: string) {
  emit('update:q', val)
}
function onUpdateRowSelection(val: Record<string, boolean>) {
  emit('update:rowSelection', val)
}
function onUpdatePagination(val: { pageIndex: number, pageSize: number }) {
  emit('update:pagination', val)
}
function onUpdateTab(val: string) {
  emit('update:tab', val)
}

// Similar explicit widths style as Orders table for consistent layout
const colWidths = [
  '140px', // code
  '150px', // date
  '200px', // partner
  '240px', // reason
  '160px', // original doc
  '140px' // amount
]
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
    title="Sổ quỹ"
    hide-title
    :tabs="props.tabs"
    tabs-style="underline"
    tabs-separate-line
    :total-pages="props.totalPages"
    :total-records="props.totalRecords"
    :show-row-actions="false"
    :selectable="true"
    :show-filter="false"
    body-padding="px-6"
    header-padding-x="px-6"
    footer-padding="px-6 pb-4"
    :add-button="props.addButton"
    search-placeholder="Tìm mã phiếu, tham chiếu, chứng từ gốc"
    hide-search
    @update:q="onUpdateQ"
    @update:row-selection="onUpdateRowSelection"
    @update:pagination="onUpdatePagination"
    @update:tab="onUpdateTab"
  >
    <template #search-actions>
      <slot name="search-actions" />
    </template>
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
        @click="emit('navigate-code', (item as any).code)"
      >
        {{ value }}
      </button>
    </template>
    <template #column-reason="{ value }">
      <span class="block truncate max-w-[240px]" :title="value as string">{{ value }}</span>
    </template>
    <template #column-amount="{ value }">
      <span
        class="font-semibold tabular-nums"
        :class="(value as number) < 0 ? 'text-red-600' : 'text-emerald-600'"
      >
        {{ (value as number) < 0 ? '-' + formatMoney(Math.abs(value as number)) : formatMoney(value as number) }}
      </span>
    </template>
  </BaseTable>
</template>

<script lang="ts">
export default {
  methods: {
    formatMoney(v: number | string) {
      if (v == null || v === '') return ''
      const num = typeof v === 'string' ? Number(v) : v
      if (isNaN(num)) return ''
      return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(num) + 'đ'
    }
  }
}
</script>
