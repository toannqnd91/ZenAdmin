<script setup lang="ts">
import AddBrandModal from '@/components/brands/AddBrandModal.vue'
import type { Brand } from '@/services/brand.service'
// Get service data (fetch only on client to avoid SSR fetch error)
const { data, loading, error, fetchBrands } = useBrandsService()

// Reactive state for table
const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 10 })

// Modal state & editing
const showAddBrandModal = ref(false)
const editingBrand = ref<Brand | null>(null)
function onAddBrand() {
  editingBrand.value = null
  showAddBrandModal.value = true
}
function onEditBrand(b: Brand) {
  editingBrand.value = b
  showAddBrandModal.value = true
}
interface NewBrandLite { id: string | number, name: string, slug: string, isPublished: boolean, logoUrl: string }
function onBrandSaved(b: { id: string | number, name: string }) {
  // Optimistic update: if editing, replace; else prepend
  if (editingBrand.value) {
    data.value = data.value.map(it => String(it.id) === String(editingBrand.value!.id) ? { ...it, name: b.name } : it)
  } else {
    const lite: NewBrandLite = { id: b.id, name: b.name, slug: '', isPublished: true, logoUrl: '' }
    data.value = [lite as unknown as Brand, ...data.value]
  }
  editingBrand.value = null
  fetchBrands()
}

// Global controls for standardized header
const { isNotificationsSlideoverOpen } = useDashboard()
</script>

<template>
  <UDashboardPanel id="brands">
    <template #header>
      <UDashboardNavbar title="Thương hiệu" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <!-- Divider before global controls -->
          <div class="h-5 w-px bg-gray-200 mx-2" />

          <!-- Color mode + notifications -->
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
      <BrandsTable
        v-model:q="q"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :data="data"
        :loading="loading"
        add-in-modal
        @open-add-modal="onAddBrand"
        @open-edit-modal="onEditBrand"
      />

      <div v-if="error" class="text-error mt-4">
        {{ error }}
      </div>
    </template>
  </UDashboardPanel>
  <AddBrandModal
    v-model="showAddBrandModal"
    :brand="editingBrand"
    @saved="onBrandSaved"
  />
</template>
