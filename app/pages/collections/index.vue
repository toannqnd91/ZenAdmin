<script setup lang="ts">
import { useCollectionsService } from '@/composables/useCollectionsService'

const {
  q,
  pagination,
  collections,
  loading,
  error
} = useCollectionsService()

// Additional reactive state for table
const rowSelection = ref<Record<string, boolean>>({})
const tablePagination = computed({
  get: () => ({ pageIndex: pagination.value.page - 1, pageSize: pagination.value.pageSize }),
  set: (val) => {
    pagination.value.page = val.pageIndex + 1
    pagination.value.pageSize = val.pageSize
  }
})
</script>

<template>
  <UDashboardPanel id="collections" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Bộ sưu tập">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full flex flex-col h-full">
        <div class="flex-1 min-h-0">
          <CollectionsTable
            v-model:q="q"
            v-model:row-selection="rowSelection"
            v-model:pagination="tablePagination"
            :data="collections"
            :loading="loading"
          />
          <div v-if="error" class="text-error mt-4">
            {{ error }}
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>