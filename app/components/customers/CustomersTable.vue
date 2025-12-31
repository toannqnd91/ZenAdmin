<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'

interface Props {
  data: Record<string, unknown>[]
  loading?: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
  totalRecords?: number
  totalPages?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:q': [string]
  'update:rowSelection': [Record<string, boolean>]
  'update:pagination': [{ pageIndex: number, pageSize: number }]
}>()

const columns: TableColumn[] = [
  { key: 'name', label: 'Tên khách hàng', class: 'py-3 text-left font-medium' },
  { key: 'phone', label: 'Điện thoại', class: 'py-3 text-left font-medium' },
  { key: 'receivable', label: 'Nợ hiện tại', class: 'py-3 text-left font-medium' },
  { key: 'totalSale', label: 'Tổng bán', class: 'py-3 text-left font-medium' },
  { key: 'netSale', label: 'Tổng bán trừ trả hàng', class: 'py-3 text-right font-medium' }
]

const addButton = {
  label: 'Thêm khách hàng',
  href: '/customers/create'
}

const handleRowClick = (item: Record<string, unknown>) => {
  const id = String(item.id || '')
  if (id) navigateTo(`/customers/${id}`)
}

// Column widths: name wider
const colWidths = [
  '30%', // name
  '16%', // phone
  '18%', // receivable
  '18%', // totalSale
  '18%' // netSale
]

function formatNumber(v: number | string) {
  if (v == null || v === '') return '0'
  const num = typeof v === 'string' ? Number(v) : v
  if (isNaN(num)) return '0'
  const n = Math.floor(num)
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
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
</script>

<template>
  <BaseTable :q="props.q" :row-selection="props.rowSelection" :pagination="props.pagination" :data="props.data"
    :loading="props.loading" :total-records="props.totalRecords" :total-pages="props.totalPages"
    title="Danh sách khách hàng" :columns="columns" :col-widths="colWidths" :add-button="addButton"
    :show-row-actions="false" search-placeholder="Tìm kiếm khách hàng..." :row-click-handler="handleRowClick"
    @update:q="emit('update:q', $event)" @update:row-selection="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)">
    <template #column-name="slotProps">
      <div v-if="String((slotProps.item as any).id) !== 'summary'" class="flex items-center gap-4">
        <UAvatar v-if="(slotProps.item as any).avatar?.src && (slotProps.item as any).avatar?.src !== '/no-avatar.jpg'"
          :src="(slotProps.item as any).avatar?.src" :alt="(slotProps.item as any).avatar?.alt" size="lg" />
        <div v-else :class="[
          'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0',
          getAvatarColor((slotProps.item as any).id)
        ]">
          {{ getAvatarInitials((slotProps.item as any).name) }}
        </div>
        <div class="flex flex-col">
          <span class="text-[15px] text-gray-900 font-medium">{{ (slotProps.item as any).name }}</span>
          <span class="text-sm text-muted line-clamp-2">{{ (slotProps.item as any).code || 'Không có mã' }}</span>
        </div>
      </div>
    </template>

    <template #column-phone="{ value }">
      <span>{{ String(value ?? '').trim() || '-' }}</span>
    </template>

    <template #column-receivable="{ value }">
      <span>{{ formatNumber(value as number | string) }}</span>
    </template>
    <template #column-totalSale="{ value }">
      <span>{{ formatNumber(value as number | string) }}</span>
    </template>
    <template #column-netSale="{ value }">
      <span class="block text-right">{{ formatNumber(value as number | string) }}</span>
    </template>
  </BaseTable>
</template>
