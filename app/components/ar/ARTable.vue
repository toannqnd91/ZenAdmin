<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import type { ARSummaryItem } from '@/services'
import { computed } from 'vue'

interface Props {
  data: ARSummaryItem[]
  loading?: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
  totalPages?: number
  totalRecords?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:q', value: string): void
  (e: 'update:rowSelection', value: Record<string, boolean>): void
  (e: 'update:pagination', value: { pageIndex: number, pageSize: number }): void
}>()

const columns: TableColumn[] = [
  {
    key: 'objectCode',
    label: 'Tên đối tượng',
    class: 'py-3 text-left font-medium whitespace-nowrap -translate-x-3'
  },
  {
    key: 'phoneNumber',
    label: 'Số điện thoại',
    class: 'py-3 text-left font-medium whitespace-nowrap'
  },
  {
    key: 'openingBalance',
    label: 'Nợ đầu kỳ',
    class: 'py-3 text-right font-medium whitespace-nowrap',
    align: 'right'
  },
  {
    key: 'periodChange',
    label: 'Nợ thay đổi trong kỳ',
    class: 'py-3 text-right font-medium whitespace-nowrap',
    align: 'right'
  },
  {
    key: 'closingBalance',
    label: 'Phải thu/trả cuối kỳ',
    class: 'py-3 text-right font-medium whitespace-nowrap',
    align: 'right'
  }
]

const colWidths = [
  '', // tên đối tượng (was mã + avatar)
  '160px', // SĐT
  '160px', // Nợ đầu kỳ
  '160px', // Nợ thay đổi
  '160px'  // Phải thu/trả cuối kỳ
]

const rows = computed<Record<string, unknown>[]>(() => props.data as unknown as Record<string, unknown>[])
const toItem = (item: Record<string, unknown> | null | undefined): ARSummaryItem => (item ?? {}) as ARSummaryItem

const handleRowClick = (item: Record<string, unknown>) => {
  const { objectId: id, objectType: type } = toItem(item)
  if (type === 'Customer') {
    navigateTo(`/customers/${id}`)
  } else if (type === 'Supplier') {
    navigateTo(`/suppliers/${id}`)
  }
}

const getAvatarInitials = (name: string) => {
  if (!name) return '?'
  const words = name.trim().split(' ')
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

const getAvatarColor = (id: number) => {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500']
  return colors[id % colors.length]
}

const formatCurrency = (value: number) => {
  if (value == null) return '0đ'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}
</script>

<template>
  <BaseTable :q="props.q" :row-selection="props.rowSelection" :pagination="props.pagination" :data="rows"
    :loading="props.loading" :total-records="props.totalRecords" :total-pages="props.totalPages"
    title="Danh sách công nợ" :columns="columns" :col-widths="colWidths" :show-row-actions="false" table-min-width="0"
    body-padding="px-6" header-padding-x="px-6" row-padding-y="py-3"
    search-placeholder="Tìm kiếm theo tên, SĐT, mã khách hàng, mã phiếu AR, mã đơn hàng" search-width="max-w-xl"
    :row-click-handler="handleRowClick" @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)" @update:pagination="emit('update:pagination', $event)">
    <template #column-objectCode="{ item }">
      <div class="flex items-center gap-3 -ml-3">
        <div :class="[
          'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium',
          getAvatarColor(toItem(item).objectId || 0)
        ]">
          {{ getAvatarInitials(toItem(item).objectName) }}
        </div>
        <div class="flex flex-col">
          <span class="text-base font-medium text-gray-900 dark:text-white">{{ toItem(item).objectName }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ toItem(item).objectType === 'Customer' ? 'Khách hàng' : 'Nhà cung cấp' }} | Mã: {{
              toItem(item).objectCode }}</span>
        </div>
      </div>
    </template>

    <template #column-openingBalance="{ value }">
      <span class="text-sm text-gray-900 dark:text-white">{{ formatCurrency(value as number) }}</span>
    </template>

    <template #column-periodChange="{ value }">
      <span :class="[
        'text-sm font-medium',
        (value as number) > 0 ? 'text-red-600 dark:text-red-400' : (value as number) < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
      ]">
        {{ formatCurrency(value as number) }}
      </span>
    </template>

    <template #column-closingBalance="{ value }">
      <span :class="[
        'text-sm font-semibold',
        (value as number) > 0 ? 'text-red-600 dark:text-red-400' : (value as number) < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
      ]">
        {{ formatCurrency(value as number) }}
      </span>
    </template>
  </BaseTable>
</template>
