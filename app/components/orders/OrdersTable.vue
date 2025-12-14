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
  '160px', // code
  '150px', // createdAt
  'null', // customer
  '100px', // source
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
        class="text-primary-600 hover:underline font-medium inline-block max-w-[140px] truncate align-middle"
        :title="String(value)"
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
        <template v-if="isRefunded(value as string)">
          <!-- Refunded icon: arrow rotating back -->
          <svg
            class="w-3.5 h-3.5 text-rose-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M3 10v6h6" />
            <path d="M21 14a9 9 0 0 1-15.3 6.3L3 16" />
            <path d="M3 10a9 9 0 0 1 15.3-6.3L21 8" />
          </svg>
        </template>
        <template v-else-if="isOverPaid(value as string)">
          <!-- Overpaid icon: stacked coins (now violet) -->
          <svg
            class="w-3.5 h-3.5 text-violet-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <ellipse
              cx="12"
              cy="6"
              rx="7"
              ry="3"
            />
            <path d="M5 6v4c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
            <path d="M5 14v4c0 1.66 3.13 3 7 3s7-1.34 7-3v-4" />
          </svg>
        </template>
        <template v-else-if="isPartialPayment(value as string)">
          <!-- Partial payment icon (new) -->
          <svg
            class="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="12"
              fill="#FFDF9B"
            />
            <path
              fill="#fff"
              fill-rule="evenodd"
              d="M19 12a7 7 0 1 0-14 0z"
              clip-rule="evenodd"
            />
            <path
              fill="#E49C06"
              d="M19 12v.75h.75v-.75zm-14 0h-.75v.75h.75zm7-6.25a6.25 6.25 0 0 1 6.25 6.25h1.5a7.75 7.75 0 0 0-7.75-7.75zm-6.25 6.25a6.25 6.25 0 0 1 6.25-6.25v-1.5a7.75 7.75 0 0 0-7.75 7.75zm-.75.75h14v-1.5h-14z"
            />
            <path
              fill="#E49C06"
              d="M19 12v-.75h.75v.75zm-14 0h-.75v-.75h.75zm7 7.75a8 8 0 0 1-.759-.037l.145-1.493q.303.03.614.03zm-2.25-.332a7.7 7.7 0 0 1-1.404-.582l.708-1.322q.537.288 1.13.469zm-2.667-1.427a8 8 0 0 1-1.074-1.074l1.16-.952q.391.475.866.867zm-1.919-2.336a7.7 7.7 0 0 1-.582-1.405l1.435-.435q.181.594.47 1.131zm-.877-2.896a8 8 0 0 1-.037-.759h1.5q0 .31.03.614zm.713-1.509h.7v1.5h-.7zm2.1 0h1.4v1.5h-1.4zm2.8 0h1.4v1.5h-1.4zm2.8 0h1.4v1.5h-1.4zm2.8 0h1.4v1.5h-1.4zm2.8 0h.7v1.5h-.7zm1.45.75q0 .385-.037.759l-1.493-.145q.03-.303.03-.614zm-.332 2.25q-.224.736-.582 1.405l-1.322-.709q.288-.537.469-1.13zm-1.427 2.667a8 8 0 0 1-1.074 1.074l-.952-1.16a6.3 6.3 0 0 0 .867-.866zm-2.336 1.919a7.7 7.7 0 0 1-1.405.582l-.435-1.435q.594-.181 1.131-.47zm-2.896.877a8 8 0 0 1-.759.037v-1.5q.31 0 .614-.03z"
            />
          </svg>
        </template>
        <template v-else-if="isPaid(value as string)">
          <!-- Paid icon (provided) -->
          <svg
            class="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              fill="#fff"
              stroke="#CFF6E7"
              stroke-width="4"
              d="M12 22c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10Z"
            />
            <path
              fill="#0DB473"
              fill-rule="evenodd"
              d="M4 12c0-4.416 3.584-8 8-8s8 3.584 8 8-3.584 8-8 8-8-3.584-8-8m6.4 1.736 5.272-5.272 1.128 1.136-6.4 6.4-3.2-3.2 1.128-1.128z"
              clip-rule="evenodd"
            />
          </svg>
        </template>
        <template v-else-if="isUnpaid(value as string)">
          <!-- Unpaid icon (provided) -->
          <svg
            class="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <rect
              width="24"
              height="24"
              fill="#FFDF9B"
              rx="12"
            />
            <path
              fill="#fff"
              stroke="#E49C06"
              stroke-dasharray="2 2"
              stroke-width="1.5"
              d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"
            />
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
      if (this.isRefunded(v)) {
        return 'bg-rose-50 border-rose-200 text-rose-600'
      }
      if (this.isOverPaid(v)) {
        // OverPaid now uses violet scheme
        return 'bg-violet-50 border-violet-200 text-violet-600'
      }
      if (val.includes('một phần') || val.includes('partial')) {
        return 'bg-blue-50 border-blue-200 text-blue-600'
      }
      if (this.isPaid(v)) {
        // Paid now uses emerald scheme
        return 'bg-emerald-50 border-emerald-200 text-emerald-600'
      }
      if (this.isUnpaid(v)) {
        return 'bg-amber-50 border-amber-200 text-amber-600'
      }
      return 'bg-gray-100 border-gray-200 text-gray-600'
    },
    paymentStatusDot(v: string) {
      if (this.isRefunded(v)) return 'bg-rose-500'
      if (this.isOverPaid(v)) return 'bg-violet-500'
      if (this.isPartialPayment(v)) return 'bg-blue-500'
      if (this.isPaid(v)) return 'bg-emerald-500'
      if (this.isUnpaid(v)) return 'bg-amber-500'
      return 'bg-gray-400'
    },
    isUnpaid(v: string) {
      const val = (v || '').toLowerCase()
      return val.includes('chưa thanh toán') || val.includes('unpaid')
    },
    isRefunded(v: string) {
      const val = (v || '').toLowerCase()
      return val.includes('hoàn tiền') || val.includes('refunded')
    },
    isPaid(v: string) {
      const val = (v || '').toLowerCase()
      // exclude partial & overpaid which also contain 'paid'
      if (this.isOverPaid(v) || this.isPartialPayment(v)) return false
      return val.includes('đã thanh toán') || (val.includes('paid') && !val.includes('partial'))
    },
    isOverPaid(v: string) {
      const val = (v || '').toLowerCase()
      return val.includes('thanh toán dư') || val.includes('overpaid')
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
