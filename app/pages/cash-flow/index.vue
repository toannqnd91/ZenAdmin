<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import CashFlowTable from '@/components/cash-flow/CashFlowTable.vue'
import { cashBookService, warehouseService } from '@/services'
import type { CashBookItem, MethodBreakdownEntry } from '@/services'
import WarehouseSwitcher from '@/components/WarehouseSwitcher.vue'
import type { WarehouseOption } from '@/components/WarehouseSwitcher.vue'
import { useGlobalWarehouse } from '@/composables/useWarehouse'

// Tabs (mirroring orders table style with counts)
type TabKey = 'all' | 'cash' | 'bank' | 'unassigned'
// Default main tab = all (Tổng quỹ)
const activeTab = ref<TabKey>('all')
// Global dashboard state (notifications slideover, etc.)
const { isNotificationsSlideoverOpen } = useDashboard()
interface TabDef {
  label: string
  value: TabKey
}
// Temporary (no counts until separate API provided). Order per latest spec.
const tabCounts = computed<TabDef[]>(() => [
  { label: 'Tổng quỹ', value: 'all' },
  { label: 'Quỹ tiền mặt', value: 'cash' },
  { label: 'Quỹ tiền gửi', value: 'bank' },
  { label: 'Chưa có thông tin quỹ', value: 'unassigned' }
])

// Filters state (stub)
// Không chọn mặc định (null) nhưng request sẽ hiểu là toàn thời gian
const selectedDatePreset = ref<{ value: string, label: string } | null>(null)
// interface BranchOption { id: number; name: string }
// Custom doc type options matching user request
const docTypeOptions = [
  { code: 'ThuTienMat', label: 'Phiếu thu tiền mặt' },
  { code: 'ChiTienMat', label: 'Phiếu chi tiền mặt' },
  { code: 'ThuTKNH', label: 'Thu vào TKNH' },
  { code: 'ChiTKNH', label: 'Chi từ TKNH' },
  { code: 'Transfer', label: 'Chuyển quỹ nội bộ' }
]
const selectedDocTypes = ref<string[]>([])
// Display object for RemoteSearchSelect v-model
const docTypeDisplay = computed({
  get: () => {
    if (selectedDocTypes.value.length === 0) return null
    return {
      label: `${selectedDocTypes.value.length} loại đã chọn`,
      value: 'custom'
    }
  },
  set: (val) => {
    if (!val) {
      selectedDocTypes.value = []
      triggerFetch()
    }
  }
})

// Local state for the dropdown panel (before clicking Filter)
const tempSelectedDocTypes = ref<string[]>([])


// Mock fetchers for RemoteSearchSelect
interface DatePresetItem extends Record<string, unknown> {
  value: string
  label: string
}
async function fetchDatePresets(q: string): Promise<DatePresetItem[]> {
  // Fixed predefined date presets (no server fetch)
  const items: DatePresetItem[] = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'yesterday', label: 'Hôm qua' },
    { value: 'last7d', label: '7 ngày qua' },
    { value: 'last30d', label: '30 ngày qua' },
    { value: 'prevWeek', label: 'Tuần trước' },
    { value: 'thisWeek', label: 'Tuần này' },
    { value: 'lastMonth', label: 'Tháng trước' },
    { value: 'thisMonth', label: 'Tháng này' },
    { value: 'prevYear', label: 'Năm trước' },
    { value: 'thisYear', label: 'Năm nay' },
    { value: 'custom', label: 'Tùy chọn' },
    { value: 'all', label: 'Toàn thời gian' }
  ]
  // For now we ignore the search query (static list) but still filter if user types
  const qq = q.toLowerCase()
  return (qq ? items.filter(i => i.label.toLowerCase().includes(qq)) : items)
}
// Removed branch dropdown in filters; using global header WarehouseSwitcher
// Removed fetchDocTypes since we use static custom panel for doc types
async function fetchDocTypes(q: string) {
  // Return empty as we don't use the default list anymore, but RemoteSearchSelect might need a function
  return []
}

// Selection & search state early (used by watchers)
const rowSelection = ref<Record<string, boolean>>({})
const q = ref('')

// Global warehouse state binding
const { selectedWarehouse: globalWarehouse, setWarehouse } = useGlobalWarehouse()
const selectedHeaderWarehouse = computed<WarehouseOption | null>({
  get() {
    const sw = globalWarehouse.value
    if (sw && sw.id !== null && sw.id !== undefined && String(sw.id).trim() !== '') {
      return { id: sw.id, name: sw.name }
    }
    // For cash-flow, we require a concrete warehouse; fallback to null in UI
    return null
  },
  set(v) {
    if (!v) return
    const id = v.id == null ? null : (typeof v.id === 'number' ? v.id : Number(v.id))
    setWarehouse({ id, name: v.name })
  }
})

// Raw API items and mapped rows for table component shape
const rawItems = ref<CashBookItem[]>([])
interface TableRow {
  id: string
  code: string
  date: string
  partnerName: string
  reason: string
  originalDoc: string
  amount: number
}
const rows = computed<TableRow[]>(() => rawItems.value.map(i => ({
  id: String(i.id),
  code: i.code,
  date: new Date(i.occurredOn).toLocaleDateString('vi-VN'),
  partnerName: i.partyName && String(i.partyName).trim() !== '' ? i.partyName : 'Khách lẻ',
  reason: i.description,
  originalDoc: i.referenceId ? `#${i.referenceId}` : '',
  amount: i.type === 1 ? i.amount : -Math.abs(i.amount)
})))
const loading = ref(false)
// Background refresh flag (when serving cached data instantly)
const refreshing = ref(false)

// Summary numbers
const openingBalance = ref(0)
const totalIn = ref(0)
const totalOut = ref(0)
const closingBalance = ref(0)
const methodBreakdown = ref<MethodBreakdownEntry[]>([])

// Pagination state (API is 1-based page)
const pagination = ref({ pageIndex: 0, pageSize: 20 })
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pagination.value.pageSize) || 1)

// Debounce handle for fetch
let fetchTimeout: ReturnType<typeof setTimeout> | null = null

// Use service-level cache via filterCached

// Custom range state
const customFromDate = ref('')
const customToDate = ref('')
const selectedBranch = ref(null) // New ref for branch

// async function fetchBranches(q: string) {
//   const res = await warehouseService.getWarehouses()
//   // Cast to standard record for RemoteSearchSelect compatibility
//   const items = (Array.isArray(res?.data) ? res.data : []) as Record<string, any>[]
//   const qq = q.toLowerCase()
//   return qq ? items.filter(i => i.name.toLowerCase().includes(qq)) : items
// }
async function fetchBranches(q: string) { return [] } // Stub to prevent template errors if called

function getRangeFromPreset(preset: { value: string, label: string } | null): { from: string, to: string } {
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
  const value = (preset?.value) || 'all'
  let from: Date
  let to: Date
  switch (value) {
    case 'custom': {
      if (customFromDate.value && customToDate.value) {
        from = startOfDay(new Date(customFromDate.value))
        to = endOfDay(new Date(customToDate.value))
      } else {
        // Fallback if empty
        const s = new Date(now)
        s.setDate(s.getDate() - 30) // default 30 days if custom selected but empty?
        from = startOfDay(s)
        to = endOfDay(now)
      }
      break
    }
    case 'today': {
      from = startOfDay(now)
      to = endOfDay(now)
      break
    }
    case 'yesterday': {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      from = startOfDay(y)
      to = endOfDay(y)
      break
    }
    case 'last7d': {
      const s = new Date(now)
      s.setDate(s.getDate() - 6)
      from = startOfDay(s)
      to = endOfDay(now)
      break
    }
    case 'last30d': {
      const s = new Date(now)
      s.setDate(s.getDate() - 29)
      from = startOfDay(s)
      to = endOfDay(now)
      break
    }
    case 'thisWeek': {
      const day = now.getDay() || 7
      const s = new Date(now)
      s.setDate(s.getDate() - (day - 1))
      from = startOfDay(s)
      to = endOfDay(now)
      break
    }
    case 'prevWeek': {
      const day = now.getDay() || 7
      const s = new Date(now)
      s.setDate(s.getDate() - day - 6)
      const e = new Date(s)
      e.setDate(s.getDate() + 6)
      from = startOfDay(s)
      to = endOfDay(e)
      break
    }
    case 'thisMonth': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      from = startOfDay(s)
      to = endOfDay(e)
      break
    }
    case 'lastMonth': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
      from = startOfDay(s)
      to = endOfDay(e)
      break
    }
    case 'thisYear': {
      const s = new Date(now.getFullYear(), 0, 1)
      const e = new Date(now.getFullYear(), 11, 31)
      from = startOfDay(s)
      to = endOfDay(e)
      break
    }
    case 'prevYear': {
      const s = new Date(now.getFullYear() - 1, 0, 1)
      const e = new Date(now.getFullYear() - 1, 11, 31)
      from = startOfDay(s)
      to = endOfDay(e)
      break
    }
    case 'all':
    default: {
      const s = new Date(now.getFullYear() - 10, 0, 1)
      const e = now
      from = startOfDay(s)
      to = endOfDay(e)
      break
    }
  }
  return { from: from.toISOString(), to: to.toISOString() }
}

function applyCustomDateFilter(close: () => void) {
  if (selectedDatePreset.value?.value === 'custom' && customFromDate.value && customToDate.value) {
    selectedDatePreset.value = {
      value: 'custom',
      label: `${format(new Date(customFromDate.value), 'dd/MM/yyyy')} - ${format(new Date(customToDate.value), 'dd/MM/yyyy')}`
    }
  }
  close()
}

// No auto-set to 'all'; null is treated as toàn thời gian internally

function mapMethod(tab: TabKey): number {
  switch (tab) {
    case 'cash': return 1 // Tiền mặt
    case 'bank': return 2 // Tiền gửi
    case 'unassigned': return 0 // treat as all for now (no specific mapping)
    case 'all':
    default: return 0 // All methods
  }
}

async function fetchCashBook() {
  loading.value = true
  const { from, to } = getRangeFromPreset(selectedDatePreset.value)
  const body = {
    from,
    to,
    type: 0,
    method: mapMethod(activeTab.value),
    status: 0,
    page: pagination.value.pageIndex + 1,
    pageSize: pagination.value.pageSize,
    keyword: q.value.trim(),
    documentKinds: selectedDocTypes.value
  }
  // Ask service for cached-first data and background refresh
  const res = await cashBookService.filterCached(body, {
    onUpdated: (data) => {
      // Only called when fresh data differs from cache
      rawItems.value = data.items
      totalRecords.value = data.pagination.total
      openingBalance.value = data.openingBalance
      totalIn.value = data.totalIn
      totalOut.value = data.totalOut
      closingBalance.value = data.closingBalance
      methodBreakdown.value = data.methodBreakdown
    }
  })

  // Apply initial data (cached or fresh)
  const data = res.data
  rawItems.value = data.items
  totalRecords.value = data.pagination.total
  openingBalance.value = data.openingBalance
  totalIn.value = data.totalIn
  totalOut.value = data.totalOut
  closingBalance.value = data.closingBalance
  methodBreakdown.value = data.methodBreakdown

  // UI flags for loading state
  if (res.fromCache) {
    loading.value = false
    refreshing.value = true
    // Turn off refreshing when background refresh completes
    res.refreshPromise?.finally(() => {
      refreshing.value = false
    })
  } else {
    loading.value = false
    refreshing.value = false
  }
}

function triggerFetch(options: { debounce?: boolean } = {}) {
  const { debounce = false } = options
  if (fetchTimeout) {
    clearTimeout(fetchTimeout)
    fetchTimeout = null
  }
  const run = () => {
    fetchCashBook()
  }
  if (debounce) {
    fetchTimeout = setTimeout(run, 300)
  } else {
    run()
  }
}

onMounted(() => {
  triggerFetch()
})
// Refetch when global warehouse changes (header switcher)
watch(() => globalWarehouse.value?.id, () => {
  pagination.value.pageIndex = 0
  triggerFetch()
})
watch(selectedDatePreset, () => {
  pagination.value.pageIndex = 0
  triggerFetch()
})
watch(activeTab, () => {
  pagination.value.pageIndex = 0
  triggerFetch()
})
watch(q, () => {
  pagination.value.pageIndex = 0
  triggerFetch({ debounce: true })
})
// watch(selectedBranch, () => {
//   pagination.value.pageIndex = 0
//   triggerFetch()
// })

// Computed summaries from API values
const totalReceipts = computed(() => totalIn.value)
const totalPayments = computed(() => totalOut.value)
// closingBalance already provided by API

// Split from method breakdown (method:1=Tiền mặt,2=Chuyển khoản,3=Ví điện tử)
const cashBalance = computed(() => methodBreakdown.value.find(m => m.method === 1)?.net ?? closingBalance.value)
const bankBalance = computed(() => methodBreakdown.value.find(m => m.method === 2)?.net ?? 0)

// Handler for slip creation
function handleCreateSlip(type: 'receipt' | 'payment' | 'transfer') {
  console.log('Creating slip type:', type)
  if (type === 'receipt') {
    router.push('/cash-flow/create-receipt')
  } else if (type === 'payment') {
    router.push('/cash-flow/create-payment')
  } else if (type === 'transfer') {
    router.push('/cash-flow/internal-transfer')
  }
}

// Create slip dropdown items
const createSlipItems = [
  [
    {
      label: 'Tạo phiếu thu',
      icon: 'i-lucide-arrow-down-to-line',
      onSelect: () => handleCreateSlip('receipt')
    },
    {
      label: 'Tạo phiếu chi',
      icon: 'i-lucide-arrow-up-from-line',
      onSelect: () => handleCreateSlip('payment')
    },
    {
      label: 'Chuyển quỹ nội bộ',
      icon: 'i-lucide-repeat',
      onSelect: () => handleCreateSlip('transfer')
    }
  ]
]

function formatCurrency(v: number) {
  const n = Math.floor(Number(v) || 0)
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ'
}

const pagedRows = computed(() => rows.value) // API already paginates

const router = useRouter()
function goToReceipt(code: string) {
  if (!code) return
  router.push(`/cash-flow/${code}`)
}

watch(() => pagination.value.pageSize, () => {
  pagination.value.pageIndex = 0
})
function onTabChange(val: string) {
  activeTab.value = val as TabKey
  // fetch triggered by watcher above
}
</script>

<template>
  <UDashboardPanel id="cash-flow">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <div>
            <div class="text-lg font-semibold">
              Sổ quỹ
            </div>
          </div>
        </template>
        <template #right>
          <!-- Keep Export at start, Warehouse at end, Reason in between -->
          <UButton label="Xuất file" color="neutral" variant="soft" size="sm" />
          <UButton label="Lý do thu chi" color="neutral" variant="soft" size="sm" />
          <WarehouseSwitcher v-model="selectedHeaderWarehouse" :include-all="true" :clearable="true" :borderless="true"
            :auto-width="true" />

          <!-- Divider before global controls -->
          <div class="h-5 w-px bg-gray-200 mx-2" />

          <!-- Always keep these two at the far right: color mode + notifications -->
          <UColorModeButton />
          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton color="neutral" variant="ghost" square @click="isNotificationsSlideoverOpen = true">
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <!-- Summary Card (formula style) -->
      <UPageCard variant="soft" class="rounded-md bg-primary-600 text-white flex items-center justify-between">
        <div
          class="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 lg:gap-10 text-[13px] sm:text-[14px] leading-tight">
          <!-- Opening Balance -->
          <div class="flex flex-col justify-center min-w-[90px] sm:min-w-[110px] shrink-0">
            <div class="text-[14px] font-medium flex items-center gap-1 text-white/90">
              <span>Quỹ đầu kỳ</span>
              <UTooltip text="Số dư đầu kỳ" />
            </div>
            <div class="font-semibold text-[16px] mt-1 text-white">
              {{ formatCurrency(openingBalance) }}
            </div>
          </div>
          <!-- + separator -->
          <div class="inline-flex shrink-0 self-center items-center text-sm font-medium text-white/60 px-1 sm:px-2">
            +
          </div>
          <!-- Total Receipts -->
          <div class="flex flex-col justify-center min-w-[100px] sm:min-w-[120px] shrink-0">
            <div class="text-[14px] font-medium flex items-center gap-1 text-white/90">
              <span>Tổng thu</span>
              <UTooltip text="Tổng số tiền đã thu" />
            </div>
            <div class="font-bold text-[16px] mt-1 text-emerald-400">
              {{ formatCurrency(totalReceipts) }}
            </div>
          </div>
          <!-- - separator -->
          <div class="inline-flex shrink-0 self-center items-center text-sm font-medium text-white/60 px-1 sm:px-2">
            -
          </div>
          <!-- Total Payments -->
          <div class="flex flex-col justify-center min-w-[100px] sm:min-w-[120px] shrink-0">
            <div class="text-[14px] font-medium flex items-center gap-1 text-white/90">
              <span>Tổng chi</span>
              <UTooltip text="Tổng số tiền đã chi" />
            </div>
            <div class="font-bold text-[16px] mt-1 text-rose-400">
              {{ formatCurrency(totalPayments) }}
            </div>
          </div>
          <!-- = separator -->
          <div class="inline-flex shrink-0 self-center items-center text-sm font-medium text-white/60 px-1 sm:px-2">
            =
          </div>
          <!-- Closing Balance -->
          <div class="flex flex-col justify-center min-w-[100px] sm:min-w-[120px] shrink-0">
            <div class="text-[14px] font-medium flex items-center gap-1 text-white/90">
              <span>Tồn quỹ</span>
              <UTooltip text="Số dư cuối cùng sau thu - chi" />
            </div>
            <div class="font-semibold text-[16px] mt-1 text-white">
              {{ formatCurrency(closingBalance) }}
            </div>
          </div>
          <!-- Cash / Bank split -->
          <div
            class="rounded-md px-4 sm:px-5 py-4 flex flex-col justify-center w-full sm:w-auto shrink-0 min-w-0 max-w-[320px] sm:ml-auto mt-4 sm:mt-0 overflow-hidden bg-white/10">
            <!-- Each row wraps if needed without increasing panel width -->
            <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 min-w-0">
              <span class="text-[14px] font-medium text-white/80">Quỹ tiền mặt:</span>
              <span class="text-[16px] font-semibold text-right min-w-0 text-white">{{ formatCurrency(cashBalance)
              }}</span>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mt-2 min-w-0">
              <span class="text-[14px] font-medium text-white/80">Quỹ tiền gửi:</span>
              <span class="text-[16px] font-semibold text-right min-w-0 text-white">{{ formatCurrency(bankBalance)
              }}</span>
            </div>
          </div>
        </div>
      </UPageCard>

      <!-- Table (BaseTable already has no horizontal padding for tabs & separator line) -->
      <CashFlowTable :data="pagedRows" :loading="loading" :q="q" :row-selection="rowSelection" :pagination="pagination"
        :tabs="tabCounts" :total-records="totalRecords" :total-pages="totalPages" @update:q="val => q = val"
        @update:row-selection="val => rowSelection = val"
        @update:pagination="val => { pagination = val; triggerFetch() }" @update:tab="onTabChange"
        @navigate-code="goToReceipt">
        <template #filters-line>
          <div class="flex flex-wrap items-center w-full gap-4">
            <!-- Search input (left) -->
            <div class="relative flex-1 min-w-[260px]">
              <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <input v-model="q" type="text" placeholder="Tìm mã phiếu, tham chiếu, chứng từ gốc"
                class="h-9 w-full pl-9 pr-3 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-0 text-sm">
            </div>
            <!-- Right filter group (tight, right aligned) -->
            <div class="ml-auto flex items-center">
              <!-- Unified group wrapper -->
              <!-- NOTE: Removed overflow-hidden so dropdowns (absolutely positioned inside each RemoteSearchSelect) are not clipped.
                   Using border on outer wrapper + borderless triggers keeps unified look. -->
              <div class="flex items-stretch h-9 rounded-md border border-gray-300 bg-white group">
                <RemoteSearchSelect v-model="selectedDatePreset" :fetch-fn="fetchDatePresets"
                  placeholder="Ngày ghi nhận" label-field="label" borderless
                  :trigger-class="'h-9 rounded-none border-r border-gray-200 min-w-[138px] px-3 flex-1'" clearable>
                  <template #panel="{ close }">
                    <div class="p-2 w-[320px] bg-white">
                      <div class="grid grid-cols-2 gap-2">
                        <button v-for="preset in [
                          { value: 'today', label: 'Hôm nay' },
                          { value: 'yesterday', label: 'Hôm qua' },
                          { value: 'last7d', label: '7 ngày qua' },
                          { value: 'last30d', label: '30 ngày qua' },
                          { value: 'prevWeek', label: 'Tuần trước' },
                          { value: 'thisWeek', label: 'Tuần này' },
                          { value: 'lastMonth', label: 'Tháng trước' },
                          { value: 'thisMonth', label: 'Tháng này' },
                          { value: 'prevYear', label: 'Năm trước' },
                          { value: 'thisYear', label: 'Năm nay' }
                        ]" :key="preset.value" type="button"
                          class="px-3 py-2 text-sm border rounded hover:bg-gray-50 text-gray-700"
                          :class="selectedDatePreset?.value === preset.value ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-gray-300'"
                          @click="selectedDatePreset = preset; close()">
                          {{ preset.label }}
                        </button>
                      </div>

                      <!-- Custom Option Button -->
                      <button type="button"
                        class="w-full mt-2 px-3 py-2 text-sm border rounded hover:bg-gray-50 text-gray-700"
                        :class="selectedDatePreset?.value === 'custom' ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-gray-300'"
                        @click="selectedDatePreset = { value: 'custom', label: 'Tùy chọn' }">
                        Tùy chọn <span v-if="customFromDate && customToDate && selectedDatePreset?.value === 'custom'"
                          class="ml-1 text-xs text-gray-500">({{ format(new Date(customFromDate), 'dd/MM/yyyy') }} - {{
                            format(new Date(customToDate), 'dd/MM/yyyy') }})</span>
                      </button>

                      <!-- Custom Date Inputs -->
                      <div v-if="selectedDatePreset?.value === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <label class="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
                          <input type="date" v-model="customFromDate"
                            class="w-full h-8 px-2 rounded border border-gray-300 bg-white text-xs focus:ring-1 focus:ring-primary-500">
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
                          <input type="date" v-model="customToDate"
                            class="w-full h-8 px-2 rounded border border-gray-300 bg-white text-xs focus:ring-1 focus:ring-primary-500">
                        </div>
                      </div>

                      <!-- Filter Button -->
                      <div class="mt-4 pt-2 border-t border-gray-100">
                        <button type="button"
                          class="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-medium text-sm"
                          @click="applyCustomDateFilter(close)">
                          Lọc
                        </button>
                      </div>
                    </div>
                  </template>
                </RemoteSearchSelect>
                <!-- <RemoteSearchSelect v-model="selectedBranch" :fetch-fn="fetchBranches" placeholder="Chi nhánh"
                  label-field="name" borderless
                  :trigger-class="'h-9 rounded-none border-r border-gray-200 min-w-[140px] px-3 flex-1'" clearable /> -->
                <RemoteSearchSelect v-model="docTypeDisplay" :fetch-fn="fetchDocTypes" placeholder="Loại chứng từ"
                  label-field="label" borderless
                  :trigger-class="'h-9 rounded-none border-r border-gray-200 min-w-[140px] px-3 flex-1'" clearable
                  @open="tempSelectedDocTypes = [...selectedDocTypes]">
                  <template #panel="{ close }">
                    <div class="p-2 w-[220px] bg-white">
                      <div class="space-y-2">
                        <label v-for="opt in docTypeOptions" :key="opt.code"
                          class="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" v-model="tempSelectedDocTypes" :value="opt.code"
                            class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500">
                          <span class="text-sm text-gray-700">{{ opt.label }}</span>
                        </label>
                      </div>
                      <div class="mt-3 pt-2 border-t border-gray-100">
                        <button type="button"
                          class="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-medium text-sm"
                          @click="selectedDocTypes = [...tempSelectedDocTypes]; close(); triggerFetch()">
                          Lọc
                        </button>
                      </div>
                    </div>
                  </template>
                </RemoteSearchSelect>
                <button type="button"
                  class="h-full px-4 inline-flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 rounded-none">
                  <svg class="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 4h18M6 8h12l-4 6v6l-4-2v-4l-4-6Z" />
                  </svg>
                  Bộ lọc khác
                </button>
              </div>
              <button type="button"
                class="ml-4 h-9 px-4 inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-sm text-gray-700">
                Lưu bộ lọc
              </button>
            </div>
          </div>
        </template>
        <template #tabs-line-actions>
          <UDropdownMenu :items="createSlipItems" :popper="{ placement: 'bottom-start' }">
            <button type="button"
              class="h-9 px-6 min-w-[158px] inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm shadow-sm">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              <span>Tạo phiếu</span>
              <svg class="w-4 h-4 -mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </UDropdownMenu>
        </template>
      </CashFlowTable>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
/* Minor polish: lighter header text */
thead th {
  color: #4b5563;
}

/* Summary bar now wraps on very small screens; spacing tightens via responsive gap utilities */
</style>
