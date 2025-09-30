<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import OverviewLineChart from '@/components/home/OverviewLineChart.vue'
import TopHorizontalBar from '@/components/home/top/TopHorizontalBar.vue'
import type { OverviewChartPoint } from '@/services/statistics.service'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import { warehouseService } from '@/services/warehouse.service'
import type { WarehouseItem } from '@/services/warehouse.service'

// Period filter options (restored)
interface PeriodOption {
  value: string
  label: string
  [k: string]: unknown
}
const periodOptions: PeriodOption[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'yesterday', label: 'Hôm qua' },
  { value: 'last7d', label: '7 ngày qua' },
  { value: 'thismonth', label: 'Tháng này' },
  { value: 'lastmonth', label: 'Tháng trước' },
  { value: 'all', label: 'Toàn thời gian' }
]
const selectedPeriod = ref<PeriodOption | null>(periodOptions[0] || null)
function fetchPeriods(search: string) {
  const q = (search || '').toLowerCase()
  return Promise.resolve(q ? periodOptions.filter(p => p.label.toLowerCase().includes(q)) : periodOptions)
}

// Branch (warehouse) filter (restored)
interface BranchOption {
  id: number | null
  name: string
  code?: string
  isDefault?: boolean
  [k: string]: unknown
}
const allBranch: BranchOption = { id: null, name: 'Tất cả chi nhánh' }
const selectedBranch = ref<BranchOption | null>(allBranch)
async function fetchBranches(search: string) {
  try {
    const res = await warehouseService.getWarehouses()
    const list: WarehouseItem[] = Array.isArray(res?.data) ? res.data : []
    const mapped: BranchOption[] = list.map(w => ({ id: w.id, name: w.name, code: undefined, isDefault: w.isDefault }))
    const lower = (search || '').toLowerCase()
    const filtered = lower ? mapped.filter(b => b.name.toLowerCase().includes(lower)) : mapped
    return [allBranch, ...filtered]
  } catch {
    return [allBranch]
  }
}
function onClearBranch() {
  selectedBranch.value = allBranch
}

// KPI metrics (placeholder demo; integrate real API if needed)
interface MetricCard {
  key: string
  label: string
  suffix?: string
}
const metricCards: MetricCard[] = [
  { key: 'revenue', label: 'Doanh thu thuần', suffix: 'đ' },
  { key: 'profit', label: 'Lợi nhuận', suffix: 'đ' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'inventoryValue', label: 'Giá trị tồn kho', suffix: 'đ' }
]

interface KPIData {
  value: number
  growth: number
}
const kpiData = ref<Record<string, KPIData>>({
  revenue: { value: 2310000, growth: 100 },
  profit: { value: 850000, growth: 100 },
  orders: { value: 5, growth: 100 },
  inventoryValue: { value: 56400000, growth: 0 }
})

function formatMetric(value: number | undefined, suffix?: string) {
  if (value == null) return '--'
  const formatted = value.toLocaleString('vi-VN')
  return suffix ? `${formatted}${suffix}` : formatted
}
function formatGrowth(g: number) {
  return `${g > 0 ? '+' : ''}${g.toFixed(0)}%`
}
function growthClass(g: number) {
  return g > 0 ? 'text-green-600' : g < 0 ? 'text-red-600' : 'text-gray-500'
}

// Chart data (reuse OverviewLineChart component)
// Match OverviewChartPoint -> expects at least period property
const chartPoints = ref<OverviewChartPoint[]>([])
const chartLoading = ref(false)
async function loadChart() {
  chartLoading.value = true
  try {
    chartPoints.value = Array.from({ length: 14 }).map((_, i) => ({
      period: String(i + 1),
      revenue: Math.round(Math.random() * 300000),
      profit: Math.round(Math.random() * 120000),
      orders: Math.round(Math.random() * 10),
      returns: Math.round(Math.random() * 2)
    }))
  } finally {
    chartLoading.value = false
  }
}

// Top lists placeholders
interface TopItem {
  name: string
  value: number
  extra?: number
}
const topProducts = ref<TopItem[]>([])
const topCustomers = ref<TopItem[]>([])
const topRevenueBySource = ref<TopItem[]>([])
const topRevenueByBranch = ref<TopItem[]>([])
const loadingTopProducts = ref(false)
const loadingTopCustomers = ref(false)
const loadingRevenueBySource = ref(false)
const loadingRevenueByBranch = ref(false)
async function loadTopLists() {
  loadingTopProducts.value = true
  loadingTopCustomers.value = true
  loadingRevenueBySource.value = true
  loadingRevenueByBranch.value = true
  try {
    topProducts.value = [
      { name: 'Sản phẩm 001', value: 1310000 },
      { name: 'Sản phẩm 002', value: 1010000 }
    ]
    topCustomers.value = [
      { name: 'Khách A', value: 950000 },
      { name: 'Khách B', value: 910000 }
    ]
    topRevenueBySource.value = [
      { name: 'Website', value: 1800000 },
      { name: 'Facebook', value: 310000 },
      { name: 'Shopee', value: 200000 }
    ]
    topRevenueByBranch.value = [
      { name: 'Cửa hàng chính', value: 2310000 }
    ]
  } finally {
    loadingTopProducts.value = false
    loadingTopCustomers.value = false
    loadingRevenueBySource.value = false
    loadingRevenueByBranch.value = false
  }
}

onMounted(() => {
  loadChart()
  loadTopLists()
})

watch([selectedPeriod, selectedBranch], () => {
  loadChart()
  loadTopLists()
})
</script>

<template>
  <UDashboardPanel id="reports-overview">
    <template #header>
      <UDashboardNavbar title="Tổng quan báo cáo" />
    </template>
    <template #body>
      <div class="space-y-6">
        <div class="border-b border-gray-200 overflow-x-auto">
          <nav class="flex items-center gap-6 text-sm font-medium min-w-max py-1 whitespace-nowrap select-none">
            <button class="relative py-3 text-primary-600">
              <span class="absolute left-0 -bottom-px h-0.5 w-full bg-primary-600" />
              <span class="sr-only">Tab:</span>
              <span>Tổng quan</span>
            </button>
            <button class="py-3 text-gray-600 hover:text-gray-900">
              Phân tích doanh thu
            </button>
            <button class="py-3 text-gray-600 hover:text-gray-900">
              Phân tích khách hàng
            </button>
            <button class="py-3 text-gray-600 hover:text-gray-900">
              Phân tích website
            </button>
            <button class="py-3 text-gray-600 hover:text-gray-900">
              Phân tích kinh doanh Sàn
            </button>
            <button class="ml-auto h-7 w-7 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50 text-gray-600" aria-label="Thêm tab tuỳ chỉnh">
              +
            </button>
          </nav>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <RemoteSearchSelect
            v-model="selectedPeriod"
            :fetch-fn="fetchPeriods"
            label-field="label"
            :searchable="false"
            :clearable="false"
            :auto-width="true"
            borderless
            dropdown-max-height="180px"
            style="background: #ffffff; border-radius: 5px;"
          />
          <RemoteSearchSelect
            v-model="selectedBranch"
            :fetch-fn="fetchBranches"
            placeholder="Tất cả chi nhánh"
            label-field="name"
            :searchable="false"
            :clearable="selectedBranch?.id !== null"
            :auto-width="true"
            borderless
            style="background: #ffffff; border-radius: 5px;"
            @clear="onClearBranch"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="card in metricCards"
            :key="card.key"
            class="bg-white rounded-md p-4 flex flex-col gap-1  border-gray-100"
          >
            <div class="text-xs text-gray-500">
              {{ card.label }}
            </div>
            <div class="flex items-center justify-between">
              <div class="text-xl font-semibold">
                {{ formatMetric(kpiData[card.key]?.value, card.suffix) }}
              </div>
              <div class="text-xs font-medium" :class="growthClass(kpiData[card.key]?.growth || 0)">
                {{ formatGrowth(kpiData[card.key]?.growth || 0) }}
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-md p-5  border-gray-100">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold">
                Doanh thu theo thời gian
              </h3>
            </div>
            <OverviewLineChart
              :points="chartPoints"
              :loading="chartLoading"
              :metrics="['revenue', 'profit', 'orders']"
              :line-width="1"
            />
          </div>
          <div class="bg-white rounded-md p-5  border-gray-100">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold">
                Số lượng đơn hàng theo thời gian
              </h3>
            </div>
            <OverviewLineChart
              :points="chartPoints"
              :loading="chartLoading"
              :metrics="['orders']"
              :line-width="1"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopHorizontalBar
            title="Top sản phẩm bán chạy"
            :items="topProducts"
            :loading="loadingTopProducts"
            metric="revenue"
          />
          <TopHorizontalBar
            title="Top khách hàng theo doanh thu"
            :items="topCustomers"
            :loading="loadingTopCustomers"
            metric="revenue"
          />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopHorizontalBar
            title="Doanh thu theo nguồn đơn hàng"
            :items="topRevenueBySource"
            :loading="loadingRevenueBySource"
            metric="revenue"
          />
          <TopHorizontalBar
            title="Doanh thu theo chi nhánh"
            :items="topRevenueByBranch"
            :loading="loadingRevenueByBranch"
            metric="revenue"
          />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-white rounded-md p-5  border-gray-100">
            <h3 class="text-sm font-semibold mb-4">
              Chi tiêu khách hàng theo thời gian
            </h3>
            <div class="h-40 flex items-center justify-center text-gray-400 text-xs">
              (Đang cập nhật)
            </div>
          </div>
          <div class="bg-white rounded-md p-5  border-gray-100">
            <h3 class="text-sm font-semibold mb-4">
              Tỉ lệ chuyển đổi
            </h3>
            <div class="h-40 flex items-center justify-center text-gray-400 text-xs">
              (Chưa có dữ liệu)
            </div>
          </div>
          <div class="bg-white rounded-md p-5  border-gray-100">
            <h3 class="text-sm font-semibold mb-4">
              Phiếu nhập/đi theo thời gian
            </h3>
            <div class="h-40 flex items-center justify-center text-gray-400 text-xs">
              (Đang cập nhật)
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
</style>
