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
  formatDate
} = useWidgets()

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
  return widgetType
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special characters except hyphens
}

function getRowItems(row: { original: WidgetInstance }) {
  const widget = row.original
  const normalizedType = normalizeWidgetType(widget.widgetType)
  
  return [
    { type: 'label', label: 'Actions' },
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
          <UDropdownMenu
            :items="widgetTypeMenu"
            :popper="{ placement: 'bottom-end' }"
          >
            <UButton
              label="Thêm widget"
              color="primary"
              variant="solid"
              icon="i-lucide-plus"
            />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="flex flex-col h-full">
        <WidgetsTable
          v-model:q="q"
          v-model:row-selection="rowSelection"
          v-model:pagination="pagination"
          :data="filteredWidgets"
          :loading="loading"
          :get-row-items="getRowItems"
          :format-date="formatDate"
          class="flex-1 min-h-0"
        />
        <div v-if="error" class="text-error mt-4">
          {{ error }}
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
