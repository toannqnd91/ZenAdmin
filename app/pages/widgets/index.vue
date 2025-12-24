<script setup lang="ts">
import { useWidgets } from '@/composables/useWidgets'
import type { WidgetInstance } from '@/composables/useWidgets'
import WidgetsTable from '@/components/widgets/WidgetsTable.vue'

const {
  q,
  loading,
  error,
  filteredWidgets,
  fetchWidgets,
  deleteWidget,
  formatDate,
  reorderWidgets,
  widgets
} = useWidgets()

// Handle reorder emitted by WidgetsTable
interface ReorderItem {
  id: number
  [k: string]: unknown
}
async function handleReorder(newOrder: unknown) {
  const arr = (Array.isArray(newOrder) ? newOrder : []) as ReorderItem[]
  // newOrder is array of items after drag (from BaseTable draggableItems)
  // Map to WidgetInstance preserving current displayOrder order
  const mapped = arr.map((it, idx: number) => {
    const found = widgets.value.find(w => w.id === it.id)
    if (found) return { ...found, displayOrder: idx }
    // Fallback: create minimal object if not found
    return {
      id: Number(it.id),
      name: 'Widget ' + it.id,
      widgetType: 'unknown',
      widgetZone: 'unknown',
      createdOn: new Date().toISOString(),
      editUrl: '',
      publishStart: null,
      publishEnd: null,
      displayOrder: idx
    } as WidgetInstance
  }) as WidgetInstance[]
  await reorderWidgets(mapped as WidgetInstance[])
  await fetchWidgets()
}

const rowSelection = ref({})
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const widgetTypes = [
  { label: 'Carousel Widget', value: 'carousel' },
  { label: 'Category Widget', value: 'category' },
  { label: 'Html Widget', value: 'html' },
  { label: 'Product Widget', value: 'product' },
  { label: 'News Widget', value: 'news' },
  { label: 'Recently Viewed Widget', value: 'recently-viewed' },
  { label: 'Simple Product Widget', value: 'simple-product' },
  { label: 'Simple News Widget', value: 'simple-news' },
  { label: 'Custom Data Widget', value: 'custom-data' },
  { label: 'SpaceBar Widget', value: 'spacebar' }
]

const widgetTypeMenu = widgetTypes.map((type) => {
  let page = ''
  switch (type.value) {
    case 'carousel':
      page = 'create-carousel'
      break
    case 'category':
      page = 'create-category'
      break
    case 'html':
      page = 'create-html'
      break
    case 'product':
      page = 'create-product'
      break
    case 'news':
      page = 'create-news'
      break
    case 'recently-viewed':
      page = 'create-recently-viewed'
      break
    case 'simple-product':
      page = 'create-simple-product'
      break
    case 'simple-news':
      page = 'create-simple-news'
      break
    case 'custom-data':
      page = 'create-custom-data'
      break
    case 'spacebar':
      page = 'create-spacebar'
      break
    default:
      page = 'create'
  }
  return {
    label: type.label,
    to: `/widgets/${page}`
  }
})

// Function to normalize widget type for URL
function normalizeWidgetType(widgetType: string): string {
  const type = widgetType
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  if (type.includes('custom-data')) return 'custom-data-widget'
  if (type.includes('carousel')) return 'carousel-widget'
  if (type.includes('category')) return 'category-widget'
  if (type.includes('html')) return 'html-widget'
  if (type.includes('product')) return 'product-widget'
  if (type.includes('recently-viewed')) return 'recently-viewed-widget'
  if (type.includes('simple-product')) return 'simple-product-widget'
  if (type.includes('simple-news')) return 'simple-news-widget'
  // Chỉ còn lại 'news-widget' cho các loại news khác
  if (type.includes('news')) return 'news-widget'
  if (type.includes('spacebar')) return 'spacebar-widget'
  return type + '-widget'
}

function getRowItems(row: { original: WidgetInstance }) {
  const widget = row.original
  const normalizedType = normalizeWidgetType(widget.widgetType)

  return [
    { type: 'label', label: 'Actions' },
    { label: 'Translation', icon: 'i-lucide-languages', onSelect: () => navigateTo(`/widgets/${widget.id}/translation`) },
    { label: 'Edit', icon: 'i-lucide-edit', onSelect: () => navigateTo(`/widgets/${widget.id}/${normalizedType}`) },
    { type: 'separator' },
    { label: 'Delete', icon: 'i-lucide-trash', color: 'error', onSelect: () => deleteWidget(widget.id) }
  ]
}

onMounted(fetchWidgets)
</script>

<template>
  <UDashboardPanel id="widgets" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Widgets">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <!-- Add widget button moved into the table topbar -->
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="flex flex-col h-full">
        <WidgetsTable v-model:q="q" v-model:row-selection="rowSelection" v-model:pagination="pagination"
          :data="filteredWidgets" :loading="loading" :add-button-dropdown-items="widgetTypeMenu"
          :get-row-items="getRowItems" :format-date="formatDate" @reorder="(newOrder) => handleReorder(newOrder)" />
        <div v-if="error" class="text-error mt-4">
          {{ error }}
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Translation Modal -->
  <TranslationModal v-model="isTranslationModalOpen" entity-type="WidgetInstanceDTO"
    :entity-id="translatingWidget?.id || 0" :current-name="translatingWidget?.name || ''"
    @saved="handleTranslationSaved" />
</template>

<style scoped>
/* Drag visuals aligned with links page */
.ghost {
  opacity: 0.6;
  background: rgba(59, 130, 246, .10);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}

.chosen {
  opacity: .95;
  background: rgba(59, 130, 246, .13);
}

.drag {
  opacity: .98;
  background: rgba(59, 130, 246, .16);
  transition: background-color .15s ease, opacity .15s ease, box-shadow .15s ease;
}
</style>
