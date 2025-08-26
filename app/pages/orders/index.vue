<template>
  <UDashboardPanel id="orders">
    <template #header>
      <UDashboardNavbar title="Đơn hàng">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <OrdersTable
        v-model:q="q"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :data="data"
        :loading="loading"
        :tabs="tabs"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import OrdersTable from '@/components/orders/OrdersTable.vue'

const tabs = [
  { label: 'Tất cả', value: 'all', count: 1 },
  { label: 'Chờ xác nhận', value: 'pending', count: 1 },
  { label: 'Đã thanh toán', value: 'paid', count: 0 },
  { label: 'Đã giao hàng', value: 'delivered', count: 0 },
  { label: 'Đã hủy', value: 'cancelled', count: 0 }
]
const currentTab = ref('all')

// Dữ liệu test đơn hàng
const data = ref([
  { id: 1, code: 'ORD001', customer: 'Nguyễn Văn A', total: 1200000, status: 'Đã thanh toán', createdAt: '2025-08-25' },
  { id: 2, code: 'ORD002', customer: 'Trần Thị B', total: 850000, status: 'Chờ xác nhận', createdAt: '2025-08-26' },
  { id: 3, code: 'ORD003', customer: 'Lê Văn C', total: 450000, status: 'Đã hủy', createdAt: '2025-08-27' },
  { id: 4, code: 'ORD004', customer: 'Phạm Thị D', total: 2100000, status: 'Đã giao hàng', createdAt: '2025-08-27' },
])

const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 10 })
const loading = ref(false)
</script>

<style scoped>
</style>