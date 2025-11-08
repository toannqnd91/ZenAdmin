<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import SalesReturnsTable from '@/components/sales-returns/SalesReturnsTable.vue'
import WarehouseSwitcher from '@/components/WarehouseSwitcher.vue'
import type { WarehouseOption } from '@/components/WarehouseSwitcher.vue'
import { useGlobalWarehouse } from '@/composables/useWarehouse'
import { salesReturnsService } from '@/services'

interface SalesReturnRow {
  id: number
  returnNumber: string
  orderCode: string
  customer: string
  total: number
  refundAmount: number
  status: string
}

// List state
const returns = ref<SalesReturnRow[]>([])
const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 20 })
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pagination.value.pageSize) || 1)
const loading = ref(false)
const refreshing = ref(false)

// Tabs: keep simple for now
const tabs = [{ label: 'Tất cả', value: 'all' }] as const
const tabCounts = computed(() => [{ ...tabs[0], count: totalRecords.value }])

// Warehouse header binding (same approach as orders page)
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

function buildGridRequest() {
  return {
    Pagination: {
      Start: pagination.value.pageIndex * pagination.value.pageSize,
      TotalItemCount: 0,
      Number: pagination.value.pageSize,
      NumberOfPages: 0
    },
    Search: {
      QueryObject: {
        Name: q.value || null
      }
    },
    Sort: {
      Field: 'Id',
      Reverse: true
    }
  }
}

async function fetchSalesReturns() {
  loading.value = true
  const body = buildGridRequest()
  const res = await salesReturnsService.getGridCached(body, {
    onUpdated: (grid) => {
      if (!grid) return
      totalRecords.value = grid.totalRecord
      returns.value = (grid.items || []).map((i) => {
        return {
          id: i.id,
          returnNumber: i.returnNumber,
          orderCode: i.orderCode && String(i.orderCode).trim() !== '' ? i.orderCode : (i.orderId ? `#${i.orderId}` : ''),
          customer: i.customerName && String(i.customerName).trim() !== '' ? i.customerName : 'Khách lẻ',
          total: i.total,
          refundAmount: i.refundAmount,
          status: i.status
        }
      })
    }
  })
  const grid = res.data
  if (grid) {
    totalRecords.value = grid.totalRecord
    returns.value = (grid.items || []).map((i) => {
      return {
        id: i.id,
        returnNumber: i.returnNumber,
        orderCode: i.orderCode && String(i.orderCode).trim() !== '' ? i.orderCode : (i.orderId ? `#${i.orderId}` : ''),
        customer: i.customerName && String(i.customerName).trim() !== '' ? i.customerName : 'Khách lẻ',
        total: i.total,
        refundAmount: i.refundAmount,
        status: i.status
      }
    })
  } else {
    returns.value = []
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

onMounted(fetchSalesReturns)
watch(() => pagination.value.pageIndex, () => fetchSalesReturns())
watch(() => pagination.value.pageSize, () => {
  pagination.value.pageIndex = 0
  fetchSalesReturns()
})
let searchDebounce: ReturnType<typeof setTimeout> | undefined
watch(q, () => {
  clearTimeout(searchDebounce)
  pagination.value.pageIndex = 0
  searchDebounce = setTimeout(() => fetchSalesReturns(), 400)
})
watch(() => globalWarehouse.value?.id, () => {
  pagination.value.pageIndex = 0
  fetchSalesReturns()
})

const { isNotificationsSlideoverOpen } = useDashboard()

function onTabChange(_val: string) {
  // placeholder if we add real tabs later
}
</script>

<template>
  <UDashboardPanel id="sales-returns">
    <template #header>
      <UDashboardNavbar title="Trả hàng bán" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <WarehouseSwitcher v-model="selectedBranch" :borderless="true" :auto-width="true" />
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
      <SalesReturnsTable
        v-model:q="q"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :data="returns"
        :loading="loading"
        :tabs="tabCounts"
        :total-records="totalRecords"
        :total-pages="totalPages"
        @update:tab="onTabChange"
      />
    </template>
  </UDashboardPanel>
</template>
