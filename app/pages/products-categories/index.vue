<script setup lang="ts">
// Get service data (fetch only on client to avoid SSR fetch error)
const { data, loading, error } = useProductsCategoriesService()

// Reactive state for table
const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 10 })
</script>

<template>
  <UDashboardPanel id="products-categories">
    <template #header>
      <UDashboardNavbar title="Danh mục sản phẩm">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        
        <!-- <template #right>
          <ProductsCategoriesAddModal />
        </template> -->
      </UDashboardNavbar>
    </template>

    <template #body>
      <ProductsCategoriesTable
        v-model:q="q"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :data="data"
        :loading="loading"
      />

      <div v-if="error" class="text-error mt-4">
        {{ error }}
      </div>
    </template>
  </UDashboardPanel>
</template>
