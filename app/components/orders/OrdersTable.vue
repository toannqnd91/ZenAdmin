<script setup lang="ts">
import BaseTable from '@/components/base/BaseTable.vue'

const props = defineProps<{
  data: any[]
  loading?: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
  tabs?: any[]
}>()

const columns = [
  { key: 'code', label: 'Mã đơn', sortable: true },
  { key: 'customer', label: 'Khách hàng', sortable: true },
  { key: 'total', label: 'Tổng tiền', sortable: true },
  { key: 'status', label: 'Trạng thái', sortable: true },
  { key: 'createdAt', label: 'Ngày tạo', sortable: true }
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
    title="Đơn hàng"
    :tabs="props.tabs"
  />
</template>
