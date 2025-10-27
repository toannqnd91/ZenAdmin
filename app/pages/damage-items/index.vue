<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import DamageItemsTable from '@/components/damage-items/DamageItemsTable.vue'
import { damageItemsService } from '@/services/damage-items.service'
import type { DamageItemsGridData } from '@/services/damage-items.service'
import WarehouseSwitcher from '@/components/WarehouseSwitcher.vue'
import type { WarehouseOption } from '@/components/WarehouseSwitcher.vue'
import { useGlobalWarehouse } from '@/composables/useWarehouse'

const router = useRouter()

function handleCreate() {
  router.push('/damage-items/create')
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
const selectedStatus = ref(null)
const selectedDatePreset = ref<{ value: string, label: string } | null>(null)
// Global header warehouse switcher (standardized across pages)
const { isNotificationsSlideoverOpen } = useDashboard()
const { selectedWarehouse: globalWarehouse, setWarehouse } = useGlobalWarehouse()
const selectedHeaderWarehouse = computed<WarehouseOption | null>({
  get() {
    const sw = globalWarehouse.value
    if (sw && sw.id !== null && sw.id !== undefined && String(sw.id).trim() !== '') {
      return { id: sw.id, name: sw.name }
    }
    // Allow "Tất cả" as clear state for this page
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

// Removed local warehouse filter – using global header WarehouseSwitcher

interface DamageItemRow {
  id: string
  code: string
  date: string
  warehouseName: string
  statusLabel: string
  approvedOn: string
  createdByName: string
}

const rows = ref<DamageItemRow[]>([])
const loading = ref(false)
const pagination = ref({ pageIndex: 0, pageSize: 20 })
const totalRecords = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalRecords.value / pagination.value.pageSize)))

function formatDate(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function mapStatusLabel(status: number | null | undefined) {
  switch (status) {
    case 0: return 'Đang giao dịch'
    case 1: return 'Hoàn thành'
    default: return ''
  }
}

async function fetchGrid(_reset = false) {
  loading.value = true
  try {
    const res = await damageItemsService.getGrid({
      pagination: {
        start: pagination.value.pageIndex * pagination.value.pageSize,
        number: pagination.value.pageSize,
        numberOfPages: 10
      },
      search: { Name: q.value || null },
      sort: { field: 'Id', reverse: true }
    })
    const data = res?.data as DamageItemsGridData | undefined
    const items = (data?.Items || []) as DamageItemsGridData['Items']
    totalRecords.value = data?.TotalRecord ?? 0
    rows.value = items.map(it => ({
      id: String(it.id ?? ''),
      code: `DMG${String(it.id ?? '').padStart(5, '0')}`,
      date: formatDate(it.createdOn || ''),
      warehouseName: it.warehouseName || '',
      statusLabel: mapStatusLabel(it.status ?? null),
      approvedOn: formatDate(it.approvedOn || ''),
      createdByName: it.createdById || ''
    }))
  } catch (e) {
    console.error('fetch damage items grid failed', e)
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
// Refetch when global warehouse changes (future: backend filter integration)
watch(() => globalWarehouse.value?.id, () => {
  pagination.value.pageIndex = 0
  fetchGrid()
})

function goToCode(code: string) {
  if (!code) return
  router.push(`/damage-items/${code}`)
}

function onTabChange(val: string) {
  activeTab.value = val as TabKey
}

function onUpdatePagination(val: { pageIndex: number, pageSize: number }) {
  pagination.value = val
}
</script>

<template>
  <UDashboardPanel id="damage-items">
    <template #header>
      <UDashboardNavbar title="Phiếu hủy hàng" :ui="{ right: 'gap-3' }">
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
            :include-all="true"
            :clearable="true"
            :borderless="true"
            :auto-width="true"
          />

          <!-- Divider before global controls -->
          <div class="h-5 w-px bg-gray-200 mx-2" />

          <!-- Always keep these two at the far right: color mode + notifications -->
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
      <DamageItemsTable
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
        @update:pagination="onUpdatePagination"
        @update:tab="onTabChange"
        @navigate-code="goToCode"
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
            <span>Tạo phiếu hủy</span>
          </button>
        </template>
        <template #filters-line>
          <div class="flex flex-wrap items-center w-full gap-4">
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
                placeholder="Tìm kiếm theo mã, kho, người tạo"
                class="h-9 w-full pl-9 pr-3 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-0 text-sm"
              >
            </div>
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
                <button type="button" class="h-full px-4 inline-flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 rounded-none">
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
              <button type="button" class="ml-4 h-9 px-4 inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-sm text-gray-700">
                Lưu bộ lọc
              </button>
            </div>
          </div>
        </template>
      </DamageItemsTable>
    </template>
  </UDashboardPanel>
</template>
