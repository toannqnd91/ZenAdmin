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
} = useNewsService()

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
      icon: 'i-lucide-edit'
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
</script>

<template>
  <UDashboardPanel id="news">
    <template #header>
      <UDashboardNavbar title="Tin tức">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <NewsAddModal>
            <UButton
              label="New News"
              color="primary"
              variant="solid"
              icon="i-lucide-plus"
            />
          </NewsAddModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <NewsTable
        v-model:q="q"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :data="news"
        :loading="loading"
        :truncate-text="truncateText"
        :get-row-items="getRowItems"
      />

      <div v-if="error" class="text-error mt-4">
        {{ error }}
      </div>
    </template>
  </UDashboardPanel>
</template>
