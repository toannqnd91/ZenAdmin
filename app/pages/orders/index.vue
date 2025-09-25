<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import OrdersTable from '@/components/orders/OrdersTable.vue'
import { ordersService } from '@/services/orders.service'

interface OrderCounts {
  all: number
  ordered: number
  inProgress: number
  completed: number
  canceled: number
  // keep byStatus optional if we decide to surface it later
  byStatus?: Record<string, number>
}

interface OrderRow {
  id: number
  code: string
  customer: string
  total: number
  source: string | null
  paymentStatus: string
  processStatus: string
  shippingMethod: string | null
  createdAt: string
}

// Reactive list populated from API
const orders = ref<OrderRow[]>([])

const tabs = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đặt hàng', value: 'ordered' },
  { label: 'Đang giao dịch', value: 'inprogress' },
  { label: 'Đã hoàn thành', value: 'completed' },
  { label: 'Đã hủy', value: 'canceled' }
] as const
const currentTab = ref('all')

// Đếm số lượng cho từng tab
const apiCounts = ref<Partial<OrderCounts>>({})
const tabCounts = computed(() => [
  { ...tabs[0], count: apiCounts.value.all },
  { ...tabs[1], count: apiCounts.value.ordered },
  { ...tabs[2], count: apiCounts.value.inProgress },
  { ...tabs[3], count: apiCounts.value.completed },
  { ...tabs[4], count: apiCounts.value.canceled }
])

function formatDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  // Format dd/MM/yyyy HH:mm (24h)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${mins}`
}

function normalizePaymentStatus(raw?: string) {
  if (!raw) return ''
  // Backend already returns Vietnamese sometimes; keep simple mapping if needed
  const lower = raw.toLowerCase()
  if (lower.includes('một phần') || lower.includes('partial')) return 'Thanh toán một phần'
  if (lower.includes('đã thanh toán') || lower.includes('paid')) return 'Đã thanh toán'
  if (lower.includes('chưa') || lower.includes('unpaid')) return 'Chưa thanh toán'
  return raw
}

function mapProcessStatus(raw?: string) {
  if (!raw) return ''
  const lower = raw.toLowerCase()
  if (lower.includes('complete') || lower.includes('hoàn')) return 'Đã xử lý'
  if (lower.includes('processing') || lower.includes('inprogress')) return 'Đang xử lý'
  if (lower.includes('cancel')) return 'Đã hủy'
  return raw
}

// Table binds to unified orders list
const data = computed(() => orders.value)

const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 20 })
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pagination.value.pageSize) || 1)
const loading = ref(false)

function onTabChange(val: string) {
  if (currentTab.value !== val) {
    currentTab.value = val
    pagination.value.pageIndex = 0 // reset to first page
    fetchOrders()
  }
}

function buildGridRequest() {
  const statusMap: Record<string, string> = {
    ordered: 'ordered',
    inprogress: 'inprogress',
    completed: 'completed',
    canceled: 'canceled'
  }
  const orderStatus = currentTab.value === 'all' ? null : statusMap[currentTab.value]
  return {
    Pagination: {
      Start: pagination.value.pageIndex * pagination.value.pageSize,
      TotalItemCount: 0,
      Number: pagination.value.pageSize,
      NumberOfPages: 0
    },
    Search: {
      QueryObject: {
        Name: q.value || null,
        OrderStatus: orderStatus
      }
    },
    Sort: {
      Field: 'Id',
      Reverse: false
    }
  }
}

async function fetchOrders() {
  try {
    loading.value = true
    const body = buildGridRequest()
    const res = await ordersService.getOrdersGrid(body)
    if (res?.success && res.data) {
      totalRecords.value = res.data.totalRecord
      // Map API items to table rows
      orders.value = res.data.items.map((i) => {
        const rawCode = i.orderCode || i.orderNumber || `${i.id}`
        const displayCode = rawCode.startsWith('#') ? rawCode : `#${rawCode}`
        return {
          id: i.id,
          code: displayCode,
          customer: i.customerName,
          total: i.orderTotal,
          source: i.sourceName || i.orderSource || 'Admin',
          paymentStatus: normalizePaymentStatus(i.paymentStatus),
          processStatus: mapProcessStatus(i.orderStatus),
          shippingMethod: i.shippingMethod,
          createdAt: formatDate(i.createdOn)
        }
      })
    } else {
      orders.value = []
      totalRecords.value = 0
    }
  } catch {
    orders.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // counts
  try {
    loading.value = true
    const res = await ordersService.getCountsByStatus()
    if (res?.success && res.data) {
      const { byStatus, ...rest } = res.data
      apiCounts.value = { ...rest }
    }
  } catch {
    /* silent */
  } finally {
    loading.value = false
  }
  // initial orders
  await fetchOrders()
})

// Watchers for search & pagination
watch(() => pagination.value.pageIndex, () => fetchOrders())
watch(() => pagination.value.pageSize, () => {
  pagination.value.pageIndex = 0
  fetchOrders()
})
let searchDebounce: ReturnType<typeof setTimeout> | undefined
watch(q, () => {
  clearTimeout(searchDebounce)
  pagination.value.pageIndex = 0
  searchDebounce = setTimeout(() => fetchOrders(), 400)
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
        :total-records="totalRecords"
        :total-pages="totalPages"
        :add-button="{ label: 'Tạo đơn hàng', href: '/orders/create' }"
        @update:tab="onTabChange"
      />
    </template>
  </UDashboardPanel>
</template>
