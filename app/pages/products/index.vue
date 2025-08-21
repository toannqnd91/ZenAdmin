<script setup lang="ts">
import { useProductsService } from '@/composables/useProductsService'

const { isNotificationsSlideoverOpen } = useDashboard()

const {
  q,
  rowSelection,
  pagination,
  products,
  loading,
  error,
  deleteProduct,
  totalPages
} = useProductsService()

const onRowCopyId = (id: string | number) => {
  try {
    navigator.clipboard.writeText(String(id))
  } catch (e) {
    void e
  }
}
const onRowEdit = (id: string | number) => {
  navigateTo(`/products/${id}/update`)
}
const onRowDelete = (id: string | number) => {
  if (confirm('Xoá sản phẩm này?')) {
    deleteProduct(Number(id))
  }
}
</script>

<template>
  <UDashboardPanel id="products" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Sản phẩm">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        
        <template #right>
          <UColorModeButton />
          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
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
            :total-pages="totalPages"
            @copy-id="onRowCopyId"
            @edit="onRowEdit"
            @delete="onRowDelete"
          />
          <div v-if="error" class="text-error mt-4">
            {{ error }}
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
