<script setup lang="ts">
import { useNewsService } from '@/composables/useNewsService'
import type { NewsItem } from '@/composables/useNews'

const {
  q,
  filteredNews,
  loading,
  error,
  truncateContent,
  deleteNews,
  deleteNewsMulti,
  pagination,
  totalPages,
  totalRecords,
  fetchNews
} = await useNewsService()

const { isNotificationsSlideoverOpen } = useDashboard()

// For compatibility with existing NewsTable component
// Transform service data to match NewsTable expected format
const news = computed(() =>
  filteredNews.value.map(item => ({
    id: item.id,
    title: item.title,
    desc: item.desc, // Already matches now
    url: item.url,
    content: item.content,
    imageUrl: item.imageUrl,
    createdDate: item.createdDate, // Already matches now
    categories: item.categories || [] // Already matches now
  } as NewsItem))
)

const rowSelection = ref({})
// pagination now provided by composable

function truncateText(text: string | null | undefined, wordLimit: number = 20): string {
  return truncateContent(text || '', wordLimit * 5) // Adjust word count to character count
}

function getRowItems(row: { original: { id: number } }) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      label: 'View',
      icon: 'i-lucide-eye'
    },
    {
      label: 'Edit',
      icon: 'i-lucide-edit',
      onSelect: () => navigateTo(`/news/${row.original.id}/edit`)
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => deleteNews(row.original.id)
    }
  ]
}

// Handle row click to navigate to update page
function handleRowClick(item: { id: number | string }) {
  navigateTo(`/news/${item.id}/update`)
}

function onRowEdit(id: string | number) {
  navigateTo(`/news/${id}/update`)
}
async function onRowDelete(id: string | number) {
  if (confirm('Xoá tin tức này?')) {
    await deleteNews(Number(id))
    await fetchNews()
  }
}

async function onRowMultiDelete(ids: (string | number)[]) {
  if (!ids.length) return
  if (confirm(`Xoá ${ids.length} tin tức đã chọn?`)) {
    await deleteNewsMulti(ids.map(Number))
    await fetchNews()
    rowSelection.value = {} // Uncheck all after delete
  }
}
</script>

<template>
  <UDashboardPanel id="news" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Tin tức" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <!-- Divider before global controls -->
          <div class="h-5 w-px bg-gray-200 mx-2" />

          <!-- Color mode + notifications -->
          <UColorModeButton />
          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col h-full">
        <NewsTable
          v-model:q="q"
          v-model:row-selection="rowSelection"
          v-model:pagination="pagination"
          :data="news"
          :loading="loading"
          :total-pages="totalPages"
          :total-records="totalRecords"
          :truncate-text="truncateText"
          :get-row-items="getRowItems"
          :on-row-click="handleRowClick"
          @edit="onRowEdit"
          @delete="onRowDelete"
          @delete-multi="onRowMultiDelete"
        />

        <div v-if="error" class="text-error mt-4">
          {{ error }}
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
