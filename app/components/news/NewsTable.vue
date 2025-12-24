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
  loading?: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
  totalPages?: number
  totalRecords?: number
  truncateText: (text: string, wordLimit?: number) => string
  getRowItems?: (row: { original: NewsItem }) => any[]
  onRowClick?: (item: NewsItem) => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:q', value: string): void
  (e: 'update:rowSelection', value: Record<string, boolean>): void
  (e: 'update:pagination', value: { pageIndex: number, pageSize: number }): void
  (e: 'edit', id: string | number): void
  (e: 'delete', id: string | number): void
  (e: 'delete-multi', ids: (string | number)[]): void
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
  <BaseTable :q="q" :row-selection="rowSelection" :pagination="pagination" :data="data" :loading="loading"
    title="Danh sách tin tức" :columns="columns" :add-button="{ label: 'Thêm tin tức', href: '/news/create' }"
    search-placeholder="Tìm kiếm tin tức..." :row-click-handler="handleRowClick" :total-pages="props.totalPages"
    :total-records="props.totalRecords" class="" @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)" @update:pagination="emit('update:pagination', $event)"
    @row-edit="emit('edit', $event)" @row-delete="emit('delete', $event)" @delete="emit('delete-multi', $event)">
    <!-- Custom title column with image and desc -->
    <template #column-title="{ item }">
      <div class="flex items-center gap-4">
        <div
          class="h-11 w-11 min-w-[44px] min-h-[44px] aspect-square rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
          <img :src="fileService.getFileUrl(item.imageUrl) || '/no-image.svg'" :alt="item.title"
            class="h-full w-full object-cover" @error="(e: any) => e.target && (e.target.src = '/no-image.svg')">
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
        {{(item.categories && item.categories.length > 0) ? item.categories.map((cat: Category) => cat.name).join(', ')
          : 'Chưa phân loại'}}
      </span>
    </template>

    <!-- Custom createdDate column -->
    <template #column-createdDate="{ item }">
      <span class="pr-8">{{ new Date(item.createdDate).toLocaleDateString('vi-VN') }}</span>
    </template>

    <!-- Row actions -->
    <template #row-actions="{ item }">
      <div class="flex items-center space-x-6 justify-end">
        <template v-for="action in props.getRowItems?.({ original: item as unknown as NewsItem }) as any[]"
          :key="action.label">
          <button v-if="action && action.type !== 'label' && action.type !== 'separator'" :class="[
            'transition-colors',
            action.label === 'Delete'
              ? 'text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
          ]" :title="action.label" @click="action.onSelect">
            <UIcon :name="action.icon" class="w-4 h-4" />
          </button>
        </template>
      </div>
    </template>
  </BaseTable>
</template>
