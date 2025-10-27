<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import OrdersTable from '@/components/orders/OrdersTable.vue'
import { ordersService } from '@/services/orders.service'
import WarehouseSwitcher from '@/components/WarehouseSwitcher.vue'
import type { WarehouseOption } from '@/components/WarehouseSwitcher.vue'
import { useGlobalWarehouse } from '@/composables/useWarehouse'

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

// Tabs mapped to backend numeric OrderStatusEnum (representative primary states)
// New=1, OnHold=10, PendingPayment=20, PaymentReceived=30, PaymentFailed=35,
// Invoiced=40, Shipping=50, Shipped=60, Complete=70, Canceled=80, Refunded=90, Closed=100, PartiallyRefunded=110
// We group for simplified view: ordered -> (New), inprogress -> (Shipping), completed -> (Complete), canceled -> (Canceled)
// You can expand / refine mapping later if you need more granular tabs.
const tabs = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đặt hàng', value: 'ordered' }, // New
  { label: 'Đang giao dịch', value: 'inprogress' }, // Shipping (could include PendingPayment/PaymentReceived etc.)
  { label: 'Đã hoàn thành', value: 'completed' }, // Complete
  { label: 'Đã hủy', value: 'canceled' } // Canceled
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

// Backend enum mapping (numeric -> Vietnamese label)
// 1 Unpaid, 2 PartiallyPaid, 3 Paid, 4 OverPaid, 5 Refunded
const paymentStatusEnumMap: Record<number, string> = {
  1: 'Chưa thanh toán',
  2: 'Thanh toán một phần',
  3: 'Đã thanh toán',
  4: 'Thanh toán dư',
  5: 'Đã hoàn tiền'
}

function normalizePaymentStatus(raw?: string | number | null): string {
  if (raw == null || raw === '') return ''
  if (typeof raw === 'number') return paymentStatusEnumMap[raw] || ''
  const str = String(raw)
  const lower = str.toLowerCase()
  const asNum = Number(str)
  if (!isNaN(asNum) && paymentStatusEnumMap[asNum]) return paymentStatusEnumMap[asNum]!
  if (lower.includes('overpaid')) return paymentStatusEnumMap[4] || 'Thanh toán dư'
  if (lower.includes('partial')) return paymentStatusEnumMap[2] || 'Thanh toán một phần'
  if (lower.includes('refunded')) return paymentStatusEnumMap[5] || 'Đã hoàn tiền'
  // Check unpaid BEFORE generic paid to avoid substring collision
  if (lower.includes('unpaid')) return paymentStatusEnumMap[1] || 'Chưa thanh toán'
  // Use regex word boundary so 'unpaid' no longer matches generic 'paid'
  if (/\bpaid\b/.test(lower) || lower.includes('đã thanh toán')) return paymentStatusEnumMap[3] || 'Đã thanh toán'
  return str
}

function mapProcessStatus(raw?: string) {
  if (!raw) return ''
  const lower = raw.toLowerCase()
  if (lower === 'new') return 'Đơn hàng mới'
  if (lower.includes('pending') || lower.includes('hold')) return 'Chờ xử lý'
  if (lower.includes('shipping') || lower.includes('shipped')) return 'Đang giao'
  if (lower.includes('complete')) return 'Đã hoàn thành'
  if (lower.includes('cancel')) return 'Đã hủy'
  if (lower.includes('refund')) return 'Hoàn tiền'
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

// Global warehouse state binding for header switcher
const { selectedWarehouse: globalWarehouse, setWarehouse } = useGlobalWarehouse()
const selectedBranch = computed<WarehouseOption | null>({
  get() {
    const sw = globalWarehouse.value
    if (sw && sw.id !== null && sw.id !== undefined && String(sw.id).trim() !== '') {
      return { id: sw.id, name: sw.name }
    }
    return { id: null, name: 'Tất cả chi nhánh' }
  },
  set(v) {
    if (!v) {
      setWarehouse(null)
      return
    }
    const id = v.id == null ? null : (typeof v.id === 'number' ? v.id : Number(v.id))
    setWarehouse({ id, name: v.name })
  }
})

function onTabChange(val: string) {
  currentTab.value = val
  pagination.value.pageIndex = 0 // reset to first page
  fetchOrders()
}

// Map tab -> representative numeric Status (can expand to arrays if backend supports multi-status filtering)
const tabStatusMap: Record<string, number | null> = {
  all: null,
  ordered: 1, // New
  inprogress: 50, // Shipping (choose 50 as anchor state)
  completed: 70, // Complete
  canceled: 80 // Canceled
}

function buildGridRequest() {
  const status = tabStatusMap[currentTab.value]
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
        Status: status
      }
    },
    Sort: {
      Field: 'Id',
      Reverse: true
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
        const customerName = i.customer?.name || i.customerName || '—'
        return {
          id: i.id,
          code: displayCode,
          customer: customerName,
          total: i.orderTotal,
          source: i.sourceName || i.orderSource || 'Admin',
          paymentStatus: normalizePaymentStatus(i.paymentStatus),
          processStatus: mapProcessStatus(i.orderStatus),
          shippingMethod: i.shippingMethod || null,
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
// Refetch when global warehouse changes
watch(() => globalWarehouse.value?.id, () => {
  pagination.value.pageIndex = 0
  fetchOrders()
})
</script>

<template>
  <UDashboardPanel id="orders">
    <template #header>
      <UDashboardNavbar title="Đơn hàng">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <WarehouseSwitcher
            v-model="selectedBranch"
            :borderless="true"
            :auto-width="true"
          />
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
