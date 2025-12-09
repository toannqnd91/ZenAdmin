<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { customersService } from '@/services'
import CustomersTable from '@/components/customers/CustomersTable.vue'
import type { CustomerItem } from '@/services/customers.service'

const { isNotificationsSlideoverOpen } = useDashboard()

const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 20 })
const totalRecords = ref(0)
const totalPages = ref(1)

const loading = ref(false)
const refreshing = ref(false)
const data = ref<CustomerItem[]>([])
const totals = ref({ totalSalesAll: 0, totalNetSalesAll: 0 })

const fetchCustomers = async () => {
  const opts = {
    pagination: { start: pagination.value.pageIndex, number: pagination.value.pageSize },
    search: { name: q.value || null, excludeGuests: true },
    sort: { field: 'Id', reverse: true }
  } as const

  const res = await customersService.getCustomersCached(opts, {
    onUpdated: (grid) => {
      data.value = grid.data || []
      totalRecords.value = grid.numberOfRecords || 0
      totalPages.value = grid.numberOfPages || 1
      totals.value.totalSalesAll = 0
      totals.value.totalNetSalesAll = 0
    }
  })

  const grid = res.data
  data.value = grid.data || []
  totalRecords.value = grid.numberOfRecords || 0
  totalPages.value = grid.numberOfPages || 1
  totals.value.totalSalesAll = 0
  totals.value.totalNetSalesAll = 0

  if (res.fromCache) {
    loading.value = false
    refreshing.value = true
    res.refreshPromise?.finally(() => {
      refreshing.value = false
    })
  } else {
    loading.value = false
    refreshing.value = false
  }
}

watch([q, () => pagination.value.pageIndex, () => pagination.value.pageSize], () => {
  fetchCustomers()
}, { immediate: true })

const mappedRows = computed(() => data.value.map(c => ({
  id: c.id,
  name: c.name,
  code: c.customerCode,
  phone: c.phoneNumber,
  receivable: c.currentReceivables ?? 0,
  totalSale: c.totalSales ?? 0,
  netSale: c.netSales ?? 0,
  avatar: { src: '/no-avatar.jpg', alt: c.name }
})))

// Add a synthetic summary row at the top using totals from API
const tableData = computed(() => {
  const sumRow = {
    id: 'summary',
    name: '',
    code: '',
    phone: '',
    receivable: 0,
    totalSale: totals.value.totalSalesAll,
    netSale: totals.value.totalNetSalesAll,
    avatar: { src: '/no-avatar.jpg', alt: '' }
  }
  return [sumRow, ...mappedRows.value]
})
</script>

<template>
  <UDashboardPanel id="customers">
    <template #header>
      <UDashboardNavbar title="Customers" :ui="{ right: 'gap-3' }">
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
      <CustomersTable
        v-model:q="q"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :data="tableData"
        :loading="loading"
        :total-records="totalRecords"
        :total-pages="totalPages"
      />
    </template>
  </UDashboardPanel>
</template>
