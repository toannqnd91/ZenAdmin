<script setup lang="ts">
import { ref, computed } from 'vue'
import OrdersTable from '@/components/orders/OrdersTable.vue'

// Dữ liệu riêng cho từng tab
const ordersAll = [
  { id: 1, code: 'ORD001', customer: 'Nguyễn Văn A', total: 1200000, status: 'Đã thanh toán', createdAt: '2025-08-25' },
  { id: 2, code: 'ORD002', customer: 'Trần Thị B', total: 850000, status: 'Chờ xác nhận', createdAt: '2025-08-26' },
  // ... thêm nhiều dữ liệu tổng hợp
]
const ordersPending = [
  { id: 11, code: 'ORD011', customer: 'Nguyễn Văn M', total: 500000, status: 'Chờ xác nhận', createdAt: '2025-08-28' },
  // ... thêm nhiều dữ liệu chờ xác nhận
]
const ordersPaid = [
  { id: 21, code: 'ORD021', customer: 'Lê Thị N', total: 2000000, status: 'Đã thanh toán', createdAt: '2025-08-29' },
  // ... thêm nhiều dữ liệu đã thanh toán
]
const ordersDelivered = [
  { id: 31, code: 'ORD031', customer: 'Phạm Văn O', total: 900000, status: 'Đã giao hàng', createdAt: '2025-08-30' },
  // ... thêm nhiều dữ liệu đã giao hàng
]
const ordersCancelled = [
  { id: 41, code: 'ORD041', customer: 'Trần Thị P', total: 300000, status: 'Đã hủy', createdAt: '2025-08-31' },
  // ... thêm nhiều dữ liệu đã hủy
]

const tabs = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chờ xác nhận', value: 'pending' },
  { label: 'Đã thanh toán', value: 'paid' },
  { label: 'Đã giao hàng', value: 'delivered' },
  { label: 'Đã hủy', value: 'cancelled' }
]
const currentTab = ref('all')

// Đếm số lượng cho từng tab
const tabCounts = computed(() => [
  { ...tabs[0], count: ordersAll.length },
  { ...tabs[1], count: ordersPending.length },
  { ...tabs[2], count: ordersPaid.length },
  { ...tabs[3], count: ordersDelivered.length },
  { ...tabs[4], count: ordersCancelled.length }
])

// Lấy dữ liệu đúng theo tab
const data = computed(() => {
  switch (currentTab.value) {
    case 'pending': return ordersPending
    case 'paid': return ordersPaid
    case 'delivered': return ordersDelivered
    case 'cancelled': return ordersCancelled
    default: return ordersAll
  }
})

const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 10 })
const loading = ref(false)

function onTabChange(val: string) {
  currentTab.value = val
}
</script>

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
        :tabs="tabCounts"
        :add-button="{ label: 'Tạo đơn hàng', href: '/orders/create' }"
        @update:tab="onTabChange"
      />
    </template>
  </UDashboardPanel>
</template>