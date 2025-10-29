<script setup lang="ts">
import BaseTable, { type TableColumn } from '@/components/base/BaseTable.vue'
import type { PriceBookItem } from '@/composables/usePriceBooksService'

interface Props {
  data: PriceBookItem[]
  loading?: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
  totalPages?: number
  totalRecords?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:q' | 'update:tab', value: string): void
  (e: 'update:rowSelection', value: Record<string, boolean>): void
  (e: 'update:pagination', value: { pageIndex: number, pageSize: number }): void
  (e: 'add'): void
}>()

const columns: TableColumn[] = [
  { key: 'name', label: 'Tên bảng giá', class: 'py-3 text-left font-medium' },
  { key: 'type', label: 'Loại bảng giá', class: 'py-3 text-left font-medium' },
  { key: 'status', label: 'Trạng thái', class: 'py-3 text-left font-medium' },
  { key: 'adjustment', label: 'Điều chỉnh giá', class: 'py-3 text-right font-medium', align: 'right' }
]

const colWidths = ['', '260px', '180px', '140px']

const addButton = {
  label: 'Thêm bảng giá',
  handler: () => emit('add')
}

const tabs = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Theo chi nhánh', value: 'branch' },
  { label: 'Theo nhóm khách hàng', value: 'customer-group' },
  { label: 'Theo kênh bán hàng', value: 'channel' }
]

const onTabChange = (v: string) => emit('update:tab', v)

const onClickName = (code: string) => navigateTo(`/pricebooks/${encodeURIComponent(code)}`)

// Adapt data type for BaseTable
const tableData = computed(() => props.data as unknown as Record<string, unknown>[])
</script>

<template>
  <BaseTable
    :q="q"
    :row-selection="rowSelection"
    :pagination="pagination"
    :data="tableData"
    :loading="loading"
    title="Bảng giá"
    :columns="columns"
    :col-widths="colWidths"
    :add-button="addButton"
    :total-pages="props.totalPages"
    :total-records="props.totalRecords"
    :tabs="tabs"
    tabs-style="underline"
    search-placeholder="Tìm kiếm theo tên, mã bảng giá"
    @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)"
    @update:tab="onTabChange"
  >
    <!-- Name column: clickable name with code shown below -->
    <template #column-name="{ item }">
      <div>
        <button
          type="button"
          class="text-[15px] text-gray-900 font-medium"
          @click.stop="onClickName(String(item.code))"
        >
          {{ item.name }}
        </button>
        <div class="text-xs text-gray-500 mt-0.5">
          Mã: <span class="font-medium">{{ item.code }}</span>
        </div>
      </div>
    </template>

    <!-- Status pill -->
    <template #column-status="{ item }">
      <span
        :class="[
          'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
          item.status === 'Đang áp dụng' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
        ]"
      >
        {{ item.status }}
      </span>
    </template>

    <!-- Adjustment right aligned, show '---' when empty -->
    <template #column-adjustment="{ item }">
      <div class="text-right text-gray-900">
        {{ item.adjustment || '---' }}
      </div>
    </template>
  </BaseTable>
</template>
