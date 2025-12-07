<script setup lang="ts">
// date-fns no longer needed after fixed period list
import type { DropdownMenuItem } from '@nuxt/ui'
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
// removed Period/Range type imports because they are not exported from ~/types in this workspace

import { useAuthService } from '~/composables/useAuthService'
import TrialBanner from '@/components/home/TrialBanner.vue'
import OverviewLineChart from '@/components/home/OverviewLineChart.vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import WarehouseSwitcher from '@/components/WarehouseSwitcher.vue'
import { useGlobalWarehouse } from '@/composables/useWarehouse'
import { orderSourceService } from '@/services/order-source.service'
import type { OrderSourceItem } from '@/services/order-source.service'
import { warehouseService } from '@/services/warehouse.service'
import type { WarehouseItem } from '@/services/warehouse.service'
import { statisticsService } from '@/services/statistics.service'
import type { TopProductDTO, TopCustomerDTO, OverviewResponseData, OverviewRangeKey } from '@/services/statistics.service'
import TopHorizontalBar from '@/components/home/top/TopHorizontalBar.vue'

// (placeholder) branch service would typically be imported; using orderSourceService pattern until real service

interface BranchItem {
  id: number | null
  name: string
  code?: string
  isDefault?: boolean
  [key: string]: unknown
}

const { user } = useAuthService()

const { isNotificationsSlideoverOpen } = useDashboard()

// (Kept for potential future use – shortcut actions in header)
const _items = [[{
  label: 'New mail',
  icon: 'i-lucide-send',
  to: '/inbox'
}, {
  label: 'New customer',
  icon: 'i-lucide-user-plus',
  to: '/customers'
}]] satisfies DropdownMenuItem[][]

// (Range retained previously for dynamic granularity; no longer needed with fixed period options)
const period = ref('daily')

// Period selection via RemoteSearchSelect (replaces HomePeriodSelect)
interface PeriodOption {
  value: string
  label: string
  [key: string]: unknown
}

// Fixed set of predefined periods for statistics API
// Mapping to backend range keys (except 'all' which means no range param -> full time)
const periodOptions = computed<PeriodOption[]>(() => ([
  { value: 'today', label: 'Hôm nay' },
  { value: 'yesterday', label: 'Hôm qua' },
  { value: 'last7d', label: '7 ngày qua' },
  { value: 'thismonth', label: 'Tháng này' },
  { value: 'lastmonth', label: 'Tháng trước' },
  { value: 'all', label: 'Toàn thời gian' }
]))

const selectedPeriod = ref<PeriodOption | null>(null)

// Keep period string and selected object in sync; ensure validity when range changes
watch(periodOptions, (opts) => {
  if (!opts.find(o => o.value === period.value)) {
    period.value = opts[0]?.value || 'daily'
  }
  selectedPeriod.value = opts.find(o => o.value === period.value) || opts[0] || null
}, { immediate: true })

watch(selectedPeriod, (opt) => {
  if (opt && opt.value !== period.value) period.value = opt.value
})

async function fetchPeriods(search: string) {
  let list = periodOptions.value
  if (search) {
    const lower = search.toLowerCase()
    list = list.filter(o => o.label.toLowerCase().includes(lower))
  }
  return list
}

function onClearPeriod() {
  const first = periodOptions.value[0]
  if (first) selectedPeriod.value = first
}

// Order source selection using generic RemoteSearchSelect
// Keep an explicit "Tất cả" object when cleared
const allSource = { id: null, name: 'Tất cả nguồn', code: 'ALL' }
const selectedOrderSource = ref<OrderSourceItem | typeof allSource | null>(allSource)

// Branch selection (chi nhánh) similar pattern with 'Tất cả chi nhánh'
const allBranch: BranchItem = { id: null, name: 'Tất cả chi nhánh', code: 'ALL_BRANCH' }
const { selectedWarehouse, setWarehouse } = useGlobalWarehouse()
// Bind dashboard branch selection to global warehouse selection
const selectedBranch = computed({
  get(): BranchItem | null {
    const sw = selectedWarehouse.value
    if (sw && sw.id !== null && sw.id !== undefined && String(sw.id).trim() !== '') {
      const numericId = typeof sw.id === 'number' ? sw.id : Number(sw.id)
      return { id: Number.isNaN(numericId) ? null : numericId, name: sw.name }
    }
    return allBranch
  },
  set(v: BranchItem | null) {
    if (!v) {
      setWarehouse(null)
      return
    }
    const id = v.id == null ? null : (typeof v.id === 'number' ? v.id : Number(v.id))
    setWarehouse({ id, name: v.name || '' })
  }
})

// Overview statistics state
const overviewLoading = ref(false)
const overviewData = ref<OverviewResponseData | null>(null)

// Map internal selected period or range selection to API range key when possible.
function deriveRangeKey(): OverviewRangeKey | undefined {
  // Direct mapping from selectedPeriod value; 'all' returns undefined so backend gives full range aggregate
  const val = selectedPeriod.value?.value
  if (!val || val === 'all') return undefined
  if (['today', 'yesterday', 'last7d', 'thismonth', 'lastmonth'].includes(val)) return val as OverviewRangeKey
  return undefined
}

async function loadOverview() {
  overviewLoading.value = true
  try {
    const rangeKey = deriveRangeKey()
    const res = await statisticsService.getOverview({
      range: rangeKey,
      sourceId: selectedOrderSource.value?.id ?? undefined,
      warehouseId: selectedBranch.value?.id ?? undefined
    })
    overviewData.value = res.data
  } catch (e) {
    console.error('Failed to load overview', e)
    overviewData.value = null
  } finally {
    overviewLoading.value = false
  }
}

// Initial load and reactive reloads
onMounted(() => {
  loadOverview()
  loadTopProducts()
  loadTopCustomers()
})

// Consolidated watch with debounce to prevent flickering
let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch([selectedOrderSource, selectedBranch, selectedPeriod], () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    loadOverview()
    loadTopProducts()
    loadTopCustomers()
  }, 300)
})

// Helper: format numbers (simple locale for now)
function formatMetricValue(val: number, suffix?: string) {
  if (val == null) return '--'
  const formatted = val.toLocaleString('vi-VN')
  return suffix ? `${formatted} ${suffix}` : formatted
}
function formatGrowth(growth: number) {
  if (growth == null) return '--'
  const sign = growth > 0 ? '+' : ''
  return `${sign}${growth.toFixed(2)}%`
}
function growthClass(growth?: number) {
  if (growth == null) return 'text-gray-400'
  if (growth > 0) return 'text-green-600'
  if (growth < 0) return 'text-red-600'
  return 'text-gray-500'
}

type MetricKey = 'revenue' | 'profit' | 'orders' | 'returns'
const metricCards: { key: MetricKey, label: string, suffix?: string }[] = [
  { key: 'revenue', label: 'Doanh thu thuần', suffix: 'đ' },
  { key: 'profit', label: 'Lợi nhuận bán hàng', suffix: 'đ' },
  { key: 'orders', label: 'Tổng đơn' },
  { key: 'returns', label: 'Trả hàng' }
]

async function fetchBranches(search: string) {
  try {
    const res = await warehouseService.getWarehouses()
    const list: WarehouseItem[] = Array.isArray(res?.data) ? res.data : []
    const mapped: BranchItem[] = list.map(w => ({
      id: w.id,
      name: w.name,
      code: undefined,
      isDefault: w.isDefault
    }))
    const lower = (search || '').toLowerCase()
    const filtered = lower
      ? mapped.filter(w => w.name.toLowerCase().includes(lower))
      : mapped
    return [allBranch, ...filtered]
  } catch {
    return [allBranch]
  }
}

function onClearBranch() {
  setWarehouse(null)
}

async function fetchOrderSources(search: string) {
  try {
    const res = await orderSourceService.getOrderSources()
    const list: OrderSourceItem[] = Array.isArray(res?.data) ? res.data : []
    const lower = (search || '').toLowerCase()
    const filtered = lower
      ? list.filter(s => s.name.toLowerCase().includes(lower) || s.code.toLowerCase().includes(lower))
      : list
    // Prepend All option
    return [allSource, ...filtered]
  } catch {
    return [allSource]
  }
}

function onClearSource() {
  selectedOrderSource.value = allSource
}

// Top products and customers state
const topProducts = ref<TopProductDTO[]>([])
const topCustomers = ref<TopCustomerDTO[]>([])
const topProductsLoading = ref(false)
const topCustomersLoading = ref(false)
const topProductsMetric = ref<'revenue' | 'quantity' | 'orders'>('revenue')

async function loadTopProducts() {
  topProductsLoading.value = true
  try {
    const rangeKey = deriveRangeKey()
    const params = {
      range: rangeKey,
      metric: topProductsMetric.value,
      limit: 10,
      sourceId: selectedOrderSource.value?.id ?? undefined,
      warehouseId: selectedBranch.value?.id ?? undefined
    }
    console.log('[Top Products] Loading with params:', params)
    const res = await statisticsService.getTopProducts(params)
    console.log('[Top Products] Response:', res)
    topProducts.value = Array.isArray(res.data) ? res.data : []
    console.log('[Top Products] Items count:', topProducts.value.length)
  } catch (e) {
    console.error('[Top Products] Failed to load:', e)
    topProducts.value = []
  } finally {
    topProductsLoading.value = false
  }
}

async function loadTopCustomers() {
  topCustomersLoading.value = true
  try {
    const rangeKey = deriveRangeKey()
    const params = {
      range: rangeKey,
      limit: 10,
      sourceId: selectedOrderSource.value?.id ?? undefined,
      warehouseId: selectedBranch.value?.id ?? undefined
    }
    console.log('[Top Customers] Loading with params:', params)
    const res = await statisticsService.getTopCustomers(params)
    console.log('[Top Customers] Response:', res)
    topCustomers.value = Array.isArray(res.data) ? res.data : []
    console.log('[Top Customers] Items count:', topCustomers.value.length)
  } catch (e) {
    console.error('[Top Customers] Failed to load:', e)
    topCustomers.value = []
  } finally {
    topCustomersLoading.value = false
  }
}

// Watch metric changes separately (no debounce needed for metric toggle)
watch(topProductsMetric, () => {
  loadTopProducts()
})

// Cleanup debounce timer on unmount
onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Tổng quan" :ui="{ right: 'gap-3' }" class="bg-white">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <!-- Global warehouse switcher (reusable) -->
          <WarehouseSwitcher v-model="selectedBranch" />
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

      <!-- Toolbar removed: controls moved into Overview card -->
    </template>

    <template #body>
      <!-- Welcome header -->
      <div class="space-y-6">
        <h2 class="text-2xl font-semibold mb-7">
          Chào mừng trở lại, {{ user?.display_name || 'Người dùng' }} 🎉
        </h2>
        <TrialBanner :days-left="3" class="mb-6" />

        <!-- Overview Card -->
        <div class="bg-white rounded-md p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <div class="font-semibold text-lg">
              Tổng quan
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <div class="flex items-center gap-2">
                <!-- <HomeDateRangePicker v-model="range" class="min-w-[240px]" /> -->
                <RemoteSearchSelect
                  v-model="selectedPeriod"
                  :fetch-fn="fetchPeriods"
                  label-field="label"
                  :clearable="selectedPeriod?.value !== periodOptions[0]?.value"
                  :searchable="false"
                  dropdown-max-height="180px"
                  class="[&_.mr-1]:ml-1"
                  :auto-width="true"
                  borderless
                  @clear="onClearPeriod"
                />
                <RemoteSearchSelect
                  v-model="selectedOrderSource"
                  :fetch-fn="fetchOrderSources"
                  placeholder="Tất cả nguồn"
                  label-field="name"
                  :clearable="selectedOrderSource?.id !== null"
                  :searchable="false"
                  class="[&_.mr-1]:ml-1"
                  :auto-width="true"
                  borderless
                  @clear="onClearSource"
                />
                <RemoteSearchSelect
                  v-model="selectedBranch"
                  :fetch-fn="fetchBranches"
                  placeholder="Tất cả chi nhánh"
                  label-field="name"
                  :clearable="selectedBranch?.id !== null"
                  :searchable="false"
                  class="[&_.mr-1]:ml-1"
                  :auto-width="true"
                  borderless
                  @clear="onClearBranch"
                />
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div
              v-for="card in metricCards"
              :key="card.key"
              class="bg-white rounded-md p-4 flex flex-col gap-1"
              style="border:1px dashed #e6e6e6;"
            >
              <div class="text-xs text-gray-500">
                {{ card.label }}
              </div>
              <div class="flex items-center justify-between">
                <div class="text-xl font-bold">
                  <span v-if="overviewData">
                    {{ formatMetricValue(overviewData.metrics[card.key].value, card.suffix) }}
                  </span>
                  <span v-else class="text-gray-400">--</span>
                </div>
                <div
                  class="text-xs font-medium flex items-center gap-1"
                  :class="growthClass(overviewData?.metrics[card.key].growth)"
                >
                  <template v-if="overviewData">
                    <UIcon
                      v-if="overviewData.metrics[card.key].growth > 0"
                      name="i-heroicons-arrow-up-right"
                      class="text-green-500"
                    />
                    <UIcon
                      v-else-if="overviewData.metrics[card.key].growth < 0"
                      name="i-heroicons-arrow-down-right"
                      class="text-red-500"
                    />
                    <span>
                      {{ formatGrowth(overviewData.metrics[card.key].growth) }}
                    </span>
                  </template>
                  <span v-else class="text-gray-400">--</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Chart -->
          <OverviewLineChart
            class="mb-4"
            :points="overviewData?.chart.points || []"
            :loading="overviewLoading"
            :metrics="['revenue', 'profit', 'orders']"
            :line-width="1"
          />
        </div>

        <!-- Top lists section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopHorizontalBar
            title="Top 10 sản phẩm bán chạy"
            :items="topProducts"
            :loading="topProductsLoading"
            :metric="topProductsMetric"
            metric-selectable
          />
          <TopHorizontalBar
            title="Top 10 khách mua nhiều nhất"
            :items="topCustomers"
            :loading="topCustomersLoading"
            metric="revenue"
          />
        </div>

        <!-- Things to do next -->
        <div class="bg-white rounded-xl p-6">
          <div class="font-semibold text-lg mb-4">
            Việc cần làm tiếp theo
          </div>
          <div class="mb-2 flex items-center gap-2 font-semibold">
            Cần xử lý
            <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">4</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <button class="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg px-4 py-2 transition">
              <UIcon name="i-heroicons-heart" class="text-lg" />
              Còn 4 người ủng hộ cần cảm ơn!
            </button>
            <button class="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg px-4 py-2 transition">
              <UIcon name="i-heroicons-archive-box" class="text-lg" />
              30 đơn hàng cần xử lý
            </button>
            <button class="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg px-4 py-2 transition">
              <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="text-lg" />
              10 bình luận mới
            </button>
            <button class="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg px-4 py-2 transition">
              <UIcon name="i-heroicons-globe-alt" class="text-lg" />
              Tên miền của bạn chưa được xác minh
            </button>
          </div>
          <div class="font-semibold mb-2">
            Danh sách kiểm tra
          </div>
          <div class="flex items-center justify-between mb-2 text-xs text-gray-500">
            <span>Đạt 10 đơn hàng đầu tiên</span>
            <span>0/5 đã hoàn thành</span>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
