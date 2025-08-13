
<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import { fileService } from '@/services/file.service'

interface Category { id: string | number, name: string }
interface NewsItem {
  id: string | number
  title: string
  desc: string
  imageUrl?: string | null
  categories?: Category[]
  createdDate: string | Date
}

interface Props {
  data: NewsItem[]
  loading: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
  truncateText: (text: string, wordLimit?: number) => string
  onRowClick?: (item: NewsItem) => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:q': [string]
  'update:rowSelection': [Record<string, boolean>]
  'update:pagination': [{ pageIndex: number, pageSize: number }]
}>()

const columns: TableColumn[] = [
  {
    key: 'title',
    label: 'Tiêu đề',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'categories',
    label: 'Danh mục',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'createdDate',
    label: 'Ngày tạo',
    class: 'py-3 text-left font-medium'
  }
]

const handleRowClick = (item: NewsItem) => {
  if (props.onRowClick) props.onRowClick(item)
}
</script>

<template>
  <BaseTable
    :q="q"
    :row-selection="rowSelection"
    :pagination="pagination"
    :data="data"
    :loading="loading"
    title="Danh sách tin tức"
    :columns="columns"
    :add-button="{ label: 'Thêm tin tức', href: '/news/create' }"
    search-placeholder="Tìm kiếm tin tức..."
    :row-click-handler="handleRowClick"
    @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)"
    class=""
  >
    <!-- Custom title column with image and desc -->
    <template #column-title="{ item }">
      <div class="flex items-center gap-4">
  <div class="h-11 w-11 min-w-[44px] min-h-[44px] aspect-square rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
          <img
            :src="fileService.getFileUrl(item.imageUrl) || '/no-image.svg'"
            :alt="item.title"
            class="h-full w-full object-cover"
            @error="(e: any) => e.target && (e.target.src='/no-image.svg')"
          >
        </div>
        <div class="flex flex-col">
          <span class="text-[15px] text-gray-900 font-medium">{{ item.title }}</span>
          <span class="text-sm text-muted line-clamp-2">{{ props.truncateText(item.desc) }}</span>
        </div>
      </div>
    </template>

    <!-- Custom categories column -->
    <template #column-categories="{ item }">
      <span>
        {{ (item.categories && item.categories.length > 0) ? item.categories.map(cat => cat.name).join(', ') : 'Chưa phân loại' }}
      </span>
    </template>

    <!-- Custom createdDate column -->
    <template #column-createdDate="{ item }">
      <span>{{ new Date(item.createdDate).toLocaleDateString('vi-VN') }}</span>
    </template>

    <!-- Row actions -->
    <template #row-actions="{ item }">
      <slot name="row-actions" :item="item">
        <!-- Bạn có thể custom thêm action ở đây nếu muốn -->
      </slot>
    </template>
  </BaseTable>
</template>
