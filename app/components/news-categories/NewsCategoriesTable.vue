<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import { fileService } from '@/services'
import type { NewsCategory } from '@/types/newsCategory'

interface Props {
  data: NewsCategory[]
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
}>()

const columns: TableColumn[] = [
  {
    key: 'name',
    label: 'Tên danh mục',
    class: 'py-3 text-left font-medium'
  }
]

const addButton = {
  label: 'Thêm danh mục',
  href: '/news-categories/create'
}

const handleRowClick = (item: NewsCategory) => {
  navigateTo(`/news-categories/${item.id}/update`)
}
</script>

<template>
  <BaseTable
    :q="q"
    :row-selection="rowSelection"
    :pagination="pagination"
    :data="data"
    :loading="loading"
    title="Danh mục tin tức"
    :columns="columns"
    :add-button="addButton"
    search-placeholder="Tìm kiếm danh mục..."
    :row-click-handler="handleRowClick"
    @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)"
  >
    <!-- Custom name column with image and description -->
    <template #column-name="{ item }">
      <div class="flex items-center gap-4">
        <div class="h-11 w-11 min-w-[44px] min-h-[44px] aspect-square rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
          <img
            :src="fileService.getFileUrl(item.imageUrl) || '/no-image.svg'"
            :alt="item.name"
            class="h-full w-full object-cover"
            @error="(e: any) => e.target && (e.target.src='/no-image.svg')"
          >
        </div>
        <div class="flex flex-col">
          <span class="text-[15px] text-gray-900 font-medium">{{ item.name }}</span>
          <span class="text-sm text-muted line-clamp-2">{{ item.description || 'Không có mô tả' }}</span>
        </div>
      </div>
    </template>
  <!-- Đã bỏ cột mô tả, chỉ show trong name -->
    <!-- Row actions slot nếu cần -->
    <template #row-actions="{ item }">
      <slot name="row-actions" :item="item">
        <!-- Custom action nếu muốn -->
      </slot>
    </template>
  </BaseTable>
</template>
