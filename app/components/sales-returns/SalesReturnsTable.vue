<script setup lang="ts">
import BaseTable from '@/components/base/BaseTable.vue'

interface SalesReturnRow {
  id: number | string
  returnNumber: string
  orderCode: string
  customer: string
  total: number
  refundAmount: number
  status: string
  createdAt?: string // if backend later adds timestamp
  [k: string]: unknown
}

interface SalesReturnTab {
  label: string
  value: string
  count?: number
}

const props = defineProps<{
  data: SalesReturnRow[]
  loading?: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
  tabs?: SalesReturnTab[]
  totalRecords?: number
  totalPages?: number
}>()

const emit = defineEmits<{
  'update:q': [string]
  'update:rowSelection': [Record<string, boolean>]
  'update:pagination': [{ pageIndex: number, pageSize: number }]
  'update:tab': [string]
}>()

const columns = [
  { key: 'returnNumber', label: 'Mã phiếu trả', sortable: true },
  { key: 'orderCode', label: 'Mã đơn hàng', sortable: true },
  { key: 'customer', label: 'Khách hàng', sortable: true },
  { key: 'total', label: 'Giá trị trả hàng', sortable: true },
  { key: 'refundAmount', label: 'Hoàn tiền', sortable: true },
  { key: 'status', label: 'Trạng thái', sortable: true }
]

const colWidths = [
  '160px', // returnNumber
  '140px', // orderCode
  '220px', // customer
  '160px', // total
  '140px', // refundAmount
  '140px' // status
]
</script>

<template>
  <BaseTable
    :data="props.data as any"
    :loading="props.loading"
    :q="props.q"
    :row-selection="props.rowSelection"
    :pagination="props.pagination"
    :columns="columns"
    :col-widths="colWidths"
    title="Phiếu trả hàng"
    :tabs="props.tabs"
    tabs-style="underline"
    :total-pages="props.totalPages"
    :total-records="props.totalRecords"
    :show-row-actions="false"
    @update:q="val => emit('update:q', val)"
    @update:row-selection="val => emit('update:rowSelection', val)"
    @update:pagination="val => emit('update:pagination', val)"
    @update:tab="val => emit('update:tab', val)"
  >
    <template #column-returnNumber="{ value }">
      <NuxtLink :to="`/sales-returns/${value}`" class="text-primary-600 hover:underline font-medium">{{ value }}</NuxtLink>
    </template>
    <template #column-orderCode="{ value }">
      <NuxtLink :to="`/orders/${String(value).replace(/^#/, '')}`" class="text-primary-600 hover:underline font-medium">{{ value }}</NuxtLink>
    </template>
    <template #column-total="{ value }">
      <span class="tabular-nums font-medium">{{ formatMoney(value as number) }}</span>
    </template>
    <template #column-refundAmount="{ value }">
      <span class="tabular-nums" :class="(value as number) > 0 ? 'text-emerald-600 font-semibold' : 'text-gray-600'">{{ formatMoney(value as number) }}</span>
    </template>
    <template #column-status="{ value }">
      <span class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium select-none" :class="statusClass(value as string)">
        <span class="inline-block h-2 w-2 rounded-full" :class="statusDot(value as string)" />
        {{ value }}
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
      const n = Math.floor(num)
      return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ'
    },
    statusClass(v: string) {
      const val = (v || '').toLowerCase()
      if (val.includes('pending') || val.includes('chờ')) return 'bg-amber-50 border-amber-200 text-amber-700'
      if (val.includes('completed') || val.includes('hoàn')) return 'bg-emerald-50 border-emerald-200 text-emerald-700'
      if (val.includes('canceled') || val.includes('hủy')) return 'bg-rose-50 border-rose-200 text-rose-700'
      return 'bg-gray-100 border-gray-200 text-gray-600'
    },
    statusDot(v: string) {
      const val = (v || '').toLowerCase()
      if (val.includes('pending') || val.includes('chờ')) return 'bg-amber-500'
      if (val.includes('completed') || val.includes('hoàn')) return 'bg-emerald-500'
      if (val.includes('canceled') || val.includes('hủy')) return 'bg-rose-500'
      return 'bg-gray-400'
    }
  }
}
</script>
