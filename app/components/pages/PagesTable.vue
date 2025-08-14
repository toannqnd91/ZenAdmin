<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'

type PageItem = {
  id: number
  name: string
  slug: string
  metaTitle: string
  metaKeywords: string
  metaDescription: string
  isPublished: boolean
  publishedOn: string | null
  body: string
}

interface Props {
  data: PageItem[]
  loading?: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
}

defineProps<Props>()
const emit = defineEmits<{
  'update:q': [string]
  'update:rowSelection': [Record<string, boolean>]
  'update:pagination': [{ pageIndex: number, pageSize: number }]
}>()

const columns: TableColumn[] = [
  { key: 'name', label: 'Tên trang', class: 'py-3 text-left font-medium' },
  { key: 'slug', label: 'Slug', class: 'py-3 text-left font-medium' },
  { key: 'isPublished', label: 'Trạng thái', class: 'py-3 text-left font-medium' },
  { key: 'publishedOn', label: 'Ngày đăng', class: 'py-3 text-left font-medium' }
]

const addButton = {
  label: 'Thêm trang',
  href: '/pages/create'
}

const handleRowClick = (item: Record<string, unknown>) => {
  if (item && typeof item.id !== 'undefined') {
    navigateTo(`/pages/${item.id}/update`)
  }
}
</script>

<template>
  <BaseTable
    :q="q"
    :row-selection="rowSelection"
    :pagination="pagination"
    :data="data"
    :loading="loading"
    title="Danh sách trang"
    :columns="columns"
    :add-button="addButton"
    :row-click-handler="handleRowClick"
    search-placeholder="Tìm kiếm trang"
    @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)"
  >
    <template #column-isPublished="{ item }">
      <span :class="item.isPublished ? 'text-green-600' : 'text-gray-400'">
        {{ item.isPublished ? 'Đã xuất bản' : 'Nháp' }}
      </span>
    </template>
    <template #column-publishedOn="{ item }">
      <span>
        {{ (item.publishedOn && typeof item.publishedOn === 'string' && item.publishedOn !== 'null')
          ? new Date(item.publishedOn).toLocaleString()
          : '-' }}
      </span>
    </template>
  </BaseTable>
</template>
