<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'

interface ProductCategory {
  id: number | string
  name: string
  description?: string
  imageUrl?: string | null
  productCount?: number
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
    key: 'productCount',
    label: 'Sản phẩm',
    class: 'py-3 text-right font-medium pr-4',
    align: 'right'
  },
  {
    key: 'description',
    label: 'Mô tả',
    class: 'py-3 text-right font-medium pr-6',
    align: 'right'
  }
]

// Column widths align with the columns order above: [Tên danh mục, Sản phẩm, Mô tả]
// - Name: wide enough for titles and thumbnail
// - Product count: compact fixed width
// - Description: flexible
const colWidths = [
  '350', // Tên danh mục
  '150', // Sản phẩm
  '150' // Mô tả (auto)
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
    imageUrl: c.imageUrl,
    productCount: typeof c.productCount === 'number' ? c.productCount : 0
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
    :col-widths="colWidths"
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
        <div class="h-11 w-11 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
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
      <div class="text-sm text-gray-500 text-right pr-6">
        {{ (item as any).description || 'Không có mô tả' }}
      </div>
    </template>

    <!-- Custom product count column (right aligned) -->
    <template #column-productCount="{ item }">
      <div class="text-sm text-gray-900 font-medium text-right pr-4 tabular-nums">
        {{ (item as any).productCount ?? 0 }}
      </div>
    </template>
  </BaseTable>
</template>
