<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { customersService } from '@/services'
import CustomersTable from '@/components/customers/CustomersTable.vue'
import type { CustomerItem } from '@/services/customers.service'

const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 50 })
const totalRecords = ref(0)
const totalPages = ref(1)

const loading = ref(false)
const data = ref<CustomerItem[]>([])
const totals = ref({ totalSalesAll: 0, totalNetSalesAll: 0 })

const fetchCustomers = async () => {
  loading.value = true
  try {
    const res = await customersService.getCustomers({
      pagination: { start: pagination.value.pageIndex, number: pagination.value.pageSize },
      search: { name: q.value || null, excludeGuests: true },
      sort: { field: 'Id', reverse: false }
    })
    if (res.success && res.data) {
      data.value = res.data.items || []
      totalRecords.value = res.data.totalRecord || 0
      totalPages.value = res.data.numberOfPages || 1
      totals.value.totalSalesAll = res.data.totalSalesAll || 0
      totals.value.totalNetSalesAll = res.data.totalNetSalesAll || 0
    }
  } finally {
    loading.value = false
  }
}

watch([q, () => pagination.value.pageIndex, () => pagination.value.pageSize], () => {
  fetchCustomers()
}, { immediate: true })

const mappedRows = computed(() => data.value.map(c => ({
  id: c.id,
  name: c.fullName,
  code: c.customerCode,
  phone: c.phoneNumber,
  receivable: c.receivable,
  totalSale: c.totalSales ?? c.totalAmount,
  netSale: c.totalNetSales ?? ((c.totalAmount || 0) - (c.paid || 0)),
  avatar: { src: c.avatarUrl ? c.avatarUrl as string : '/no-avatar.jpg', alt: c.fullName }
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
      <UDashboardNavbar title="Customers">
        <template #leading>
          <UDashboardSidebarCollapse />
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
