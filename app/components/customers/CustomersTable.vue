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
</script>

<template>
  <BaseTable
    :q="props.q"
    :row-selection="props.rowSelection"
    :pagination="props.pagination"
    :data="props.data"
    :loading="props.loading"
    :total-records="props.totalRecords"
    :total-pages="props.totalPages"
    title="Danh sách khách hàng"
    :columns="columns"
    :col-widths="colWidths"
    :add-button="addButton"
    :show-row-actions="false"
    search-placeholder="Tìm kiếm khách hàng..."
    :row-click-handler="handleRowClick"
  >
    <template #column-name="slotProps">
      <div v-if="String((slotProps.item as any).id) !== 'summary'" class="flex items-center gap-4">
        <UAvatar :src="(slotProps.item as any).avatar?.src" :alt="(slotProps.item as any).avatar?.alt" size="lg" />
        <div class="flex flex-col">
          <span class="text-[15px] text-gray-900 font-medium">{{ (slotProps.item as any).name }}</span>
          <span class="text-sm text-muted line-clamp-2">{{ (slotProps.item as any).code || 'Không có mã' }}</span>
        </div>
      </div>
    </template>

    <template #column-receivable="{ value }">
      <span>{{ Number(value || 0).toLocaleString('vi-VN') }}</span>
    </template>
    <template #column-totalSale="{ value }">
      <span>{{ Number(value || 0).toLocaleString('vi-VN') }}</span>
    </template>
    <template #column-netSale="{ value }">
      <span class="block text-right">{{ Number(value || 0).toLocaleString('vi-VN') }}</span>
    </template>
  </BaseTable>
</template>
