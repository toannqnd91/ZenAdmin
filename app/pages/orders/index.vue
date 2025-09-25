<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import OrdersTable from '@/components/orders/OrdersTable.vue'
import { ordersService } from '@/services/orders.service'

// Dữ liệu riêng cho từng tab
const ordersAll = [
  { id: 1, code: 'ORD001', customer: 'Nguyễn Văn A', total: 1200000, status: 'Đã thanh toán', createdAt: '2025-08-25' },
  { id: 2, code: 'ORD002', customer: 'Trần Thị B', total: 850000, status: 'Chờ xác nhận', createdAt: '2025-08-26' }
]
const ordersPending = [
  { id: 11, code: 'ORD011', customer: 'Nguyễn Văn M', total: 500000, status: 'Chờ xác nhận', createdAt: '2025-08-28' }
]
const ordersPaid = [
  { id: 21, code: 'ORD021', customer: 'Lê Thị N', total: 2000000, status: 'Đã thanh toán', createdAt: '2025-08-29' }
]
const ordersDelivered = [
  { id: 31, code: 'ORD031', customer: 'Phạm Văn O', total: 900000, status: 'Đã giao hàng', createdAt: '2025-08-30' }
]
const ordersCancelled = [
  { id: 41, code: 'ORD041', customer: 'Trần Thị P', total: 300000, status: 'Đã hủy', createdAt: '2025-08-31' }
]

const tabs = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đặt hàng', value: 'ordered' },
  { label: 'Đang giao dịch', value: 'inprogress' },
  { label: 'Đã hoàn thành', value: 'completed' },
  { label: 'Đã hủy', value: 'canceled' }
]
const currentTab = ref('all')

// Đếm số lượng cho từng tab
const apiCounts = ref<{ [k: string]: number }>({})
const tabCounts = computed(() => [
  { ...tabs[0], count: apiCounts.value.all ?? ordersAll.length },
  { ...tabs[1], count: apiCounts.value.ordered ?? ordersPending.length },
  { ...tabs[2], count: apiCounts.value.inProgress ?? ordersPaid.length },
  { ...tabs[3], count: apiCounts.value.completed ?? ordersDelivered.length },
  { ...tabs[4], count: apiCounts.value.canceled ?? ordersCancelled.length }
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

onMounted(async () => {
  try {
    loading.value = true
    const res = await ordersService.getCountsByStatus()
    if (res?.success && res.data) {
      const { byStatus, ...rest } = res.data as any
      apiCounts.value = rest
    }
  } catch {
    // silent
  } finally {
    loading.value = false
  }
})
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