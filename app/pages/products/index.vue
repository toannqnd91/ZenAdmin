<script setup lang="ts">
import { useProductsService } from '@/composables/useProductsService'
import type { WarehouseOption } from '@/components/WarehouseSwitcher.vue'
import { useGlobalWarehouse } from '@/composables/useWarehouse'

const { isNotificationsSlideoverOpen } = useDashboard()

const {
  q,
  warehouseId,
  rowSelection,
  pagination,
  products,
  loading,
  error,
  deleteProduct,
  deleteProductsMulti,
  fetchProducts,
  totalPages,
  totalRecords
} = useProductsService()

// Bind WarehouseSwitcher to global warehouse selection and sync to products filter
const { selectedWarehouse: globalWarehouse, setWarehouse } = useGlobalWarehouse()

const selectedWarehouse = computed<WarehouseOption | null>({
  get() {
    const sw = globalWarehouse.value
    if (sw && sw.id !== null && sw.id !== undefined && String(sw.id).trim() !== '') {
      return { id: sw.id, name: sw.name }
    }
    return { id: null, name: 'Tất cả chi nhánh' }
  },
  set(v) {
    if (!v) {
      setWarehouse(null)
      return
    }
    const id = v.id == null ? null : (typeof v.id === 'number' ? v.id : Number(v.id))
    setWarehouse({ id, name: v.name })
  }
})

watch(selectedWarehouse, (val) => {
  warehouseId.value = val?.id ?? null
})

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
async function onRowDelete(id: string | number) {
  if (!confirm('Xoá sản phẩm này?')) return
  try {
    await deleteProduct(Number(id))
    await fetchProducts()
    // chỉ clear selection khi đã xác nhận và xóa thành công
    rowSelection.value = {}
  } catch (e) {
    // đơn giản: log và thông báo người dùng
    console.error(e)
    alert('Xoá thất bại, vui lòng thử lại')
  }
}

async function onRowMultiDelete(ids: (string | number)[]) {
  if (!ids.length) return
  if (!confirm(`Xoá ${ids.length} sản phẩm đã chọn?`)) return
  try {
    await deleteProductsMulti(ids.map(Number))
    await fetchProducts()
    // chỉ clear selection khi đã xác nhận và xóa thành công
    rowSelection.value = {}
  } catch (e) {
    console.error(e)
    alert('Xoá nhiều sản phẩm thất bại, vui lòng thử lại')
  }
}
</script>

<template>
  <UDashboardPanel id="products" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Sản phẩm" :ui="{ right: 'gap-3' }" class="bg-white">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <WarehouseSwitcher
            v-model="selectedWarehouse"
            :borderless="true"
            :auto-width="true"
          />
          <div class="h-5 w-px bg-gray-200 mx-2" />
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
            :total-records="totalRecords"
            @copy-id="onRowCopyId"
            @edit="onRowEdit"
            @delete="onRowDelete"
            @delete-multi="onRowMultiDelete"
          />
          <div v-if="error" class="text-error mt-4">
            {{ error }}
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
