<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'

interface ProductCategory {
  id: number | string
  name: string
  description?: string
  imageUrl?: string | null
  productCount?: number
  parentId?: number | string | null
  children?: ProductCategory[]
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

// Table configuration - explicit order: name, description, productCount
const columns: TableColumn[] = [
  { key: 'name', label: 'Tên danh mục', class: 'py-3 text-left font-medium', align: 'left' },
  { key: 'description', label: 'Mô tả', class: 'py-3 text-left font-medium', align: 'left' },
  { key: 'productCount', label: 'Sản phẩm', class: 'py-3 text-right font-medium pr-4', align: 'right' }
]

// Column widths align with the columns order above: [Tên danh mục, Mô tả, Sản phẩm]
// Use explicit px units for colgroup widths to avoid browser ignoring raw numbers
const colWidths = [
  '400px', // Tên danh mục
  '300px', // Mô tả
  '150px' // Sản phẩm
]

const addButton = {
  label: 'Thêm danh mục',
  href: '/products-categories/create'
}

const handleRowClick = (item: Record<string, unknown>) => {
  const categoryItem = item as unknown as ProductCategory
  navigateTo(`/products-categories/${categoryItem.id}/update`)
}

// --- Tree helpers ---
type CatNode = ProductCategory & { children: CatNode[] }

function toKey(v: string | number | null | undefined) {
  if (v === null || v === undefined) return ''
  return String(v)
}

// Build tree from a FLAT array (parentId links)
function buildTreeFromFlat(items: ProductCategory[]): CatNode[] {
  // Normalize keys to string to avoid number vs string mismatch
  const map = new Map<string, CatNode>()
  const roots: CatNode[] = []
  // Create nodes
  for (const it of items) {
    map.set(toKey(it.id) || String(it.id), { ...it, children: [] })
  }
  // Attach children by parentId
  for (const node of map.values()) {
    const pRaw = node.parentId as unknown as (string | number | null | undefined)
    const p = toKey(pRaw)
    // Parent considered empty/zero => root
    if (!p || p === '0' || !map.has(p)) {
      roots.push(node)
    } else {
      map.get(p)!.children.push(node)
    }
  }
  // Sort children by name for stable view
  const sortRec = (ns: CatNode[]) => {
    ns.sort((a, b) => String(a.name).localeCompare(String(b.name)))
    for (const n of ns) sortRec(n.children)
  }
  sortRec(roots)
  return roots
}

// Build tree from an already NESTED array (children[] present)
function buildTreeFromNested(items: ProductCategory[]): CatNode[] {
  const toNode = (it: ProductCategory): CatNode => ({
    ...it,
    children: Array.isArray(it.children) ? it.children.map(toNode) : []
  })
  // Sort recursively by name for deterministic order
  const sortRec = (ns: CatNode[]) => {
    ns.sort((a, b) => String(a.name).localeCompare(String(b.name)))
    for (const n of ns) sortRec(n.children)
  }
  const roots = items.map(toNode)
  sortRec(roots)
  return roots
}

// Expanded state for nodes with children (start fully collapsed per requirement)
const expanded = ref<Set<string>>(new Set())

// Build roots (either nested children provided by API or flat list)
const treeRoots = computed<CatNode[]>(() => {
  const hasNested = props.data?.some(it => Array.isArray(it.children) && it.children.length > 0)
  return hasNested ? buildTreeFromNested(props.data) : buildTreeFromFlat(props.data)
})

function toggleExpand(id: string | number) {
  const key = String(id)
  const set = new Set(expanded.value)
  if (set.has(key)) set.delete(key)
  else set.add(key)
  expanded.value = set
}

function flatten(nodes: CatNode[], depth = 0, parentExpanded = true): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = []
  for (const n of nodes) {
    // Only visible if parentExpanded is true
    if (parentExpanded) {
      const hasChildren = n.children && n.children.length > 0
      const isExpanded = expanded.value.has(String(n.id))
      out.push({
        id: n.id,
        name: n.name,
        description: n.description,
        imageUrl: n.imageUrl,
        productCount: typeof n.productCount === 'number' ? n.productCount : 0,
        __depth: depth,
        __hasChildren: hasChildren,
        __expanded: isExpanded
      })
      if (hasChildren) {
        out.push(...flatten(n.children, depth + 1, isExpanded))
      }
    }
  }
  return out
}

const tableData = computed(() => flatten(treeRoots.value))

// Debug: log columns order
onMounted(() => {
  console.log('[ProductsCategoriesTable] Columns order:', columns.map(c => c.key))
})
</script>

<template>
  <BaseTable
    key="products-categories-table-v2"
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
    row-padding-y="py-2"
    search-placeholder="Tìm kiếm danh mục..."
    @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)"
    @delete="ids => emit('delete', ids)"
  >
    <!-- Custom name column with image -->
    <template #column-name="{ item }">
        <div class="flex items-center min-h-[36px]">
          <button
            v-if="(item as any).__hasChildren"
            type="button"
            class="h-6 w-6 inline-flex items-center justify-center text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded flex-shrink-0 mr-2"
            aria-label="Toggle children"
            :style="{ marginLeft: `${(item as any).__depth * 16}px` }"
            @click.stop.prevent="toggleExpand((item as any).id)"
          >
            <UIcon :name="(item as any).__expanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="h-4 w-4 transition-transform" />
          </button>
          <div class="h-8 w-8 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0 mr-2">
            <img
              :src="(item as any).imageUrl || '/no-image.svg'"
              :alt="(item as any).name"
              class="h-full w-full object-cover"
              @error="(e: any) => e.target && (e.target.src='/no-image.svg')"
            >
          </div>
          <div class="text-sm text-gray-900 font-medium">
            {{ (item as any).name }}
          </div>
        </div>
    </template>

    <!-- Custom description column -->
    <template #column-description="{ item }">
      <div class="text-sm text-gray-600">
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
