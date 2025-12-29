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

type TabKey = 'all' | 'cash' | 'bank' | 'unassigned'
const activeTab = ref<TabKey>('all')
const { isNotificationsSlideoverOpen } = useDashboard()

interface TabDef {
  label: string
  value: TabKey
}

const tabCounts = computed<TabDef[]>(() => [
  { label: 'Tổng quỹ', value: 'all' },
  { label: 'Quỹ tiền mặt', value: 'cash' },
  { label: 'Quỹ tiền gửi', value: 'bank' },
  { label: 'Chưa có thông tin quỹ', value: 'unassigned' }
])

const selectedDatePreset = ref<{ value: string, label: string } | null>(null)
const docTypeOptions = [
  { code: 'ThuTienMat', label: 'Phiếu thu tiền mặt' },
  { code: 'ChiTienMat', label: 'Phiếu chi tiền mặt' },
  { code: 'ThuTKNH', label: 'Thu vào TKNH' },
  { code: 'ChiTKNH', label: 'Chi từ TKNH' },
  { code: 'Transfer', label: 'Chuyển quỹ nội bộ' }
]
const selectedDocTypes = ref<string[]>([])
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

const tempSelectedDocTypes = ref<string[]>([])

interface DatePresetItem extends Record<string, unknown> {
  value: string
  label: string
}

async function fetchDatePresets(q: string): Promise<DatePresetItem[]> {
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
  const qq = q.toLowerCase()
  return (qq ? items.filter(i => i.label.toLowerCase().includes(qq)) : items)
}

async function fetchDocTypes(q: string) {
  return []
}

const rowSelection = ref<Record<string, boolean>>({})
const q = ref('')

const { selectedWarehouse: globalWarehouse, setWarehouse } = useGlobalWarehouse()
const selectedHeaderWarehouse = computed<WarehouseOption | null>({
  get() {
    const sw = globalWarehouse.value
    if (sw && sw.id !== null && sw.id !== undefined && String(sw.id).trim() !== '') {
      return { id: sw.id, name: sw.name }
    }
    return null
  },
  set(v) {
    if (!v) return
    const id = v.id == null ? null : (typeof v.id === 'number' ? v.id : Number(v.id))
    setWarehouse({ id, name: v.name })
  }
})

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
const refreshing = ref(false)

const openingBalance = ref(0)
const totalIn = ref(0)
const totalOut = ref(0)
const closingBalance = ref(0)
const methodBreakdown = ref<MethodBreakdownEntry[]>([])

const pagination = ref({ pageIndex: 0, pageSize: 20 })
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pagination.value.pageSize) || 1)

let fetchTimeout: ReturnType<typeof setTimeout> | null = null

const customFromDate = ref('')
const customToDate = ref('')
const selectedBranch = ref(null)

async function fetchBranches(q: string) { return [] }

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
        const s = new Date(now)
        s.setDate(s.getDate() - 30)
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

function mapMethod(tab: TabKey): number {
  switch (tab) {
    case 'cash': return 1
    case 'bank': return 2
    case 'unassigned': return 0
    case 'all':
    default: return 0
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
  const res = await cashBookService.filterCached(body, {
    onUpdated: (data) => {
      rawItems.value = data.items
      totalRecords.value = data.pagination.total
      openingBalance.value = data.openingBalance
      totalIn.value = data.totalIn
      totalOut.value = data.totalOut
      closingBalance.value = data.closingBalance
      methodBreakdown.value = data.methodBreakdown
    }
  })

  const data = res.data
  rawItems.value = data.items
  totalRecords.value = data.pagination.total
  openingBalance.value = data.openingBalance
  totalIn.value = data.totalIn
  totalOut.value = data.totalOut
  closingBalance.value = data.closingBalance
  methodBreakdown.value = data.methodBreakdown

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

const totalReceipts = computed(() => totalIn.value)
const totalPayments = computed(() => totalOut.value)

const cashBalance = computed(() => methodBreakdown.value.find(m => m.method === 1)?.net ?? closingBalance.value)
const bankBalance = computed(() => methodBreakdown.value.find(m => m.method === 2)?.net ?? 0)

function handleCreateSlip(type: 'receipt' | 'payment' | 'transfer') {
  if (type === 'receipt') {
    router.push('/cash-flow/create-receipt')
  } else if (type === 'payment') {
    router.push('/cash-flow/create-payment')
  } else if (type === 'transfer') {
    router.push('/cash-flow/internal-transfer')
  }
}

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

const pagedRows = computed(() => rows.value)

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
          <UButton label="Xuất file" color="neutral" variant="soft" size="sm" />
          <UButton label="Lý do thu chi" color="neutral" variant="soft" size="sm" />
          <WarehouseSwitcher v-model="selectedHeaderWarehouse" :include-all="true" :clearable="true" :borderless="true"
            :auto-width="true" />

          <div class="h-5 w-px bg-gray-200 mx-2" />

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
      <!-- Summary Card - Professional & Compact -->
      <div class="bg-white rounded-xl p-5 mb-1">
        <div class="flex items-center justify-between gap-8">
          <!-- Main Balance Card -->
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div class="text-xs font-medium text-gray-500 mb-0.5">Tồn quỹ hiện tại</div>
              <div class="text-2xl font-bold text-gray-900">{{ formatCurrency(closingBalance) }}</div>
              <div class="flex items-center gap-3 mt-1 text-xs text-gray-600">
                <span class="flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  TM: <span class="font-semibold text-gray-700">{{ formatCurrency(cashBalance) }}</span>
                </span>
                <span class="flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  TG: <span class="font-semibold text-gray-700">{{ formatCurrency(bankBalance) }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="h-16 w-px bg-gray-200"></div>

          <!-- Stats Grid -->
          <div class="flex items-center gap-8 flex-1 justify-end">
            <!-- Opening Balance -->
            <div class="text-center">
              <div class="text-xs font-medium text-gray-500 mb-1">Quỹ đầu kỳ</div>
              <div class="text-xl font-bold text-gray-900">{{ formatCurrency(openingBalance) }}</div>
            </div>

            <!-- Total Receipts -->
            <div class="text-center">
              <div class="text-xs font-medium text-gray-500 mb-1">Tổng thu</div>
              <div class="text-xl font-bold text-emerald-600">{{ formatCurrency(totalReceipts) }}</div>
            </div>

            <!-- Total Payments -->
            <div class="text-center">
              <div class="text-xs font-medium text-gray-500 mb-1">Tổng chi</div>
              <div class="text-xl font-bold text-rose-600">{{ formatCurrency(totalPayments) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <CashFlowTable :data="pagedRows" :loading="loading" :q="q" :row-selection="rowSelection" :pagination="pagination"
        :tabs="tabCounts" :total-records="totalRecords" :total-pages="totalPages" @update:q="val => q = val"
        @update:row-selection="val => rowSelection = val"
        @update:pagination="val => { pagination = val; triggerFetch() }" @update:tab="onTabChange"
        @navigate-code="goToReceipt">
        <template #filters-line>
          <div class="flex flex-wrap items-center w-full gap-3">
            <!-- Search input -->
            <div class="relative flex-1 min-w-[260px]">
              <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <input v-model="q" type="text" placeholder="Tìm mã phiếu, tham chiếu, chứng từ gốc"
                class="h-10 w-full pl-10 pr-4 rounded-lg border border-gray-200 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition-all">
            </div>

            <!-- Filter Group -->
            <div class="flex items-center gap-2">
              <div class="flex items-stretch h-10 rounded-lg border border-gray-200 bg-white overflow-hidden">
                <RemoteSearchSelect v-model="selectedDatePreset" :fetch-fn="fetchDatePresets"
                  placeholder="Ngày ghi nhận" label-field="label" borderless
                  :trigger-class="'h-10 rounded-none border-r border-gray-200 min-w-[140px] px-3'" clearable>
                  <template #panel="{ close }">
                    <div class="p-3 w-[320px] bg-white rounded-lg shadow-lg">
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
                          class="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                          :class="selectedDatePreset?.value === preset.value ? 'border-blue-500 text-blue-600 bg-blue-50 font-semibold' : 'border-gray-200'"
                          @click="selectedDatePreset = preset; close()">
                          {{ preset.label }}
                        </button>
                      </div>

                      <button type="button"
                        class="w-full mt-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                        :class="selectedDatePreset?.value === 'custom' ? 'border-blue-500 text-blue-600 bg-blue-50 font-semibold' : 'border-gray-200'"
                        @click="selectedDatePreset = { value: 'custom', label: 'Tùy chọn' }">
                        Tùy chọn <span v-if="customFromDate && customToDate && selectedDatePreset?.value === 'custom'"
                          class="ml-1 text-xs text-gray-500">({{ format(new Date(customFromDate), 'dd/MM/yyyy') }} - {{
                            format(new Date(customToDate), 'dd/MM/yyyy') }})</span>
                      </button>

                      <div v-if="selectedDatePreset?.value === 'custom'" class="mt-3 grid grid-cols-2 gap-2">
                        <div>
                          <label class="block text-xs font-medium text-gray-600 mb-1">Từ ngày</label>
                          <input type="date" v-model="customFromDate"
                            class="w-full h-9 px-2 rounded-lg border border-gray-200 bg-white text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500">
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-600 mb-1">Đến ngày</label>
                          <input type="date" v-model="customToDate"
                            class="w-full h-9 px-2 rounded-lg border border-gray-200 bg-white text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500">
                        </div>
                      </div>

                      <div class="mt-4 pt-3 border-t border-gray-100">
                        <button type="button"
                          class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                          @click="applyCustomDateFilter(close)">
                          Áp dụng
                        </button>
                      </div>
                    </div>
                  </template>
                </RemoteSearchSelect>

                <RemoteSearchSelect v-model="docTypeDisplay" :fetch-fn="fetchDocTypes" placeholder="Loại chứng từ"
                  label-field="label" borderless
                  :trigger-class="'h-10 rounded-none border-r border-gray-200 min-w-[140px] px-3'" clearable
                  @open="tempSelectedDocTypes = [...selectedDocTypes]">
                  <template #panel="{ close }">
                    <div class="p-3 w-[240px] bg-white rounded-lg shadow-lg">
                      <div class="space-y-2">
                        <label v-for="opt in docTypeOptions" :key="opt.code"
                          class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                          <input type="checkbox" v-model="tempSelectedDocTypes" :value="opt.code"
                            class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                          <span class="text-sm text-gray-700">{{ opt.label }}</span>
                        </label>
                      </div>
                      <div class="mt-3 pt-3 border-t border-gray-100">
                        <button type="button"
                          class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                          @click="selectedDocTypes = [...tempSelectedDocTypes]; close(); triggerFetch()">
                          Áp dụng
                        </button>
                      </div>
                    </div>
                  </template>
                </RemoteSearchSelect>

                <button type="button"
                  class="h-full px-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 4h18M6 8h12l-4 6v6l-4-2v-4l-4-6Z" />
                  </svg>
                  Bộ lọc khác
                </button>
              </div>

              <button type="button"
                class="h-10 px-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium transition-colors">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Lưu bộ lọc
              </button>
            </div>
          </div>
        </template>

        <template #tabs-line-actions>
          <UDropdownMenu :items="createSlipItems" :popper="{ placement: 'bottom-start' }">
            <button type="button"
              class="h-10 px-6 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-95">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              <span>Tạo phiếu</span>
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
thead th {
  color: #4b5563;
}
</style>
