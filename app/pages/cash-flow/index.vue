<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import CashFlowTable from '@/components/cash-flow/CashFlowTable.vue'

// Tabs (mirroring orders table style with counts)
type TabKey = 'all' | 'cash' | 'bank' | 'unassigned'
const activeTab = ref<TabKey>('all')
interface TabDef {
  label: string
  value: TabKey
  count?: number
}
const tabCounts = computed<TabDef[]>(() => {
  // derive counts from filtered rows (simple mock logic)
  const all = rows.value.length
  // for now counts per fund types mimic all (placeholder); adjust when fund type classification available
  return [
    { label: 'Tổng quỹ', value: 'all', count: all },
    { label: 'Quỹ tiền mặt', value: 'cash', count: all },
    { label: 'Quỹ tiền gửi', value: 'bank', count: all },
    { label: 'Chưa có thông tin quỹ', value: 'unassigned', count: 0 }
  ]
})

// Filters state (stub)
const selectedDatePreset = ref<{ value: string, label: string } | null>({ value: 'today', label: 'Hôm nay' })
interface BranchOption {
  id: number
  name: string
}
interface DocTypeOption {
  code: string
  name: string
}
const selectedBranch = ref<BranchOption | null>(null)
const selectedDocType = ref<DocTypeOption | null>(null)

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
async function fetchBranches(q: string) {
  const items: (BranchOption & { [k: string]: unknown })[] = [
    { id: 1, name: 'Chi nhánh chính' },
    { id: 2, name: 'Kho online' }
  ]
  const qq = q.toLowerCase()
  return qq ? items.filter(i => i.name.toLowerCase().includes(qq)) : items
}
async function fetchDocTypes(q: string) {
  const items: (DocTypeOption & { [k: string]: unknown })[] = [
    { code: 'RVN', name: 'Thu bán hàng' },
    { code: 'PVN', name: 'Chi hoàn khách' }
  ]
  const qq = q.toLowerCase()
  return qq ? items.filter(i => i.name.toLowerCase().includes(qq) || i.code.toLowerCase().includes(qq)) : items
}

// Mock ledger rows
interface LedgerRow {
  id: string
  code: string
  date: string // dd/MM/yyyy
  partnerName: string
  reason: string
  originalDoc: string
  amount: number // positive = receipt, negative = payment
}
const rows = ref<LedgerRow[]>([])
const loading = ref(true)
onMounted(() => {
  // simulate fetch
  setTimeout(() => {
    rows.value = [
      { id: '1', code: 'PVN00003', date: '25/09/2025', partnerName: 'Trần Nam', reason: 'Chi hoàn tiền khách trả hàng', originalDoc: '#1004', amount: -70000 },
      { id: '2', code: 'PVN00002', date: '25/09/2025', partnerName: 'Hải Đăng', reason: 'Chi hoàn tiền khách trả hàng', originalDoc: '#1005-R1', amount: -360000 },
      { id: '3', code: 'RVN00007', date: '25/09/2025', partnerName: 'Hải Đăng', reason: 'Thu tiền bán hàng', originalDoc: '#1005', amount: 1290000 },
      { id: '4', code: 'RVN00006', date: '25/09/2025', partnerName: 'Trần Nam', reason: 'Thu tiền bán hàng', originalDoc: '#1004', amount: 100000 },
      { id: '5', code: 'PVN00001', date: '25/09/2025', partnerName: 'Trần Nam', reason: 'Chi hoàn tiền khách trả hàng', originalDoc: '#1004', amount: -30000 },
      { id: '6', code: 'RVN00005', date: '24/09/2025', partnerName: 'Trần Nam', reason: 'Thu tiền bán hàng', originalDoc: '#1004', amount: 260000 },
      { id: '7', code: 'RVN00004', date: '24/09/2025', partnerName: 'Trần Nam', reason: 'Thu tiền bán hàng', originalDoc: '#1003', amount: 80000 },
      { id: '8', code: 'RVN00003', date: '24/09/2025', partnerName: 'Trần Nam', reason: 'Thu tiền bán hàng', originalDoc: '#1003', amount: 220000 },
      { id: '9', code: 'RVN00002', date: '24/09/2025', partnerName: 'Trần Nam', reason: 'Thu tiền bán hàng', originalDoc: '#1002', amount: 840000 },
      { id: '10', code: 'RVN00001', date: '23/09/2025', partnerName: 'Trần Nam', reason: 'Thu tiền bán hàng', originalDoc: '#1001', amount: 130000 }
    ]
    loading.value = false
  }, 300)
})

// Computed summaries
const openingBalance = ref(0)
const totalReceipts = computed(() => rows.value.filter(r => r.amount > 0).reduce((s, r) => s + r.amount, 0))
const totalPayments = computed(() => rows.value.filter(r => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0))
const closingBalance = computed(() => openingBalance.value + totalReceipts.value - totalPayments.value)

// Temporary split (mock): all balance treated as cash, bank = 0 until real API provides breakdown
const cashBalance = computed(() => closingBalance.value)
const bankBalance = computed(() => 0)

// Create slip dropdown items
const createSlipItems = [
  [
    {
      label: 'Tạo phiếu thu',
      click: () => { /* TODO: open create receipt modal */ }
    },
    {
      label: 'Tạo phiếu chi',
      click: () => { /* TODO: open create payment modal */ }
    },
    {
      label: 'Chuyển quỹ nội bộ',
      click: () => { /* TODO: open internal transfer modal */ }
    }
  ]
]

function formatCurrency(v: number) {
  return v.toLocaleString('vi-VN') + 'đ'
}

// Pagination state (align with orders page pattern)
const pagination = ref({ pageIndex: 0, pageSize: 20 })
const totalRecords = computed(() => rows.value.length)
const totalPages = computed(() => Math.ceil(totalRecords.value / pagination.value.pageSize) || 1)
const pagedRows = computed(() => rows.value.slice(pagination.value.pageIndex * pagination.value.pageSize, (pagination.value.pageIndex + 1) * pagination.value.pageSize))

watch(() => pagination.value.pageSize, () => {
  pagination.value.pageIndex = 0
})

// Selection state for BaseTable API shape
const rowSelection = ref<Record<string, boolean>>({})
const q = ref('')
function onTabChange(val: string) {
  activeTab.value = val as TabKey
  pagination.value.pageIndex = 0
}
</script>

<template>
  <UDashboardPanel id="cash-flow">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
          <div>
            <div class="text-lg font-semibold">
              Sổ quỹ
            </div>
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              label="Xuất file"
              color="neutral"
              variant="soft"
              size="sm"
            />
            <UButton
              label="Lý do thu chi"
              color="neutral"
              variant="soft"
              size="sm"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <!-- Summary Card (formula style) -->
      <UPageCard variant="soft" class="bg-white rounded-lg">
        <div
          class="flex flex-wrap items-start gap-x-10 gap-y-6 text-[14px] leading-tight
                 md:items-center"
        >
          <!-- Opening Balance -->
          <div class="flex flex-col justify-center min-w-[110px] shrink-0">
            <div class="text-[14px] text-gray-900 font-medium flex items-center gap-1">
              <span>Quỹ đầu kỳ</span>
              <UTooltip text="Số dư đầu kỳ" />
            </div>
            <div class="font-semibold text-[16px] mt-1">
              {{ formatCurrency(openingBalance) }}
            </div>
          </div>
          <!-- + separator -->
          <div class="hidden md:inline-flex self-center items-center text-sm font-medium text-gray-400 px-2">
            +
          </div>
          <!-- Total Receipts -->
          <div class="flex flex-col justify-center min-w-[120px] shrink-0">
            <div class="text-[14px] text-gray-900 font-medium flex items-center gap-1">
              <span>Tổng thu</span>
              <UTooltip text="Tổng số tiền đã thu" />
            </div>
            <div class="font-semibold text-emerald-600 text-[16px] mt-1">
              {{ formatCurrency(totalReceipts) }}
            </div>
          </div>
          <!-- - separator -->
          <div class="hidden md:inline-flex self-center items-center text-sm font-medium text-gray-400 px-2">
            -
          </div>
          <!-- Total Payments -->
          <div class="flex flex-col justify-center min-w-[120px] shrink-0">
            <div class="text-[14px] text-gray-900 font-medium flex items-center gap-1">
              <span>Tổng chi</span>
              <UTooltip text="Tổng số tiền đã chi" />
            </div>
            <div class="font-semibold text-red-600 text-[16px] mt-1">
              {{ formatCurrency(totalPayments) }}
            </div>
          </div>
          <!-- = separator -->
          <div class="hidden md:inline-flex self-center items-center text-sm font-medium text-gray-400 px-2">
            =
          </div>
          <!-- Closing Balance -->
          <div class="flex flex-col justify-center min-w-[120px] shrink-0 order-first w-full md:order-none md:w-auto">
            <div class="text-[14px] text-gray-900 font-medium flex items-center gap-1">
              <span>Tồn quỹ</span>
              <UTooltip text="Số dư cuối cùng sau thu - chi" />
            </div>
            <div class="font-semibold text-sky-700 text-[16px] mt-1">
              {{ formatCurrency(closingBalance) }}
            </div>
          </div>
          <!-- Cash / Bank split -->
          <div
            class="bg-sky-50 rounded-md px-6 py-4 flex flex-col justify-center min-w-[240px]
                   w-full md:w-auto md:ml-auto"
          >
            <div class="flex items-center justify-between gap-10">
              <span class="text-[14px] text-gray-900 font-medium">Quỹ tiền mặt:</span>
              <span class="text-[16px] font-semibold">{{ formatCurrency(cashBalance) }}</span>
            </div>
            <div class="flex items-center justify-between gap-10 mt-2">
              <span class="text-[14px] text-gray-900 font-medium">Quỹ tiền gửi:</span>
              <span class="text-[16px] font-semibold">{{ formatCurrency(bankBalance) }}</span>
            </div>
          </div>
        </div>
      </UPageCard>

      <!-- Table (BaseTable already has no horizontal padding for tabs & separator line) -->
      <CashFlowTable
        :data="pagedRows"
        :loading="loading"
        :q="q"
        :row-selection="rowSelection"
        :pagination="pagination"
        :tabs="tabCounts"
        :total-records="totalRecords"
        :total-pages="totalPages"
        @update:q="val => q = val"
        @update:row-selection="val => rowSelection = val"
        @update:pagination="val => pagination = val"
        @update:tab="onTabChange"
      >
        <template #filters-line>
          <div class="flex flex-wrap items-center w-full gap-4">
            <!-- Search input (left) -->
            <div class="relative flex-1 min-w-[260px]">
              <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
                <svg
                  class="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <input
                v-model="q"
                type="text"
                placeholder="Tìm mã phiếu, tham chiếu, chứng từ gốc"
                class="h-9 w-full pl-9 pr-3 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-0 text-sm"
              >
            </div>
            <!-- Right filter group (tight, right aligned) -->
            <div class="ml-auto flex items-center">
              <!-- Unified group wrapper -->
              <!-- NOTE: Removed overflow-hidden so dropdowns (absolutely positioned inside each RemoteSearchSelect) are not clipped.
                   Using border on outer wrapper + borderless triggers keeps unified look. -->
              <div class="flex items-stretch h-9 rounded-md border border-gray-300 bg-white group">
                <RemoteSearchSelect
                  v-model="selectedDatePreset"
                  :fetch-fn="fetchDatePresets"
                  placeholder="Ngày ghi nhận"
                  label-field="label"
                  borderless
                  :trigger-class="'h-9 rounded-none border-r border-gray-200 min-w-[138px] px-3 flex-1'"
                  clearable
                />
                <RemoteSearchSelect
                  v-model="selectedBranch"
                  :fetch-fn="fetchBranches"
                  placeholder="Chi nhánh"
                  label-field="name"
                  borderless
                  :trigger-class="'h-9 rounded-none border-r border-gray-200 min-w-[120px] px-3 flex-1'"
                  clearable
                />
                <RemoteSearchSelect
                  v-model="selectedDocType"
                  :fetch-fn="fetchDocTypes"
                  placeholder="Loại chứng từ"
                  label-field="name"
                  borderless
                  :trigger-class="'h-9 rounded-none border-r border-gray-200 min-w-[140px] px-3 flex-1'"
                  clearable
                />
                <button
                  type="button"
                  class="h-full px-4 inline-flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 rounded-none"
                >
                  <svg
                    class="w-4 h-4 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M3 4h18M6 8h12l-4 6v6l-4-2v-4l-4-6Z" />
                  </svg>
                  Bộ lọc khác
                </button>
              </div>
              <button
                type="button"
                class="ml-4 h-9 px-4 inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-sm text-gray-700"
              >
                Lưu bộ lọc
              </button>
            </div>
          </div>
        </template>
        <template #tabs-line-actions>
          <UDropdownMenu :items="createSlipItems" :popper="{ placement: 'bottom-start' }">
            <button
              type="button"
              class="h-9 px-6 min-w-[158px] inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm shadow-sm"
            >
              <svg
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              <span>Tạo phiếu</span>
              <svg
                class="w-4 h-4 -mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
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
thead th { color: #4b5563; }
</style>

