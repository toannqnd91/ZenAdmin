<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'

type Category = { id: string | number, name: string }
type Variation = { id: string | number, stockQuantity: number | null }
type ProductItem = {
  id: string | number
  name: string
  sku?: string | null
  thumbnailImageUrl?: string | null
  priceMin?: number | null
  priceMax?: number | null
  categories?: Category[]
  status?: 'Public' | 'Draft'
  source?: string
  sold?: number
  stockQuantity?: number | null
  variations?: Variation[]
  createdOn?: string | Date
}

type LooseItem = Record<string, unknown> & {
  id?: string | number
  name?: string
  thumbnailImageUrl?: string | null
  variations?: Array<{ stockQuantity?: number | null }>
  stockQuantity?: number | null
}

interface Props {
  data: ProductItem[]
  loading?: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
  totalPages?: number
  totalRecords?: number
  getRowItems?: (row: { original: ProductItem }) => any[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:q' | 'update:tab', value: string): void
  (e: 'update:rowSelection', value: Record<string, boolean>): void
  (e: 'update:pagination', value: { pageIndex: number, pageSize: number }): void
  (e: 'copy-id' | 'edit' | 'delete', id: string | number): void
  (e: 'delete-multi', ids: (string | number)[]): void
}>()

// Table configuration
const columns: TableColumn[] = [
  {
    key: 'name',
    label: 'Tên sản phẩm',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'price',
    label: 'Giá',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'status',
    label: 'Trạng thái',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'source',
    label: 'Nguồn',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'sold',
    label: 'Đã bán',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'inventory',
    label: 'Tồn kho',
    class: 'py-3 text-left font-medium'
  }
]

const addButton = {
  label: 'Thêm sản phẩm',
  href: '/products/create'
}

// Tabs for table header (first tab: "Tất cả")
const tabs = [
  { label: 'Tất cả', value: 'all' }
]
const activeTab = ref<string>('all')
const onTabChange = (v: string) => {
  activeTab.value = v
  emit('update:tab', v)
}

const handleRowClick = (item: Record<string, unknown>) => {
  const id = (item as LooseItem).id
  navigateTo(`/products/${id}/update`)
}

// showMenuFor removed; use onToggleMenu helper

// Safe template helpers used in name/inventory columns
const config = useRuntimeConfig()
const imageBaseUrl = config.public?.imageBaseUrl || ''
const getThumbnail = (raw: Record<string, unknown>) => {
  const url = (raw as LooseItem).thumbnailImageUrl as string
  if (!url) return '/no-image.svg'
  // If url looks like a filename (no slash), prepend imageBaseUrl
  if (!url.includes('/') && imageBaseUrl) {
    return `${imageBaseUrl}/image/${url}`
  }
  return url
}
const getItemName = (raw: Record<string, unknown>) => String((raw as LooseItem).name ?? '')
const getItemSku = (raw: Record<string, unknown>) => String((raw as { sku?: string | null }).sku ?? '')
const onImgError = (e: Event) => {
  const t = e.target as HTMLImageElement | null
  if (t) t.src = '/no-image.svg'
}
const invSafe = (raw: Record<string, unknown>) => invText(raw as unknown as ProductItem)

// Handle BaseTable row action events
const onRowCopyId = (id: string | number) => {
  try {
    navigator.clipboard.writeText(String(id))
  } catch (e) {
    void e
  }
  emit('copy-id', id)
}
const onRowEdit = (id: string | number) => {
  emit('edit', id)
  navigateTo(`/products/${id}/update`)
}
const onRowDelete = (id: string | number) => {
  emit('delete', id)
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

// Format with comma as thousands separator per new UI requirement, keep no decimals
function formatVNDNumber(v?: number | null) {
  if (v == null) return ''
  const n = Math.floor(Number(v) || 0)
  // Manual grouping with comma
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
const currencySuffix = 'đ'
</script>

<template>
  <BaseTable :q="q" :row-selection="rowSelection" :pagination="pagination" :query-sync="true" :data="data"
    :loading="loading" title="Danh sách sản phẩm" :columns="columns" :add-button="addButton"
    :row-click-handler="handleRowClick" :total-pages="props.totalPages" :total-records="props.totalRecords" :tabs="tabs"
    search-placeholder="Tìm kiếm sản phẩm" tabs-style="underline" :disable-client-filter="true"
    @row-copy-id="onRowCopyId" @row-edit="onRowEdit" @row-delete="onRowDelete" @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)" @update:pagination="emit('update:pagination', $event)"
    @update:tab="onTabChange" @delete="emit('delete-multi', $event)">
    <!-- Custom name column with image -->
    <template #column-name="{ item }">
      <div class="flex items-center gap-4">
        <div class="h-11 w-11 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
          <img :src="getThumbnail(item)" :alt="getItemName(item)" class="h-full w-full object-cover"
            @error="onImgError">
        </div>
        <div class="flex flex-col">
          <div class="text-[15px] text-gray-900 font-medium">
            {{ getItemName(item) }}
          </div>
          <div class="text-xs text-gray-500">
            SKU: {{ getItemSku(item) || '—' }}
          </div>
        </div>
      </div>
    </template>

    <!-- Custom status column -->
    <!-- Custom price column -->
    <template #column-price="{ item }">
      <div class="text-gray-900 font-medium">
        <template v-if="item.priceMin != null && item.priceMax != null && item.priceMin !== item.priceMax">
          {{ formatVNDNumber(item.priceMin as number) }}-{{ formatVNDNumber(item.priceMax as number) }}{{ currencySuffix
          }}
        </template>
        <template v-else-if="item.priceMin != null">
          {{ formatVNDNumber(item.priceMin as number) }}{{ currencySuffix }}
        </template>
        <template v-else>
          —
        </template>
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
      <div :class="['text-gray-900', invSafe(item).danger ? 'text-red-500' : '']">
        {{ invSafe(item).line1 }}
      </div>
      <div class="text-xs text-gray-400">
        {{ invSafe(item).variants }}
      </div>
    </template>

    <!-- Row actions -->
    <template #row-actions="{ item }">
      <div class="flex items-center space-x-6 justify-end">
        <template v-for="action in props.getRowItems?.({ original: item as unknown as ProductItem }) as any[]"
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
