<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import PurchaseOrderTable from '@/components/purchase-order/PurchaseOrderTable.vue'
import { purchaseOrderService } from '@/services/purchase-order.service'

const router = useRouter()

function handleCreateOrder() {
  router.push('/purchase-order/create')
}

type TabKey = 'all' | 'processing' | 'completed'
const activeTab = ref<TabKey>('all')

interface TabDef {
  label: string
  value: TabKey
}

const tabCounts = computed<TabDef[]>(() => [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang giao dịch', value: 'processing' },
  { label: 'Hoàn thành', value: 'completed' }
])

const q = ref('')
const selectedSupplier = ref(null)
const selectedStatus = ref(null)

const selectedDatePreset = ref<{ value: string, label: string } | null>(null)

async function fetchDatePresets(qs: string) {
  const items = [
    { value: 'all', label: 'Toàn thời gian' },
    { value: 'today', label: 'Hôm nay' },
    { value: 'last7d', label: '7 ngày qua' },
    { value: 'last30d', label: '30 ngày qua' }
  ]
  const qq = (qs || '').toLowerCase()
  return qq ? items.filter(i => i.label.toLowerCase().includes(qq)) : items
}

async function fetchStatuses(qs: string) {
  const items = [
    { code: 'all', name: 'Tất cả' },
    { code: 'processing', name: 'Đang giao dịch' },
    { code: 'completed', name: 'Hoàn thành' }
  ]
  const qq = (qs || '').toLowerCase()
  return qq ? items.filter(i => i.name.toLowerCase().includes(qq) || i.code.includes(qq)) : items
}

async function fetchSuppliers(q: string) {
  const items = [
    { id: 1, name: 'Nhà cung cấp A' },
    { id: 2, name: 'Nhà cung cấp B' }
  ]
  const qq = q.toLowerCase()
  return qq ? items.filter(i => i.name.toLowerCase().includes(qq)) : items
}

interface PurchaseOrderRow {
  id: string
  code: string
  date: string
  branchName: string
  statusLabel: string
  receiveStatus: string
  supplierName: string
  createdByName: string
  totalQuantity: number
  total: number
}

const rows = ref<PurchaseOrderRow[]>([])

const loading = ref(false)

const pagination = ref({ pageIndex: 0, pageSize: 20 })
const totalRecords = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalRecords.value / pagination.value.pageSize)))

// removed: mapStatusText (statusLabel now comes from API)

function formatDate(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function fetchGrid(_reset = false) {
  loading.value = true
  try {
    const res = await purchaseOrderService.getGrid({
      pagination: {
        start: pagination.value.pageIndex * pagination.value.pageSize,
        number: pagination.value.pageSize,
        numberOfPages: 10
      },
      search: { name: q.value || null },
      sort: { field: 'Id', reverse: true }
    })
    const data = res?.data
    const items = (data?.items || []) as Array<{
      code?: string
      id?: string | number
      createdOn?: string
      branchName?: string
      warehouseName?: string
      statusLabel?: string
      receiveStatus?: string
      supplierName?: string
      createdByName?: string
      totalQuantity?: number
      total?: number
    }>
    totalRecords.value = data?.totalRecord || 0
    rows.value = items.map(it => ({
      id: String(it.code || it.id || ''),
      code: String(it.code || it.id || ''),
      date: formatDate(it.createdOn || ''),
      branchName: it.branchName || it.warehouseName || 'Cửa hàng chính',
      statusLabel: it.statusLabel || '',
      receiveStatus: it.receiveStatus || '',
      supplierName: it.supplierName || '',
      createdByName: it.createdByName || '',
      totalQuantity: Number(it.totalQuantity || 0),
      total: Number(it.total || 0)
    }))
  } catch (e) {
    console.error('fetch purchase orders grid failed', e)
    rows.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchGrid(true)
})
watch([q, () => pagination.value.pageIndex, () => pagination.value.pageSize], () => fetchGrid())

function goToOrder(code: string) {
  if (!code) return
  router.push(`/purchase-order/${code}`)
}

function onTabChange(val: string) {
  activeTab.value = val as TabKey
}
</script>

<template>
  <UDashboardPanel id="purchase-order">
    <template #header>
      <UDashboardNavbar title="Danh sách đơn nhập hàng">
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
              label="Nhà cung cấp"
              color="neutral"
              variant="soft"
              size="sm"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <!-- Table: use same layout as /cash-flow so tabs and add-button align -->
      <PurchaseOrderTable
        :data="rows"
        :loading="loading"
        :q="q"
        :row-selection="{}"
        :pagination="pagination"
        :tabs="tabCounts"
        :total-records="totalRecords"
        :total-pages="totalPages"

        body-padding="px-6"
        header-padding-x="px-6"
        footer-padding="px-6 pb-4"
        @update:q="val => q = val"
        @update:row-selection="() => {}"
        @update:pagination="() => {}"
        @update:tab="onTabChange"
        @navigate-code="goToOrder"
      >
        <template #tabs-line-actions>
          <button
            type="button"
            class="h-9 px-6 min-w-[158px] inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm shadow-sm"
            @click="handleCreateOrder"
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
            <span>Tạo đơn nhập hàng</span>
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
                placeholder="Tìm kiếm theo mã đơn nhập, tên, SĐT, mã NCC"
                class="h-9 w-full pl-9 pr-3 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-0 text-sm"
              >
            </div>

            <!-- Compact filter pills on the right -->
            <div class="ml-auto flex items-center">
              <div class="flex items-stretch h-9 rounded-md border border-gray-300 bg-white group">
                <RemoteSearchSelect
                  v-model="selectedStatus"
                  :fetch-fn="fetchStatuses"
                  placeholder="Trạng thái nhập"
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
                <RemoteSearchSelect
                  v-model="selectedSupplier"
                  :fetch-fn="fetchSuppliers"
                  placeholder="Nhà cung cấp"
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
      </PurchaseOrderTable>
    </template>
  </UDashboardPanel>
</template>
