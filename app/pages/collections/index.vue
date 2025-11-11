<script setup lang="ts">
import { useCollectionsService } from '@/composables/useCollectionsService'
import AddCollectionModal from '@/components/collections/AddCollectionModal.vue'
import type { Collection } from '@/composables/useCollectionsService'

const {
  q,
  pagination,
  collections,
  loading,
  error,
  fetchCollections
} = useCollectionsService()

// Standardized global controls (theme + notifications)
const { isNotificationsSlideoverOpen } = useDashboard()

// Additional reactive state for table
const rowSelection = ref<Record<string, boolean>>({})
const tablePagination = computed({
  get: () => ({ pageIndex: pagination.value.page - 1, pageSize: pagination.value.pageSize }),
  set: (val) => {
    pagination.value.page = val.pageIndex + 1
    pagination.value.pageSize = val.pageSize
  }
})

// Modal state & editing
const showCollectionModal = ref(false)
const editingCollection = ref<Collection | null>(null)
function onAddCollection() {
  editingCollection.value = null
  showCollectionModal.value = true
}
function onEditCollection(c: Collection) {
  editingCollection.value = c
  showCollectionModal.value = true
}
function onCollectionSaved(payload: { id: number | string, name: string }) {
  // Optimistic update
  if (editingCollection.value) {
    collections.value = collections.value.map(it => String(it.id) === String(editingCollection.value!.id) ? { ...it, name: payload.name } : it)
  } else {
    collections.value = [{ id: payload.id as number, name: payload.name, description: '', imageUrl: '', isPublished: true }, ...collections.value]
  }
  editingCollection.value = null
  // Refetch to ensure server state
  fetchCollections()
}

// Handle delete action
const handleDelete = (_selectedIds: number[]) => {
  // Placeholder delete logic
  rowSelection.value = {}
}
</script>

<template>
  <UDashboardPanel id="collections" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Bộ sưu tập" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
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
          <!-- Plain text description, max 30 words -->
          <div class="mb-4 text-gray-600 text-sm">
            Quản lý bộ sưu tập sản phẩm của bạn. Thêm, chỉnh sửa hoặc xóa các bộ sưu tập một cách dễ dàng và nhanh chóng.
          </div>
          <CollectionsTable
            v-model:q="q"
            v-model:row-selection="rowSelection"
            v-model:pagination="tablePagination"
            :data="collections"
            :loading="loading"
            add-in-modal
            @open-add-modal="onAddCollection"
            @open-edit-modal="onEditCollection"
            @delete="handleDelete"
          />
          <div v-if="error" class="text-error mt-4">
            {{ error }}
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
  <AddCollectionModal
    v-model="showCollectionModal"
    :collection="editingCollection"
    @saved="onCollectionSaved"
  />
</template>
