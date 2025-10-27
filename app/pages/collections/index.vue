<script setup lang="ts">
import { useCollectionsService } from '@/composables/useCollectionsService'

const {
  q,
  pagination,
  collections,
  loading,
  error
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

// Handle delete action
const handleDelete = (selectedIds: number[]) => {
  console.log('Delete collections with IDs:', selectedIds)
  // TODO: Implement delete logic
  // Example: await collectionsService.deleteCollections(selectedIds)
  // Reset selection after delete
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
            @delete="handleDelete"
          />
          <div v-if="error" class="text-error mt-4">
            {{ error }}
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
