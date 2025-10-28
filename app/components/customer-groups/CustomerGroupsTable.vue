<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'

interface GroupRow {
  id: number | string
  name: string
  count: number
  typeText: string
}

interface Props {
  data: GroupRow[]
  loading: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:q': [string]
  'update:rowSelection': [Record<string, boolean>]
  'update:pagination': [{ pageIndex: number, pageSize: number }]
  'delete': [string[]]
}>()

const columns: TableColumn[] = [
  { key: 'name', label: 'Nhóm khách hàng', class: 'py-3 text-left font-medium' },
  { key: 'count', label: 'Số lượng', class: 'py-3 text-right font-medium', align: 'right' },
  { key: 'typeText', label: 'Phân loại', class: 'py-3 text-left font-medium', align: 'right' }
]

// Use percentage widths similar to Customers table for consistent alignment
const colWidths = [
  '60%', // Nhóm khách hàng
  '20%', // Số lượng
  '20%' // Phân loại
]

const addButton = {
  label: 'Tạo nhóm',
  href: '/customer_groups/create'
}

// Keep row click disabled for now until detail page is available
const rowClickHandler = undefined

const tableData = computed(() =>
  props.data.map(d => ({
    id: d.id,
    name: d.name,
    count: d.count,
    typeText: d.typeText
  }) as Record<string, unknown>)
)
</script>

<template>
  <BaseTable
    :q="q"
    :row-selection="rowSelection"
    :pagination="pagination"
    :data="tableData"
    :loading="loading"
    title="Nhóm khách hàng"
    :columns="columns"
    :col-widths="colWidths"
    :add-button="addButton"
    :row-click-handler="rowClickHandler"
    search-placeholder="Tìm kiếm theo tên nhóm khách hàng"
    @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)"
    @delete="ids => emit('delete', ids)"
  >
    <!-- Custom cell slots to mirror alignment like Customers table -->
    <template #column-count="{ value }">
      <span class="block text-right">{{ Number(value || 0).toLocaleString('vi-VN') }}</span>
    </template>
    <template #column-typeText="{ value }">
      <span class="block text-right">{{ String(value || '-') }}</span>
    </template>
  </BaseTable>
</template>

<style scoped>
</style>
