<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TableColumn } from '@nuxt/ui'

import { useApiFetch } from '@/composables/useApiFetch'
import { API_ENDPOINTS } from '@/utils/api'
import type { NewsCategoriesApiResponse, NewsCategory } from '@/types/newsCategory'

const q = ref('')

const body = {
  Pagination: {
    Start: 0,
    TotalItemCount: 0,
    Number: 20,
    NumberOfPages: 10
  },
  Search: {
    QueryObject: {
      Name: null
    }
  },
  Sort: {
    Field: 'Id',
    Reverse: false
  }
}

const { data, pending: loading, error } = await useApiFetch<NewsCategoriesApiResponse>(API_ENDPOINTS.newsCategories, {
  method: 'POST',
  body,
  default: () => ({ code: '', success: false, message: '', data: [] })
})

const categories = computed(() => data.value.data || [])

const filtered = computed(() =>
  categories.value.filter(cat => cat.name.toLowerCase().includes(q.value.toLowerCase()))
)

const columns: TableColumn<NewsCategory>[] = [
  // { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Tên danh mục' },
  { accessorKey: 'description', header: 'Mô tả' }
]

watch(data, (val) => {
  console.log('API Response:', val)
}, { immediate: true, deep: true })
</script>

<template>
  <UDashboardPanel id="news-categories">
    <template #header>
      <UDashboardNavbar title="Danh mục tin tức">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <NewsCategoriesAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-4">
        <UInput
          v-model="q"
          placeholder="Tìm kiếm danh mục..."
          icon="i-lucide-search"
          class="max-w-sm"
        />

        <NewsCategoriesDeleteModal>
          <UButton label="Delete" color="error" variant="subtle" icon="i-lucide-trash" />
        </NewsCategoriesDeleteModal>
      </div>

      <UTable
        :data="filtered"
        :columns="columns"
        :loading="loading"
        class="shrink-0"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default'
        }"
      />

      <div v-if="error" class="text-error mt-4">{{ error }}</div>
    </template>
  </UDashboardPanel>
</template>
