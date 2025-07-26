<script setup lang="ts">

import { ref, computed } from 'vue'
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

const categories = computed(() => data.value.data)
</script>

<template>
    <UDashboardPanel id="news-categories">
        <template #header>
            <UDashboardNavbar title="Danh mục tin tức">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>
        </template>

        <UDashboardToolbar>
            <UInput v-model="q" placeholder="Tìm kiếm danh mục..." icon="i-lucide-search" class="w-full max-w-sm" />
        </UDashboardToolbar>
        <div>
            <h1>News Categories</h1>
            <div v-if="loading">Đang tải...</div>
            <div v-else-if="error">{{ error }}</div>
            <ul v-else>
                <li v-for="cat in categories" :key="cat.id" class="mb-2">
                    <strong>{{ cat.name }}</strong>
                    <div>{{ cat.description }}</div>
                </li>
            </ul>
        </div>
    </UDashboardPanel>
</template>