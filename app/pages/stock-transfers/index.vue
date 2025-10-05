<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { inventoryTransfersService } from '@/services/inventoryTransfers.service'
import type { TransferGridResponseEnvelope, TransferGridItem } from '@/services/inventoryTransfers.service'
import TransfersTable from '@/components/stock-transfers/TransfersTable.vue'

// Server-side status mapping (InventoryTransferStatus enum on backend):
// 0 Draft, 1 ReadyToShip, 2 InProgress, 3 Transferred, 4 Cancelled, 5 PartiallyTransferred
// Each tab now sends numeric Status in QueryObject.

interface TransferRow {
  id: number | string
  code: string
  origin: string
  destination: string
  totalItems: number
  status: string // status text from API
  statusCode: number // numeric status code (InventoryTransferStatus)
  createdAt: string
}

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

// Tab value => status code map (null for all)
const tabStatusMap: Record<string, number | null> = {
  all: null,
  draft: 0,
  ready_to_ship: 1,
  in_progress: 2,
  transferred: 3,
  canceled: 4,
  partially_transferred: 5
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
      Reverse: true // newest first
    }
  }
}

async function fetchTransfers() {
  loading.value = true
  try {
    const body = buildGridRequest()
    const res = await inventoryTransfersService.getTransfersGrid(body) as unknown as TransferGridResponseEnvelope
    if (res?.success && res.data) {
      const grid = res.data
      totalRecords.value = grid.totalRecord
      const mapped = grid.items.map((i: TransferGridItem) => {
        const rawCode = i.transferCode || `${i.id}`
        const displayCode = rawCode.startsWith('#') ? rawCode : `#${rawCode}`
        return {
          id: i.id,
          code: displayCode,
          origin: (i.originName || '').trim(),
          destination: (i.destinationName || '').trim(),
          totalItems: i.itemCount,
          status: i.statusText,
          statusCode: i.status,
          createdAt: formatDate(i.createdOn)
        }
      })
      // Update full list
      transfers.value = mapped
    } else {
      transfers.value = []
      totalRecords.value = 0
    }
  } catch {
    transfers.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

const tabs = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Nháp', value: 'draft' },
  { label: 'Sẵn sàng chuyển', value: 'ready_to_ship' },
  { label: 'Đang xử lý', value: 'in_progress' },
  { label: 'Đã chuyển', value: 'transferred' },
  { label: 'Đã hủy', value: 'canceled' },
  { label: 'Chuyển một phần', value: 'partially_transferred' }
] as const

const currentTab = ref('all')
const apiCounts = ref<Record<string, number>>({})
const tabCounts = computed(() => tabs.map(t => ({ ...t, count: apiCounts.value[t.value] })))

const transfers = ref<TransferRow[]>([])
const data = computed(() => {
  if (currentTab.value === 'all') return transfers.value
  const targetStatus = tabStatusMap[currentTab.value]
  if (targetStatus == null) return transfers.value
  return transfers.value.filter(r => r.statusCode === targetStatus)
})
const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 20 })
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pagination.value.pageSize) || 1)
const loading = ref(false)

function onTabChange(val: string) {
  currentTab.value = val
  pagination.value.pageIndex = 0
  fetchTransfers()
}

async function loadCounts() {
  try {
    const res = await inventoryTransfersService.getCountsByStatus()
    if (res?.success && res.data) {
      const d = res.data
      apiCounts.value = {
        all: d.total || 0,
        draft: d.draft || 0,
        ready_to_ship: d.readyToShip || 0,
        in_progress: d.inProgress || 0,
        transferred: d.transferred || 0,
        canceled: d.cancelled || 0,
        partially_transferred: d.partiallyTransferred || 0
      }
    }
  } catch {
    // silent
  }
}

onMounted(async () => {
  await Promise.all([loadCounts(), fetchTransfers()])
})

watch(() => pagination.value.pageIndex, () => fetchTransfers())
watch(() => pagination.value.pageSize, () => {
  pagination.value.pageIndex = 0
  fetchTransfers()
})
let searchDebounce: ReturnType<typeof setTimeout> | undefined
watch(q, () => {
  clearTimeout(searchDebounce)
  pagination.value.pageIndex = 0
  searchDebounce = setTimeout(() => fetchTransfers(), 400)
})
</script>

<template>
  <UDashboardPanel id="stock-transfers">
    <template #header>
      <UDashboardNavbar title="Điều chuyển kho">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <!-- Reuse OrdersTable component structure conceptually; placeholder simple table for now -->
      <div class="flex flex-col gap-4">
        <TransfersTable
          v-model:q="q"
          v-model:row-selection="rowSelection"
          v-model:pagination="pagination"
          :data="data"
          :loading="loading"
          :tabs="tabCounts"
          :total-records="totalRecords"
          :total-pages="totalPages"
          :add-button="{ label: 'Tạo phiếu chuyển', href: '/stock-transfers/create' }"
          @update:tab="onTabChange"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>

