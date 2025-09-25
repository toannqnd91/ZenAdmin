<script setup lang="ts">
import { sub } from 'date-fns'
import type { DropdownMenuItem } from '@nuxt/ui'
import { onMounted, ref, shallowRef, watch } from 'vue'
// removed Period/Range type imports because they are not exported from ~/types in this workspace

import { useAuthService } from '~/composables/useAuthService'
import TrialBanner from '@/components/home/TrialBanner.vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import { orderSourceService } from '@/services/order-source.service'
import type { OrderSourceItem } from '@/services/order-source.service'

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

const range = shallowRef({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})
const period = ref('daily')

// Dynamic order source selection (mirrors pattern in /orders/create)
// Model holds the selected source object { id, name, code, ... } or null
const selectedOrderSource = ref<OrderSourceItem | { id: null, name: string, code: string } | null>({ id: null, name: 'Tất cả nguồn', code: 'ALL' })

async function fetchOrderSources(search: string) {
  try {
    const res = await orderSourceService.getOrderSources()
    const list: OrderSourceItem[] = Array.isArray(res?.data) ? res.data : []
    const q = (search || '').toLowerCase()
    const filtered = q
      ? list.filter(s => s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q))
      : list
    // Include a synthetic "Tất cả nguồn" option (value null) at top for resetting filter
    return [
      { id: null, name: 'Tất cả nguồn', code: 'ALL' },
      ...filtered
    ]
  } catch {
    return []
  }
}

// No auto-POS selection; keep default 'All'
onMounted(async () => {
  try {
    await orderSourceService.getOrderSources()
  } catch {
    /* ignore */
  }
})

// Placeholder watcher: integrate filtering logic for dashboard stats when backend supports it
watch(selectedOrderSource, (val) => {
  // TODO: trigger dashboard data refresh with selected source filter
  // Example: refreshOverview({ sourceId: val?.id ?? null })
  // For now this is a no-op.
  void val
})
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Tổng quan" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
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
        <TrialBanner :days-left="5" class="mb-6" />

        <!-- Overview Card -->
        <div class="bg-white rounded-md p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <div class="font-semibold text-lg">
              Tổng quan
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <div class="flex items-center gap-2">
                <!-- <HomeDateRangePicker v-model="range" class="min-w-[240px]" /> -->
                <HomePeriodSelect v-model="period" :range="range" />
                <div class="min-w-[160px]">
                  <div class="relative">
                    <RemoteSearchSelect
                      v-model="selectedOrderSource"
                      :fetch-fn="fetchOrderSources"
                      placeholder="Nguồn đơn"
                      label-field="name"
                      :clearable="true"
                      :searchable="true"
                      :debounce="250"
                      :dropdown-max-height="300"
                      class="text-[12px]"
                      :input-classes="'h-8 px-3 rounded-md bg-[var(--ui-bg-elevated)] border-0 ring-0 focus:ring-0 focus:outline-none transition text-gray-700 placeholder:text-gray-400'"
                      :dropdown-classes="'mt-1 shadow-sm rounded-md bg-white'"
                    />
                  </div>
                </div>
              </div>
              <div class="flex gap-2">
                <UButton size="xs" color="neutral" variant="soft">
                  Tháng này
                </UButton>
                <UButton size="xs" color="neutral" variant="soft">
                  Tất cả kênh
                </UButton>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-md p-4 flex flex-col gap-1" style="border:1px dashed #e6e6e6;">
              <div class="text-xs text-gray-500">
                Tổng doanh thu
              </div>
              <div class="flex items-center justify-between">
                <div class="text-xl font-bold">
                  42.280 đ
                </div>
                <div class="text-xs font-medium text-green-600 flex items-center gap-1">
                  <UIcon name="i-heroicons-arrow-up-right" class="text-green-500" />
                  <span>15.20%</span>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-md p-4 flex flex-col gap-1" style="border:1px dashed #e6e6e6;">
              <div class="text-xs text-gray-500">
                Lợi nhuận bán hàng
              </div>
              <div class="flex items-center justify-between">
                <div class="text-xl font-bold">
                  x3.175
                </div>
                <div class="text-xs font-medium text-green-600 flex items-center gap-1">
                  <UIcon name="i-heroicons-arrow-up-right" class="text-green-500" />
                  <span>11.30%</span>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-md p-4 flex flex-col gap-1" style="border:1px dashed #e6e6e6;">
              <div class="text-xs text-gray-500">
                Đóng góp
              </div>
              <div class="flex items-center justify-between">
                <div class="text-xl font-bold">
                  6.879.145
                </div>
                <div class="text-xs font-medium text-green-600 flex items-center gap-1">
                  <UIcon name="i-heroicons-arrow-up-right" class="text-green-500" />
                  <span>12.05%</span>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-md p-4 flex flex-col gap-1" style="border:1px dashed #e6e6e6;">
              <div class="text-xs text-gray-500">
                Tổng thu nhập
              </div>
              <div class="flex items-center justify-between">
                <div class="text-xl font-bold">
                  9.528 đ
                </div>
                <div class="text-xs font-medium text-green-600 flex items-center gap-1">
                  <UIcon name="i-heroicons-arrow-up-right" class="text-green-500" />
                  <span>15.10%</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Chart placeholder -->
          <div class="h-56 bg-[rgba(27,100,242,0.08)] rounded-md flex items-center justify-center mb-2">
            <span class="text-gray-400">[Biểu đồ đường]</span>
          </div>
          <div class="flex justify-between text-xs text-gray-500 mt-2">
            <div>
              <span class="font-semibold text-blue-600">■</span> Apr 01 - Apr 07, 2024
              <span class="ml-4 text-blue-300">───</span> Mar 01 - Mar 07, 2024
            </div>
          </div>
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
