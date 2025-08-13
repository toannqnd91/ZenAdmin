<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'

interface ProductCategory {
  id: number | string
  name: string
  description?: string
  imageUrl?: string | null
}

interface Props {
  data: ProductCategory[]
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

// Table configuration
const columns: TableColumn[] = [
  {
    key: 'name',
    label: 'Tên danh mục',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'description',
    label: 'Mô tả',
    class: 'py-3 text-left font-medium'
  }
]

const addButton = {
  label: 'Thêm danh mục',
  href: '/products-categories/create'
}

const handleRowClick = (item: Record<string, unknown>) => {
  const categoryItem = item as unknown as ProductCategory
  navigateTo(`/products-categories/${categoryItem.id}/update`)
}

// Map to BaseTable format
const tableData = computed(() =>
  props.data.map((c: ProductCategory) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    imageUrl: c.imageUrl
  }))
)
</script>

<template>
  <BaseTable
    :q="q"
    :row-selection="rowSelection"
    :pagination="pagination"
    :data="tableData"
    :loading="loading"
    title="Danh mục sản phẩm"
    :columns="columns"
    :add-button="addButton"
    :row-click-handler="handleRowClick"
    search-placeholder="Tìm kiếm danh mục..."
    @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)"
    @delete="ids => emit('delete', ids)"
  >
    <!-- Custom name column with image -->
    <template #column-name="{ item }">
      <div class="flex items-center gap-4">
        <div class="h-14 w-14 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
          <img
            :src="(item as any).imageUrl || '/no-image.svg'"
            :alt="(item as any).name"
            class="h-full w-full object-cover"
            @error="(e: any) => e.target && (e.target.src='/no-image.svg')"
          >
        </div>
        <div class="text-[15px] text-gray-900 font-medium">
          {{ (item as any).name }}
        </div>
      </div>
    </template>

    <!-- Custom description column -->
    <template #column-description="{ item }">
      <div class="text-sm text-gray-500">
        {{ (item as any).description || 'Không có mô tả' }}
      </div>
    </template>
  </BaseTable>
</template>
