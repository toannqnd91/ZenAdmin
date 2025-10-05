<script setup lang="ts">
import BaseTable from '@/components/base/BaseTable.vue'

interface TransfersTableRow {
  id: number | string
  code: string
  createdAt: string
  origin: string
  destination: string
  totalItems: number
  status: string
  [k: string]: unknown
}

interface TransfersTableTab {
  label: string
  value: string
  count?: number
}

const props = defineProps<{
  data: TransfersTableRow[]
  loading?: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
  tabs?: TransfersTableTab[]
  totalRecords?: number
  totalPages?: number
}>()

const emit = defineEmits<{
  'update:q': [string]
  'update:rowSelection': [Record<string, boolean>]
  'update:pagination': [{ pageIndex: number, pageSize: number }]
  'update:tab': [string]
}>()

// Columns mimic OrdersTable style
const columns = [
  { key: 'code', label: 'Mã phiếu', sortable: true },
  { key: 'createdAt', label: 'Ngày tạo', sortable: true },
  { key: 'origin', label: 'Kho nguồn', sortable: true },
  { key: 'destination', label: 'Kho đích', sortable: true },
  { key: 'totalItems', label: 'Số mặt hàng', sortable: true },
  { key: 'status', label: 'Trạng thái', sortable: true }
]

const colWidths = [
  '120px',
  '150px',
  '200px',
  '200px',
  '140px',
  '160px'
]
</script>

<template>
  <BaseTable
    :data="props.data"
    :loading="props.loading"
    :q="props.q"
    :row-selection="props.rowSelection"
    :pagination="props.pagination"
    :columns="columns"
    :col-widths="colWidths"
    title="Phiếu điều chuyển"
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
    <template #column-code="{ value }">
      <NuxtLink
        :to="`/stock-transfers/${String(value).replace(/^#/, '')}`"
        class="text-primary-600 hover:underline font-medium"
      >
        {{ value }}
      </NuxtLink>
    </template>
    <template #column-status="{ value }">
      <span
        class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium select-none"
        :class="statusClass(value as string)"
      >
        <span class="inline-block h-2 w-2 rounded-full" :class="statusDot(value as string)" />
        {{ mapStatus(value as string) }}
      </span>
    </template>
  </BaseTable>
</template>

<script lang="ts">
export default {
  methods: {
    mapStatus(v: string) {
      const val = (v || '').toLowerCase()
      if (val.includes('draft')) return 'Nháp'
      if (val.includes('ready')) return 'Sẵn sàng chuyển'
      if (val.includes('progress')) return 'Đang xử lý'
      if (val.includes('transferred')) return 'Đã chuyển'
      if (val.includes('cancel')) return 'Đã hủy'
      return v || ''
    },
    statusClass(v: string) {
      const val = (v || '').toLowerCase()
      if (val.includes('draft')) return 'bg-gray-50 border-gray-200 text-gray-600'
      if (val.includes('ready')) return 'bg-blue-50 border-blue-200 text-blue-600'
      if (val.includes('progress')) return 'bg-indigo-50 border-indigo-200 text-indigo-600'
      if (val.includes('transferred')) return 'bg-green-50 border-green-200 text-green-600'
      if (val.includes('cancel')) return 'bg-rose-50 border-rose-200 text-rose-600'
      return 'bg-gray-100 border-gray-200 text-gray-600'
    },
    statusDot(v: string) {
      const val = (v || '').toLowerCase()
      if (val.includes('draft')) return 'bg-gray-400'
      if (val.includes('ready')) return 'bg-blue-500'
      if (val.includes('progress')) return 'bg-indigo-500'
      if (val.includes('transferred')) return 'bg-green-500'
      if (val.includes('cancel')) return 'bg-rose-500'
      return 'bg-gray-400'
    }
  }
}
</script>
