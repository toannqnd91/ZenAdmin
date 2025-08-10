<script setup lang="ts">
import { useProductsService } from '@/composables/useProductsService'

const {
  q,
  rowSelection,
  pagination,
  products,
  loading,
  error,
  truncateText,
  getFirstImageUrl,
  getRowItems
} = useProductsService()
</script>

<template>
  <UDashboardPanel id="products" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Sản phẩm">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <!-- <template #right>
          <UButton
            label="Thêm sản phẩm"
            color="primary"
            variant="solid"
            icon="i-lucide-plus"
            @click="navigateTo('/products/create')"
          />
        </template> -->
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full flex flex-col h-full">
        <div class="flex-1 min-h-0">
          <ProductsTable
              v-model:q="q"
              v-model:row-selection="rowSelection"
              v-model:pagination="pagination"
              :data="products"
              :loading="loading"
              :truncate-text="truncateText"
              :get-first-image-url="getFirstImageUrl"
              :get-row-items="getRowItems"
              class="flex-1 min-h-0"
            />
          <div v-if="error" class="text-error mt-4">
            {{ error }}
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>