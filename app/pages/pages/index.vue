<script setup lang="ts">
import { usePagesService } from '@/composables/usePagesService'

const { isNotificationsSlideoverOpen } = useDashboard()
const {
  q,
  rowSelection,
  pagination,
  pages,
  loading,
  error
} = usePagesService()
</script>

<template>
  <UDashboardPanel id="pages" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Trang nội dung">
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
          <PagesTable
            v-model:q="q"
            v-model:row-selection="rowSelection"
            v-model:pagination="pagination"
            :data="pages"
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
