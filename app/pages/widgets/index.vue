


<script setup lang="ts">
import { useWidgets } from '@/composables/useWidgets'
import WidgetsTable from '@/components/widgets/WidgetsTable.vue'

const {
  q,
  loading,
  error,
  filteredWidgets,
  fetchWidgets,
  deleteWidget,
  formatDate
} = useWidgets()

const rowSelection = ref({})
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

function getRowItems(row: any) {
  return [
    { type: 'label', label: 'Actions' },
    { label: 'Edit', icon: 'i-lucide-edit', onSelect: () => navigateTo(`/widgets/${row.original.id}/edit`) },
    { type: 'separator' },
    { label: 'Delete', icon: 'i-lucide-trash', color: 'error', onSelect: () => deleteWidget(row.original.id) }
  ]
}

onMounted(fetchWidgets)
</script>

<template>
  <UDashboardPanel id="widgets" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Widgets">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            label="Thêm widget"
            color="primary"
            variant="solid"
            icon="i-lucide-plus"
            @click="navigateTo('/widgets/create')"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="flex flex-col h-full">
        <WidgetsTable
          v-model:q="q"
          v-model:row-selection="rowSelection"
          v-model:pagination="pagination"
          :data="filteredWidgets"
          :loading="loading"
          :get-row-items="getRowItems"
          :format-date="formatDate"
          class="flex-1 min-h-0"
        />
        <div v-if="error" class="text-error mt-4">
          {{ error }}
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
