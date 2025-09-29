<script setup lang="ts">
import BaseTable from '@/components/base/BaseTable.vue'

interface OrdersTableRow {
  id: number | string
  code: string
  createdAt: string
  customer: string
  source: string | null
  total: number
  paymentStatus: string
  processStatus: string
  // removed shippingMethod column from display, keep optional if data still present
  shippingMethod?: string | null
  [k: string]: unknown
}

interface OrdersTableTab {
  label: string
  value: string
  count?: number
}

const props = defineProps<{
  data: OrdersTableRow[]
  loading?: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
  tabs?: OrdersTableTab[]
  totalRecords?: number
  totalPages?: number
}>()

const emit = defineEmits<{
  'update:q': [string]
  'update:rowSelection': [Record<string, boolean>]
  'update:pagination': [{ pageIndex: number, pageSize: number }]
  'update:tab': [string]
}>()

// Column order now: Mã đơn hàng | Ngày đặt hàng | Khách hàng | Nguồn đơn | Thành tiền | Trạng thái thanh toán | Trạng thái xử lý
const columns = [
  { key: 'code', label: 'Mã đơn hàng', sortable: true },
  { key: 'createdAt', label: 'Ngày đặt hàng', sortable: true },
  { key: 'customer', label: 'Khách hàng', sortable: true },
  { key: 'source', label: 'Nguồn đơn', sortable: true },
  { key: 'total', label: 'Thành tiền', sortable: true },
  { key: 'paymentStatus', label: 'Trạng thái thanh toán', sortable: true },
  { key: 'processStatus', label: 'Trạng thái xử lý', sortable: true }
]

// Adjust widths accordingly (removed last width)
const colWidths = [
  '120px', // code
  '150px', // createdAt
  '220px', // customer
  '140px', // source
  '140px', // total
  '200px', // paymentStatus
  '180px' // processStatus
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
    title="Đơn hàng"
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
    <!-- Custom column render: total (currency) -->
    <template #column-code="{ value }">
      <NuxtLink
        :to="`/orders/${String(value).replace(/^#/, '')}`"
        class="text-primary-600 hover:underline font-medium"
      >
        {{ value }}
      </NuxtLink>
    </template>
    <!-- Custom column render: total (currency) -->
    <template #column-total="{ value }">
      <span class="tabular-nums whitespace-nowrap">{{ formatMoney(value as number) }}</span>
    </template>
    <!-- Custom column render: paymentStatus -->
    <template #column-paymentStatus="{ value }">
      <span
        class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium select-none"
        :class="paymentStatusClass(value as string)"
      >
        <template v-if="isPartialPayment(value as string)">
          <svg
            class="w-3 h-3 mr-1 text-blue-600"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              cx="5"
              cy="5"
              r="4"
              stroke="currentColor"
              stroke-width="1.5"
              fill="white"
            />
            <path d="M1 5 A4 4 0 0 1 9 5 L1 5 Z" fill="currentColor" />
          </svg>
        </template>
        <span
          v-else
          class="inline-block h-2 w-2 rounded-full"
          :class="paymentStatusDot(value as string)"
        />
        {{ value }}
      </span>
    </template>
    <!-- Custom column render: processStatus -->
    <template #column-processStatus="{ value }">
      <span
        class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium select-none"
        :class="processStatusClass(value as string)"
      >
        <span
          class="inline-block h-2 w-2 rounded-full"
          :class="processStatusDot(value as string)"
        />
        {{ value }}
      </span>
    </template>
  </BaseTable>
</template>

<script lang="ts">
// export helper functions for potential reuse
export default {
  methods: {
    isPartialPayment(v: string) {
      const val = (v || '').toLowerCase()
      return val.includes('một phần') || val.includes('partial')
    },
    // Currency formatter: 360,000đ (no decimals). Adjust locale or minimumFractionDigits if needed.
    formatMoney(v: number | string) {
      if (v == null || v === '') return ''
      const num = typeof v === 'string' ? Number(v) : v
      if (isNaN(num)) return ''
      return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(num) + 'đ'
    },
    paymentStatusClass(v: string) {
      const val = (v || '').toLowerCase()
      if (val.includes('một phần') || val.includes('partial')) {
        return 'bg-blue-50 border-blue-200 text-blue-600'
      }
      if (val.includes('đã thanh toán') || val.includes('paid')) {
        return 'bg-gray-100 border-gray-200 text-gray-600'
      }
      if (val.includes('chưa') || val.includes('unpaid')) {
        return 'bg-amber-50 border-amber-200 text-amber-600'
      }
      return 'bg-gray-100 border-gray-200 text-gray-600'
    },
    paymentStatusDot(v: string) {
      const val = (v || '').toLowerCase()
      if (val.includes('một phần') || val.includes('partial')) {
        return 'bg-blue-500'
      }
      if (val.includes('đã thanh toán') || val.includes('paid')) {
        return 'bg-gray-400'
      }
      if (val.includes('chưa') || val.includes('unpaid')) {
        return 'bg-amber-500'
      }
      return 'bg-gray-400'
    },
    processStatusClass(v: string) {
      const val = (v || '').toLowerCase()
      if (val.includes('đang') || val.includes('processing')) {
        return 'bg-indigo-50 border-indigo-200 text-indigo-600'
      }
      if (val.includes('hủy') || val.includes('cancel')) {
        return 'bg-rose-50 border-rose-200 text-rose-600'
      }
      if (val.includes('hoàn') || val.includes('complete') || val.includes('xử lý')) {
        return 'bg-gray-100 border-gray-200 text-gray-600'
      }
      return 'bg-gray-100 border-gray-200 text-gray-600'
    },
    processStatusDot(v: string) {
      const val = (v || '').toLowerCase()
      if (val.includes('đang') || val.includes('processing')) {
        return 'bg-indigo-500'
      }
      if (val.includes('hủy') || val.includes('cancel')) {
        return 'bg-rose-500'
      }
      if (val.includes('hoàn') || val.includes('complete') || val.includes('xử lý')) {
        return 'bg-gray-400'
      }
      return 'bg-gray-400'
    }
  }
}
</script>
