<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onNuxtReady } from '#app'
import { useRouter } from 'vue-router'

import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import WarehouseSwitcher from '@/components/WarehouseSwitcher.vue'
import type { WarehouseOption } from '@/components/WarehouseSwitcher.vue'
import { useGlobalWarehouse } from '@/composables/useWarehouse'
import { useApiConfig } from '@/composables/useApiConfig'
import { useApiFetch } from '@/composables/useApiFetch'
import type { ApiResponse } from '@/types/common'

const router = useRouter()

function handleCreate() {
  router.push('/stock-takes/create')
}

type TabKey = 'all' | 'processing' | 'completed'
const activeTab = ref<TabKey>('all')

interface TabDef {
  label: string
  value: TabKey
}
const tabCounts = computed<TabDef[]>(() => [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang xử lý', value: 'processing' },
  { label: 'Hoàn thành', value: 'completed' }
])

const q = ref('')
interface StatusOption { code: string, name: string }
interface DatePreset { value: string, label: string }
type GenericItem = Record<string, unknown>

const selectedStatus = ref<StatusOption | null>(null)
const selectedDatePreset = ref<DatePreset | null>(null)

async function fetchDatePresets(qs: string): Promise<GenericItem[]> {
  const items: DatePreset[] = [
    { value: 'all', label: 'Toàn thời gian' },
    { value: 'today', label: 'Hôm nay' },
    { value: 'last7d', label: '7 ngày qua' },
    { value: 'last30d', label: '30 ngày qua' }
  ]
  const qq = (qs || '').toLowerCase()
  return (qq ? items.filter(i => i.label.toLowerCase().includes(qq)) : items) as unknown as GenericItem[]
}

async function fetchStatuses(qs: string): Promise<GenericItem[]> {
  const items: StatusOption[] = [
    { code: 'all', name: 'Tất cả' },
    { code: 'processing', name: 'Đang xử lý' },
    { code: 'completed', name: 'Hoàn thành' }
  ]
  const qq = (qs || '').toLowerCase()
  return (qq ? items.filter(i => i.name.toLowerCase().includes(qq) || i.code.includes(qq)) : items) as unknown as GenericItem[]
}

// Header warehouse switcher is global. Local warehouse select removed in filters.

interface RowItem {
  id: string
  code: string
  createdOn: string
  balancedOn: string
  actualQuantity: number
  actualValue: number
  differenceTotal: number
  increaseCount: number
  decreaseCount: number
  note: string
  status: string
}

const rows = ref<RowItem[]>([])
const loading = ref(false)
const rowSelection = ref<Record<string, boolean>>({})

const pagination = ref({ pageIndex: 0, pageSize: 20 })
const totalRecords = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalRecords.value / pagination.value.pageSize)))

// Columns for BaseTable to match screenshot
interface LocalColumn { key: string, label: string, sortable?: boolean, align?: 'left' | 'center' | 'right' }
const columns: LocalColumn[] = [
  { key: 'code', label: 'Mã kiểm kho', sortable: true },
  { key: 'balancedOn', label: 'Ngày cân bằng', sortable: true, align: 'left' },
  { key: 'actualQuantity', label: 'SL thực tế', sortable: true, align: 'center' },
  { key: 'actualValue', label: 'Tổng thực tế', sortable: true, align: 'center' },
  { key: 'differenceTotal', label: 'Tổng chênh lệch', sortable: true, align: 'center' },
  { key: 'increaseCount', label: 'SL lệch tăng', sortable: true, align: 'center' },
  { key: 'decreaseCount', label: 'SL lệch giảm', sortable: true, align: 'center' },
  { key: 'note', label: 'Ghi chú', sortable: false, align: 'left' },
  { key: 'status', label: 'Trạng thái', sortable: true, align: 'right' }
]
const colWidths = [
  '120px', // code (show code + time)
  '120px', // balancedOn
  '100px', // actualQuantity
  '120px', // actualValue
  '120px', // differenceTotal
  '100px', // increaseCount
  '100px', // decreaseCount
  '', // note
  '100px' // status
]

function mapStatusText(s: string | number | null | undefined): string {
  // InventoryStocktakeStatus: Draft=0, Balanced=1, Canceled=2
  const str = (s ?? '').toString()
  const num = typeof s === 'number' ? s : Number.isNaN(Number(str)) ? null : Number(str)
  if (num === 0 || str === 'Draft') return 'Nháp'
  if (num === 1 || str === 'Balanced') return 'Đã cân bằng'
  if (num === 2 || str === 'Canceled' || str === 'Cancelled') return 'Đã huỷ'
  return str
}

function statusBadgeClass(label: string) {
  switch (label) {
    case 'Nháp':
      return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'Đã cân bằng':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Đã huỷ':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatMoney(v: number | string) {
  if (v == null || v === '') return ''
  const num = typeof v === 'string' ? Number(v) : v
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(num)
}

function updatePagination(val: { pageIndex: number, pageSize: number }) {
  pagination.value = val
}

// Call backend API to load grid
interface StocktakeItem {
  id: number
  code: string
  createdOn: string
  balancedOn: string | null
  actualQuantity: number
  actualValue: number
  differenceTotal: number
  increaseCount: number
  decreaseCount: number
  note: string | null
  status: string
}

interface GridData {
  items: StocktakeItem[]
  totalRecord: number
  numberOfPages: number
}

const { getEndpoint } = useApiConfig()

// Bind header WarehouseSwitcher to global warehouse selection (cookie-based filtering on API)
const { selectedWarehouse: globalWarehouse, setWarehouse } = useGlobalWarehouse()
const selectedHeaderWarehouse = computed<WarehouseOption | null>({
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

// Standardized notifications slideover state from dashboard store
const { isNotificationsSlideoverOpen } = useDashboard()

async function fetchGrid(_reset = false) {
  loading.value = true
  try {
    const body = {
      Pagination: {
        Start: pagination.value.pageIndex * pagination.value.pageSize,
        TotalItemCount: 0,
        Number: pagination.value.pageSize
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

    const { data: resData, error } = await useApiFetch<ApiResponse<GridData>>(getEndpoint('/InventoryStocktakes/grid'), {
      method: 'POST',
      body,
      // Ensure a fresh request on client and avoid any stale cached entry
      key: `stocktakes-grid-${pagination.value.pageIndex}-${pagination.value.pageSize}-${q.value}-${Date.now()}`
    })

    if (error?.value) throw error.value
    const res = (resData.value as unknown) as ApiResponse<GridData> | null
    if (!res || !res.success) throw new Error((res && res.message) || 'Unknown error')

    totalRecords.value = res.data?.totalRecord || 0
    const items = (res.data?.items || []) as StocktakeItem[]
    rows.value = items.map((it: StocktakeItem) => ({
      id: String(it.id),
      code: it.code || String(it.id),
      createdOn: formatDate(it.createdOn),
      balancedOn: formatDate(it.balancedOn),
      actualQuantity: it.actualQuantity,
      actualValue: it.actualValue,
      differenceTotal: it.differenceTotal,
      increaseCount: it.increaseCount,
      decreaseCount: it.decreaseCount,
      note: it.note || '',
      status: mapStatusText(it.status)
    }))
  } catch (e) {
    console.error('fetch stock takes grid failed', e)
    rows.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

// Refetch when the app is fully ready on client (after plugins/cookies are hydrated)
onMounted(() => {
  fetchGrid(true)
})
onNuxtReady(() => {
  if (!rows.value.length) fetchGrid(true)
})
// Watch auth cookie to refetch when it becomes available (e.g., after reload)
const accessTokenCookie = useCookie<string | null>('access_token')
watch(accessTokenCookie, (val) => {
  if (val && (!rows.value.length || totalRecords.value === 0) && !loading.value) {
    fetchGrid(true)
  }
})
watch([q, () => pagination.value.pageIndex, () => pagination.value.pageSize, selectedStatus, selectedDatePreset], () => fetchGrid())
// Refetch when global warehouse changes
watch(() => globalWarehouse.value?.id, () => {
  pagination.value.pageIndex = 0
  fetchGrid()
})

function goToDetail(code: string) {
  if (!code) return
  router.push(`/stock-takes/${code}`)
}

function onTabChange(val: string) {
  activeTab.value = val as TabKey
}
</script>

<template>
  <UDashboardPanel id="stock-takes">
    <template #header>
      <UDashboardNavbar title="Phiếu kiểm kho" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            label="Xuất file"
            color="neutral"
            variant="soft"
            size="sm"
          />
          <WarehouseSwitcher
            v-model="selectedHeaderWarehouse"
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
      <BaseTable
        :data="(rows as unknown as Record<string, unknown>[])"
        :loading="loading"
        :q="q"
        :row-selection="rowSelection"
        :pagination="pagination"
        :columns="columns"
        :col-widths="colWidths"
        title="Phiếu kiểm kho"
        hide-title
        :tabs="tabCounts"
        tabs-style="underline"
        tabs-separate-line
        :total-records="totalRecords"
        :total-pages="totalPages"
        :show-row-actions="false"
        :show-filter="false"
        :selectable="true"
        body-padding="px-6"
        header-padding-x="px-6"
        footer-padding="px-6 pb-4"
        hide-search
        @update:q="val => (q = val)"
        @update:row-selection="val => (rowSelection = { ...val })"
        @update:pagination="updatePagination"
        @update:tab="onTabChange"
      >
        <template #tabs-line-actions>
          <button
            type="button"
            class="h-9 px-6 min-w-[158px] inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm shadow-sm"
            @click="handleCreate"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            <span>Kiểm kho</span>
          </button>
        </template>
        <template #filters-line>
          <div class="flex flex-wrap items-center w-full gap-4">
            <!-- Large search input on the left -->
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
                placeholder="Tìm kiếm theo mã phiếu, tên kho, người tạo"
                class="h-9 w-full pl-9 pr-3 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-0 text-sm"
              >
            </div>

            <!-- Compact filter pills on the right -->
            <div class="ml-auto flex items-center">
              <div class="flex items-stretch h-9 rounded-md border border-gray-300 bg-white group">
                <RemoteSearchSelect
                  v-model="selectedStatus"
                  :fetch-fn="fetchStatuses"
                  placeholder="Trạng thái"
                  label-field="name"
                  borderless
                  :trigger-class="'h-9 rounded-none border-r border-gray-200 min-w-[140px] px-3 flex-1'"
                  clearable
                />
                <RemoteSearchSelect
                  v-model="selectedDatePreset"
                  :fetch-fn="fetchDatePresets"
                  placeholder="Ngày tạo"
                  label-field="label"
                  borderless
                  :trigger-class="'h-9 rounded-none border-r border-gray-200 min-w-[120px] px-3 flex-1'"
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

        <!-- Column overrides -->
        <template #column-code="{ value, item }">
          <div class="flex flex-col">
            <button
              class="p-0 bg-transparent border-0 text-left text-primary-600 font-medium hover:underline text-sm focus:outline-none"
              type="button"
              @click="goToDetail((item as any).code as string)"
            >
              {{ value }}
            </button>
            <span class="text-xs text-gray-500 mt-0.5">{{ (item as any).createdOn }}</span>
          </div>
        </template>
        <template #column-actualValue="{ value }">
          <span class="tabular-nums font-semibold">{{ formatMoney(value as number | string) }}</span>
        </template>
        <template #column-differenceTotal="{ value }">
          <span class="tabular-nums">{{ formatMoney(value as number | string) }}</span>
        </template>
        <template #column-status="{ value }">
          <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', statusBadgeClass(value as string)]">
            {{ value }}
          </span>
        </template>
      </BaseTable>
    </template>
  </UDashboardPanel>
</template>
