<script setup lang="ts">
import { useNewsCategoriesService } from '@/composables/useNewsCategoriesService'

const {
  q,
  rowSelection,
  pagination,
  categories,
  loading,
  error,
  getRowItems
} = await useNewsCategoriesService()
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
      <div class="flex flex-col h-full">
        <NewsCategoriesTable
          v-model:q="q"
          v-model:row-selection="rowSelection"
          v-model:pagination="pagination"
          :data="categories"
          :loading="loading"
          :get-row-items="getRowItems"
          class="flex-1 min-h-0"
        />

        <div v-if="error" class="text-error mt-4">
          {{ error }}
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>