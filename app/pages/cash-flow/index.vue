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
async function fetchDatePresets(q: string) {
  const items = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'yesterday', label: 'Hôm qua' },
    { value: 'last7d', label: '7 ngày qua' },
    { value: 'thismonth', label: 'Tháng này' },
    { value: 'lastmonth', label: 'Tháng trước' },
    { value: 'all', label: 'Toàn thời gian' }
  ]
  interface DatePreset extends Record<string, unknown> {
    value: string
    label: string
  }
  const typed: DatePreset[] = items
  const qq = q.toLowerCase()
  return qq ? typed.filter(i => i.label.toLowerCase().includes(qq)) : typed
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
      <UDashboardNavbar title="Sổ quỹ">
        <template #leading>
          <UDashboardSidebarCollapse />
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
        <div class="flex flex-wrap items-center gap-10 text-[13px] leading-tight">
          <!-- Opening Balance -->
          <div class="flex flex-col justify-center min-w-[110px]">
            <div class="text-[13px] text-gray-900 font-medium flex items-center gap-1">
              <span>Quỹ đầu kỳ</span>
              <UTooltip text="Số dư đầu kỳ" />
            </div>
            <div class="font-semibold text-[15px] mt-1">
              {{ formatCurrency(openingBalance) }}
            </div>
          </div>
          <!-- + separator -->
          <div class="self-center flex items-center text-sm font-medium text-gray-400 px-2">
            +
          </div>
          <!-- Total Receipts -->
          <div class="flex flex-col justify-center min-w-[120px]">
            <div class="text-[13px] text-gray-900 font-medium flex items-center gap-1">
              <span>Tổng thu</span>
              <UTooltip text="Tổng số tiền đã thu" />
            </div>
            <div class="font-semibold text-emerald-600 text-[15px] mt-1">
              {{ formatCurrency(totalReceipts) }}
            </div>
          </div>
          <!-- - separator -->
          <div class="self-center flex items-center text-sm font-medium text-gray-400 px-2">
            -
          </div>
          <!-- Total Payments -->
          <div class="flex flex-col justify-center min-w-[120px]">
            <div class="text-[13px] text-gray-900 font-medium flex items-center gap-1">
              <span>Tổng chi</span>
              <UTooltip text="Tổng số tiền đã chi" />
            </div>
            <div class="font-semibold text-red-600 text-[15px] mt-1">
              {{ formatCurrency(totalPayments) }}
            </div>
          </div>
          <!-- = separator -->
          <div class="self-center flex items-center text-sm font-medium text-gray-400 px-2">
            =
          </div>
          <!-- Closing Balance -->
          <div class="flex flex-col justify-center min-w-[120px]">
            <div class="text-[13px] text-gray-900 font-medium flex items-center gap-1">
              <span>Tồn quỹ</span>
              <UTooltip text="Số dư cuối cùng sau thu - chi" />
            </div>
            <div class="font-semibold text-sky-700 text-[15px] mt-1">
              {{ formatCurrency(closingBalance) }}
            </div>
          </div>
          <!-- Cash / Bank split -->
          <div class="ml-auto bg-sky-50 rounded-md px-8 py-4 flex flex-col justify-center min-w-[260px]">
            <div class="flex items-center justify-between gap-10">
              <span class="text-[13px] text-gray-900 font-medium">Quỹ tiền mặt:</span>
              <span class="text-[15px] font-semibold">{{ formatCurrency(cashBalance) }}</span>
            </div>
            <div class="flex items-center justify-between gap-10 mt-2">
              <span class="text-[13px] text-gray-900 font-medium">Quỹ tiền gửi:</span>
              <span class="text-[15px] font-semibold">{{ formatCurrency(bankBalance) }}</span>
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
        <template #search-actions>
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

