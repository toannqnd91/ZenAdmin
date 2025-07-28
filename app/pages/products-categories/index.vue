<script setup lang="ts">
const {
  // State
  q,
  rowSelection,
  table,
  
  // Data
  categories,
  filtered,
  loading,
  error,
  
  // Table config
  columns,
  
  // Table API
  tableApi
} = await useProductsCategoriesTable()
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
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="q"
          placeholder="Tìm kiếm danh mục..."
          icon="i-lucide-search"
          class="max-w-sm"
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <ProductsCategoriesDeleteModal :count="tableApi?.getFilteredSelectedRowModel().rows.length">
            <UButton
              v-if="tableApi?.getFilteredSelectedRowModel().rows.length"
              label="Delete"
              color="error"
              variant="subtle"
              icon="i-lucide-trash"
            >
              <template #trailing>
                <UKbd>
                  {{ tableApi?.getFilteredSelectedRowModel().rows.length }}
                </UKbd>
              </template>
            </UButton>
          </ProductsCategoriesDeleteModal>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:row-selection="rowSelection"
        :data="filtered"
        :columns="columns"
        :loading="loading"
        class="shrink-0"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-3 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r first:w-10',
          td: 'border-b border-default first:w-10'
        }"
      />

      <div v-if="error" class="text-error mt-4">
        {{ error }}
      </div>

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="(tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="tableApi?.getState().pagination.pageSize"
            :total="tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
