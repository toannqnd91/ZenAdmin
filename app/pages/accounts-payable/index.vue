<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ARTable from '@/components/ar/ARTable.vue'
import { arService } from '@/services'
import type { ARSummaryItem } from '@/services'
import { useGlobalWarehouse } from '@/composables/useWarehouse'

const { isNotificationsSlideoverOpen } = useDashboard()
const { selectedWarehouse } = useGlobalWarehouse()

const q = ref('')
const objectType = ref<'Customer' | 'Supplier'>('Customer')
const pagination = ref({ pageIndex: 0, pageSize: 20 })
const rowSelection = ref<Record<string, boolean>>({})
const loading = ref(false)

const data = ref<ARSummaryItem[]>([])
const summary = ref({
  totalReceivables: 0,
  totalPayables: 0,
  totalPeriodChange: 0
})
const period = ref({
  fromDate: '',
  toDate: ''
})
const totalPages = ref(1)
const totalCount = ref(0)

interface DatePresetItem extends Record<string, unknown> {
  value: string
  label: string
}
const selectedDatePreset = ref<DatePresetItem | null>(null)

interface ObjectTypeOption extends Record<string, unknown> {
  value: 'Customer' | 'Supplier'
  label: string
}
const selectedObjectType = ref<ObjectTypeOption>({ value: 'Customer', label: 'Khách hàng' })

async function fetchDatePresets(q: string): Promise<DatePresetItem[]> {
  const items: DatePresetItem[] = [
    { value: 'last30d', label: '30 ngày qua' },
    { value: 'last7d', label: '7 ngày qua' },
    { value: 'thisMonth', label: 'Tháng này' },
    { value: 'lastMonth', label: 'Tháng trước' },
    { value: 'thisYear', label: 'Năm nay' },
    { value: 'all', label: 'Toàn thời gian' }
  ]
  const qq = (q || '').toLowerCase()
  return qq ? items.filter(i => i.label?.toLowerCase().includes(qq)) : items
}

async function fetchObjectTypes(q: string): Promise<ObjectTypeOption[]> {
  const items: ObjectTypeOption[] = [
    { value: 'Customer', label: 'Khách hàng' },
    { value: 'Supplier', label: 'Nhà cung cấp' }
  ]
  const qq = (q || '').toLowerCase()
  return qq ? items.filter(i => i.label?.toLowerCase().includes(qq)) : items
}

const objectTypeOptions: ObjectTypeOption[] = [
  { value: 'Customer', label: 'Khách hàng' },
  { value: 'Supplier', label: 'Nhà cung cấp' }
]

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      objectType: selectedObjectType.value.value,
      page: pagination.value.pageIndex + 1,
      pageSize: pagination.value.pageSize
    }

    if (q.value) {
      params.search = q.value
    }

    if (selectedWarehouse.value?.id) {
      params.warehouseId = selectedWarehouse.value.id
    }

    const res = await arService.getSummary(params)


    if (res.success) {
      // API returns data at root level, not wrapped in res.data
      const responseData = res.data || res
      data.value = responseData.items || []
      summary.value = responseData.summary || { totalReceivables: 0, totalPayables: 0, totalPeriodChange: 0 }
      period.value = responseData.period || { fromDate: '', toDate: '' }
      totalPages.value = responseData.pagination?.totalPages || 1
      totalCount.value = responseData.pagination?.totalCount || 0
    }
  } catch (error) {
    console.error('Error fetching AR summary:', error)
  } finally {
    loading.value = false
  }
}

watch([q, selectedObjectType, () => pagination.value.pageIndex, () => pagination.value.pageSize, selectedDatePreset], () => {
  fetchData()
}, { immediate: true, deep: true })

const formatNumber = (value: number) => {
  if (value == null) return '0đ'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('vi-VN')
}

const dateRangeDisplay = computed(() => {
  if (!period.value.fromDate || !period.value.toDate) {
    const now = new Date()
    const from = new Date(now)
    from.setDate(from.getDate() - 29)
    return `30 ngày qua (${formatDate(from.toISOString())} - ${formatDate(now.toISOString())})`
  }
  const from = formatDate(period.value.fromDate)
  const to = formatDate(period.value.toDate)
  return `${selectedDatePreset.value?.label || '30 ngày qua'} (${from} - ${to})`
})

const totalReceivablesDisplay = computed(() => {
  return selectedObjectType.value.value === 'Customer' ? summary.value.totalReceivables : summary.value.totalPayables
})

const totalReceivablesLabel = computed(() => {
  return selectedObjectType.value.value === 'Customer' ? 'Tổng nợ khách hàng' : 'Tổng nợ nhà cung cấp'
})

</script>

<template>
  <UDashboardPanel id="cong-no">
    <template #header>
      <UDashboardNavbar title="Quản lý công nợ" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
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
      <div class="bg-white rounded-xl p-5">
        <div class="flex items-center gap-8">
          <!-- Main Balance Card -->
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div class="text-xs font-medium text-gray-500 mb-0.5">{{ totalReceivablesLabel }}</div>
              <div class="text-2xl font-bold text-gray-900">{{ formatNumber(totalReceivablesDisplay) }}</div>
            </div>
          </div>

          <!-- Divider -->
          <div class="h-16 w-px bg-gray-200"></div>

          <!-- Total Payables -->
          <div>
            <div class="text-xs font-medium text-gray-500 mb-0.5">Tổng nợ nhà cung cấp</div>
            <div class="text-2xl font-bold text-rose-600">{{ formatNumber(summary.totalPayables) }}</div>
          </div>

          <!-- Period Change (if exists) -->
          <template v-if="summary.totalPeriodChange !== 0">
            <div class="h-16 w-px bg-gray-200"></div>
            <div>
              <div class="text-xs font-medium text-gray-500 mb-0.5">Thay đổi trong kỳ</div>
              <div class="text-2xl font-bold"
                :class="summary.totalPeriodChange > 0 ? 'text-emerald-600' : 'text-rose-600'">
                {{ formatNumber(Math.abs(summary.totalPeriodChange)) }}
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3 items-center">
        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton color="neutral" variant="outline" trailing-icon="i-lucide-chevron-down"
            class="min-w-[320px] justify-between px-4 py-2.5 text-sm font-normal">
            <span class="text-gray-900 dark:text-white">{{ dateRangeDisplay }}</span>
          </UButton>
          <template #panel="{ close }">
            <div class="p-2 w-[200px]">
              <div v-for="preset in [
                { value: 'last30d', label: '30 ngày qua' },
                { value: 'last7d', label: '7 ngày qua' },
                { value: 'thisMonth', label: 'Tháng này' },
                { value: 'lastMonth', label: 'Tháng trước' },
                { value: 'thisYear', label: 'Năm nay' },
                { value: 'all', label: 'Toàn thời gian' }
              ]" :key="preset.value"
                class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded text-sm"
                @click="selectedDatePreset = preset; close()">
                {{ preset.label }}
              </div>
            </div>
          </template>
        </UPopover>

        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton color="neutral" variant="outline" trailing-icon="i-lucide-chevron-down"
            class="min-w-[180px] justify-between px-4 py-2.5 text-sm font-normal">
            <span class="text-gray-900 dark:text-white">{{ selectedObjectType.label }}</span>
          </UButton>
          <template #panel="{ close }">
            <div class="p-2 w-[180px]">
              <div v-for="type in objectTypeOptions" :key="type.value"
                class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded text-sm"
                @click="selectedObjectType = type; close()">
                {{ type.label }}
              </div>
            </div>
          </template>
        </UPopover>
      </div>

      <!-- AR Table -->
      <ARTable v-model:q="q" v-model:row-selection="rowSelection" v-model:pagination="pagination" :data="data"
        :loading="loading" :total-pages="totalPages" :total-records="totalCount" />
    </template>
  </UDashboardPanel>
</template>
