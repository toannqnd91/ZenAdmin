<script setup lang="ts">
import { sub } from 'date-fns'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Period, Range } from '~/types'

import { useAuthService } from '~/composables/useAuthService'

const { user } = useAuthService()

const { isNotificationsSlideoverOpen } = useDashboard()

const items = [[{
  label: 'New mail',
  icon: 'i-lucide-send',
  to: '/inbox'
}, {
  label: 'New customer',
  icon: 'i-lucide-user-plus',
  to: '/customers'
}]] satisfies DropdownMenuItem[][]

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})
const period = ref<Period>('daily')
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

      <UDashboardToolbar>
        <template #left>
          <!-- NOTE: The `-ms-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
          <HomeDateRangePicker v-model="range" class="-ms-1" />

          <HomePeriodSelect v-model="period" :range="range" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <!-- Welcome header -->
      <div class="space-y-6">
  <h2 class="text-2xl font-semibold mb-7">Welcome back, {{ user?.display_name || 'User' }} 🎉</h2>

        <!-- Overview Card -->
        <div class="bg-white rounded-md p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <div class="font-semibold text-lg">Overview</div>
            <div class="flex gap-2">
              <UButton size="xs" color="gray" variant="soft">This month</UButton>
              <UButton size="xs" color="gray" variant="soft">All Channels</UButton>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-md p-4 flex flex-col gap-1" style="border:1px dashed #e6e6e6;">
              <div class="text-xs text-gray-500">Total sales</div>
              <div class="flex items-center justify-between">
                <div class="text-xl font-bold">$42.280</div>
                <div class="text-xs font-medium text-green-600 flex items-center gap-1">
                  <UIcon name="i-heroicons-arrow-up-right" class="text-green-500" />
                  <span>15.20%</span>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-md p-4 flex flex-col gap-1" style="border:1px dashed #e6e6e6;">
              <div class="text-xs text-gray-500">Sale profit</div>
              <div class="flex items-center justify-between">
                <div class="text-xl font-bold">x3.175</div>
                <div class="text-xs font-medium text-green-600 flex items-center gap-1">
                  <UIcon name="i-heroicons-arrow-up-right" class="text-green-500" />
                  <span>11.30%</span>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-md p-4 flex flex-col gap-1" style="border:1px dashed #e6e6e6;">
              <div class="text-xs text-gray-500">Contributions</div>
              <div class="flex items-center justify-between">
                <div class="text-xl font-bold">6.879.145</div>
                <div class="text-xs font-medium text-green-600 flex items-center gap-1">
                  <UIcon name="i-heroicons-arrow-up-right" class="text-green-500" />
                  <span>12.05%</span>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-md p-4 flex flex-col gap-1" style="border:1px dashed #e6e6e6;">
              <div class="text-xs text-gray-500">Total Income</div>
              <div class="flex items-center justify-between">
                <div class="text-xl font-bold">$9.528</div>
                <div class="text-xs font-medium text-green-600 flex items-center gap-1">
                  <UIcon name="i-heroicons-arrow-up-right" class="text-green-500" />
                  <span>15.10%</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Chart placeholder -->
          <div class="h-56 bg-[rgba(27,100,242,0.08)] rounded-md flex items-center justify-center mb-2">
            <span class="text-gray-400">[Line Chart Placeholder]</span>
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
          <div class="font-semibold text-lg mb-4">Things to do next</div>
          <div class="mb-2 flex items-center gap-2 font-semibold">
            Action needed
            <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">4</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <button class="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg px-4 py-2 transition">
              <UIcon name="i-heroicons-heart" class="text-lg" />
              4 supporters left to thank!
            </button>
            <button class="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg px-4 py-2 transition">
              <UIcon name="i-heroicons-archive-box" class="text-lg" />
              30 orders need to be processed
            </button>
            <button class="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg px-4 py-2 transition">
              <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="text-lg" />
              10 new comments
            </button>
            <button class="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg px-4 py-2 transition">
              <UIcon name="i-heroicons-globe-alt" class="text-lg" />
              Your domain is not verified
            </button>
          </div>
          <div class="font-semibold mb-2">Checklist</div>
          <div class="flex items-center justify-between mb-2 text-xs text-gray-500">
            <span>Get your first 10 sales</span>
            <span>0/5 completed</span>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>