<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'

type Category = { id: string | number, name: string }
type Variation = { id: string | number, stockQuantity: number | null }
type ProductItem = {
  id: string | number
  name: string
  thumbnailImageUrl?: string | null
  categories?: Category[]
  status?: 'Public' | 'Draft'
  source?: string
  sold?: number
  stockQuantity?: number | null
  variations?: Variation[]
  createdOn?: string | Date
}

interface Props {
  data: ProductItem[]
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

// Table configuration
const columns: TableColumn[] = [
  {
    key: 'name',
    label: 'Product name',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'status',
    label: 'Status',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'source',
    label: 'Sources',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'sold',
    label: 'Sold',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'inventory',
    label: 'Inventory',
    class: 'py-3 text-left font-medium'
  }
]

const addButton = {
  label: 'Thêm sản phẩm',
  href: '/products/create'
}

const handleRowClick = (item: ProductItem) => {
  navigateTo(`/products/${item.id}/update`)
}

/* helpers */
const invText = (p: ProductItem) => {
  if (Array.isArray(p.variations) && p.variations.length > 1) {
    const qty = p.variations.map(v => v.stockQuantity)
    const allU = qty.every(q => q == null)
    const allS = qty.every(q => q === qty[0])
    if (allU) return { line1: 'Unlimited', variants: `${p.variations.length} variants`, danger: false }
    if (allS) return { line1: `${qty[0]} in stock`, variants: `${p.variations.length} variants`, danger: false }
    return { line1: 'Mixed', variants: `${p.variations.length} variants`, danger: true }
  }
  if (p.stockQuantity == null) return { line1: 'Unlimited', variants: `${Array.isArray(p.variations) ? p.variations.length : 1} variants`, danger: false }
  return { line1: `${p.stockQuantity} in stock`, variants: `${Array.isArray(p.variations) ? p.variations.length : 1} variants`, danger: false }
}
</script>

<template>
  <BaseTable
    :q="q"
    :row-selection="rowSelection"
    :pagination="pagination"
    :data="data"
    :loading="loading"
    title="Danh sách sản phẩm"
    :columns="columns"
    :add-button="addButton"
    :row-click-handler="handleRowClick"
    search-placeholder="Tìm kiếm sản phẩm"
    @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)"
  >
    <!-- Custom name column with image -->
    <template #column-name="{ item }">
      <div class="flex items-center gap-4">
        <div class="h-14 w-14 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
          <img
            :src="item.thumbnailImageUrl || '/no-image.svg'"
            :alt="item.name"
            class="h-full w-full object-cover"
            @error="(e: any) => e.target && (e.target.src='/no-image.svg')"
          >
        </div>
        <div class="text-[15px] text-gray-900 font-medium">
          {{ item.name }}
        </div>
      </div>
    </template>

    <!-- Custom status column -->
    <template #column-status="{ item }">
      <span class="inline-flex items-center rounded-full bg-[#dff5c7] text-[#2a7a16] px-3 py-1 text-sm font-medium">
        {{ item.status || 'Public' }}
      </span>
    </template>

    <!-- Custom source column -->
    <template #column-source="{ item }">
      <div class="text-gray-700">
        {{ item.source || 'My product' }}
      </div>
    </template>

    <!-- Custom sold column -->
    <template #column-sold="{ item }">
      <div class="text-gray-900">
        {{ item.sold ?? 0 }}
      </div>
    </template>

    <!-- Custom inventory column -->
    <template #column-inventory="{ item }">
      <div :class="['text-gray-900', invText(item).danger ? 'text-red-500' : '']">
        {{ invText(item).line1 }}
      </div>
      <div class="text-xs text-gray-400">
        {{ invText(item).variants }}
      </div>
    </template>
  </BaseTable>
</template>
