<script setup lang="ts">
import PriceBooksTable from '@/components/price-book/PriceBooksTable.vue'
import CreatePriceBookModal from '@/components/price-book/CreatePriceBookModal.vue'
import { usePriceBooksService } from '@/composables/usePriceBooksService'

definePageMeta({ layout: 'default' })
useHead({ title: 'Bảng giá' })

const {
  q,
  rowSelection,
  pagination,
  priceBooks,
  loading,
  error,
  totalPages,
  totalRecords,
  currentTab,
  fetchPriceBooks
} = usePriceBooksService()

onMounted(() => {
  fetchPriceBooks()
})

const { isNotificationsSlideoverOpen } = useDashboard()
const showCreateModal = ref(false)
const router = useRouter()
function onSelectCreateType(t: 'branch' | 'customer-group') {
  // Use router.push to ensure client-side navigation from modal click
  router.push({ path: '/pricebooks/create', query: { type: t } })
}
</script>

<template>
  <UDashboardPanel id="price-book" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Bảng giá" :ui="{ right: 'gap-3' }">
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
          <PriceBooksTable
            v-model:q="q"
            v-model:row-selection="rowSelection"
            v-model:pagination="pagination"
            :data="priceBooks"
            :loading="loading"
            :total-pages="totalPages"
            :total-records="totalRecords"
            @add="showCreateModal = true"
            @update:tab="(v:string) => currentTab = v as any"
          />
          <CreatePriceBookModal
            v-model="showCreateModal"
            @select="onSelectCreateType"
          />
          <div v-if="error" class="text-error mt-4">
            {{ error }}
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
