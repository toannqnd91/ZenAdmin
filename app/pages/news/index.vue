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

// Delete confirmation modal
const isDeleteModalOpen = ref(false)
const deleteTarget = ref<{ id: string | number, title: string } | null>(null)
const isDeleting = ref(false)

function truncateText(text: string | null | undefined, wordLimit: number = 20): string {
  return truncateContent(text || '', wordLimit * 5) // Adjust word count to character count
}

function getRowItems(row: { original: { id: string | number } }) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      label: 'Translation',
      icon: 'i-lucide-languages',
      onSelect: () => navigateTo(`/news/${row.original.id}/translation`)
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        const newsItem = news.value.find(n => n.id === row.original.id)
        deleteTarget.value = { id: row.original.id, title: newsItem?.title || 'tin tức này' }
        isDeleteModalOpen.value = true
      }
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
  const newsItem = news.value.find(n => n.id === id)
  deleteTarget.value = { id, title: newsItem?.title || 'tin tức này' }
  isDeleteModalOpen.value = true
}

async function handleConfirmDelete() {
  if (!deleteTarget.value) return

  isDeleting.value = true
  try {
    await deleteNews(Number(deleteTarget.value.id))
    await fetchNews()
    isDeleteModalOpen.value = false
    deleteTarget.value = null
  } catch (error) {
    console.error('Error deleting news:', error)
  } finally {
    isDeleting.value = false
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
          <UButton label="Quản lý danh mục" icon="i-lucide-folder-cog" variant="ghost" color="neutral"
            to="/news-categories" />

          <!-- Divider before global controls -->
          <div class="h-5 w-px bg-gray-200 mx-2" />

          <!-- Color mode + notifications -->
          <UColorModeButton />
          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton color="neutral" variant="ghost" square @click="isNotificationsSlideoverOpen = true">
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
        <NewsTable v-model:q="q" v-model:row-selection="rowSelection" v-model:pagination="pagination" :data="news"
          :loading="loading" :total-pages="totalPages" :total-records="totalRecords" :truncate-text="truncateText"
          :get-row-items="getRowItems" :on-row-click="handleRowClick" @edit="onRowEdit" @delete="onRowDelete"
          @delete-multi="onRowMultiDelete" />

        <div v-if="error" class="text-error mt-4">
          {{ error }}
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Delete Confirmation Modal -->
  <ConfirmDeleteModal v-model:is-open="isDeleteModalOpen" title="Xác nhận xoá tin tức"
    :message="`Bạn có chắc chắn muốn xoá tin tức &quot;${deleteTarget?.title}&quot;?`" :loading="isDeleting"
    @confirm="handleConfirmDelete" />
</template>
