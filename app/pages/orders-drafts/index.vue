<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import OrdersTable from '@/components/orders/OrdersTable.vue'
import { ordersService } from '@/services/orders.service'
import WarehouseSwitcher from '@/components/WarehouseSwitcher.vue'
import type { WarehouseOption } from '@/components/WarehouseSwitcher.vue'
import { useGlobalWarehouse } from '@/composables/useWarehouse'

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

// Tabs for draft orders - simpler than main orders
const tabs = [
  { label: 'Tất cả đơn nháp', value: 'all' }
] as const
const currentTab = ref('all')

// Tab counts
const apiCounts = ref({ all: 0 })
const tabCounts = computed(() => [
  { ...tabs[0], count: apiCounts.value.all }
])

function formatDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${mins}`
}

// Backend enum mapping
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
  if (lower.includes('unpaid')) return paymentStatusEnumMap[1] || 'Chưa thanh toán'
  if (/\bpaid\b/.test(lower) || lower.includes('đã thanh toán')) return paymentStatusEnumMap[3] || 'Đã thanh toán'
  return str
}

function mapProcessStatus(raw?: string) {
  if (!raw) return 'Đơn nháp'
  const lower = raw.toLowerCase()
  if (lower.includes('draft')) return 'Đơn nháp'
  if (lower === 'new') return 'Đơn hàng mới'
  if (lower.includes('pending') || lower.includes('hold')) return 'Chờ xử lý'
  return raw
}

// Table binds
const data = computed(() => orders.value)

const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 20 })
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pagination.value.pageSize) || 1)
const loading = ref(false)
const refreshing = ref(false)
const countsLoading = ref(false)

// Global warehouse state
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
  pagination.value.pageIndex = 0
  fetchOrders()
}

function buildGridRequest() {
  // For draft orders, we might use a specific status code or isDraft flag
  // Adjust based on your backend API
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
        IsDraft: true // Assuming backend supports this flag
      }
    },
    Sort: {
      Field: 'Id',
      Reverse: true
    }
  }
}

async function fetchOrders() {
  loading.value = true
  const body = buildGridRequest()
  const res = await ordersService.getOrdersGridCached(body, {
    onUpdated: (grid) => {
      if (!grid) return
      totalRecords.value = grid.totalRecord
      orders.value = (grid.items || []).map((i) => {
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
    }
  })
  const grid = res.data
  if (grid) {
    totalRecords.value = grid.totalRecord
    orders.value = (grid.items || []).map((i) => {
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

async function fetchCounts() {
  try {
    countsLoading.value = true
    // TODO: Implement draft orders count API if available
    // For now, use the total from grid
    apiCounts.value.all = totalRecords.value
  } catch {
    /* silent */
  } finally {
    countsLoading.value = false
  }
}

onMounted(() => {
  fetchOrders()
  fetchCounts()
})

// Watchers
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
watch(() => globalWarehouse.value?.id, () => {
  pagination.value.pageIndex = 0
  fetchOrders()
  fetchCounts()
})

const { isNotificationsSlideoverOpen } = useDashboard()
</script>

<template>
  <UDashboardPanel id="orders-drafts">
    <template #header>
      <UDashboardNavbar title="Đơn hàng nháp" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <WarehouseSwitcher
            v-model="selectedBranch"
            :borderless="true"
            :auto-width="true"
          />
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
      <OrdersTable
        v-model:q="q"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :data="data"
        :loading="loading"
        :tabs="tabCounts"
        :total-records="totalRecords"
        :total-pages="totalPages"
        :add-button="{ label: 'Tạo đơn nháp', href: '/orders/create?draft=true' }"
        @update:tab="onTabChange"
      />
    </template>
  </UDashboardPanel>
</template>
