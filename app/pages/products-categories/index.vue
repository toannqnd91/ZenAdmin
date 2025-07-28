<script setup lang="ts">
// Get service data
const { data, loading, error } = useProductsCategoriesService()
</script>

<template>
  <UDashboardPanel id="products-categories">
    <template #header>
      <UDashboardNavbar title="Danh mục sản phẩm">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        
        <template #right>
          <ProductsCategoriesAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <ProductsCategoriesTable
        :data="data"
        :loading="loading"
        q=""
        :row-selection="{}"
        :pagination="{ pageIndex: 0, pageSize: 10 }"
      />

      <div v-if="error" class="text-error mt-4">
        {{ error }}
      </div>
    </template>
  </UDashboardPanel>
</template>
