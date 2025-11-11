<script setup lang="ts">
// Get service data (fetch only on client to avoid SSR fetch error)
const { data, loading, error } = useProductsCategoriesService()

// Reactive state for table
const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 10 })

// Global notifications slideover + color mode (standardized header controls)
const { isNotificationsSlideoverOpen } = useDashboard()
</script>

<template>
  <UDashboardPanel id="products-categories" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Danh mục sản phẩm" :ui="{ right: 'gap-3' }" class="bg-white">
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
      <div class="w-full flex flex-col h-full">
        <div class="flex-1 min-h-0">
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
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
