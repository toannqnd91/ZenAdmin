<script setup lang="ts">
import { useNewsService } from '@/composables/useNewsService'
import type { NewsItem } from '@/composables/useNews'

const {
  q,
  news: newsData,
  filteredNews,
  loading,
  error,
  truncateContent,
  formatDate,
  createNews,
  updateNews,
  deleteNews
} = await useNewsService()

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
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

function truncateText(text: string | null | undefined, wordLimit: number = 20): string {
  return truncateContent(text || '', wordLimit * 5) // Adjust word count to character count
}

function getRowItems(row: any) {
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
function handleRowClick(row: NewsItem) {
  navigateTo(`/news/${row.id}/update`)
}
</script>

<template>
  <UDashboardPanel id="news" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Tin tức">
        <template #leading>
          <UDashboardSidebarCollapse />
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
          :truncate-text="truncateText"
          :get-row-items="getRowItems"
          :on-row-click="handleRowClick"
        />

        <div v-if="error" class="text-error mt-4">
          {{ error }}
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
