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
  <UDashboardPanel id="products">
    <template #header>
      <UDashboardNavbar title="Sản phẩm">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <ProductsAddModal>
            <UButton
              label="New Product"
              color="primary"
              variant="solid"
              icon="i-lucide-plus"
            />
          </ProductsAddModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <ProductsTable
        v-model:q="q"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :data="products"
        :loading="loading"
        :truncate-text="truncateText"
        :get-first-image-url="getFirstImageUrl"
        :get-row-items="getRowItems"
      />

      <div v-if="error" class="text-error mt-4">
        {{ error }}
      </div>
    </template>
  </UDashboardPanel>
</template>