<script setup lang="ts">
// Get service data (fetch only on client to avoid SSR fetch error)
const { data, loading, error } = useBrandsService()

// Reactive state for table
const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 10 })

// Global controls for standardized header (no warehouse switcher here)
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
      />

      <div v-if="error" class="text-error mt-4">
        {{ error }}
      </div>
    </template>
  </UDashboardPanel>
</template>
