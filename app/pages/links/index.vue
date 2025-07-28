<script setup lang="ts">
import { linksService } from '@/services'
import type { LinkData } from '@/services'

definePageMeta({
  layout: 'default'
})

// Fetch menu data from API using service
const { data: menuResponse } = await useAsyncData('links', async () => {
  const response = await linksService.getLinks()
  return response
})

// Transform API data to display format
const menuItems = computed(() => {
  if (!menuResponse.value?.success || !menuResponse.value.data) return []
  
  return menuResponse.value.data.map((item: LinkData) => ({
    id: item.sortOrder,
    name: item.name,
    description: item.description.replace(/\r\n/g, '').trim(),
    url: `/links/${item.url}`
  }))
})
</script>

<template>
  <UDashboardPanel id="links">
    <template #header>
      <UDashboardNavbar title="Danh sách menu">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full">
        <!-- Combined Section: Header + Table in one bordered container -->
        <div class="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <!-- Header Section -->
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Danh sách menu
            </h1>
            <p class="text-gray-700 dark:text-gray-300 text-sm">
              Menu và liên kết giúp khách hàng điều hướng trên website của bạn dễ dàng hơn. Bạn có thể tùy chỉnh hiển thị các menu mới cho giao diện của mình thông qua
              <ULink to="/admin/theme" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">chỉnh sửa giao diện</ULink>
            </p>
          </div>

          <!-- Menu Table -->
          <div class="overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider" style="width: 25%">
                    Tên menu
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider" style="width: 75%">
                    Liên kết
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="!menuResponse || !menuItems.length" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td colspan="2" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <template v-if="!menuResponse">
                      Đang tải dữ liệu...
                    </template>
                    <template v-else>
                      Không có dữ liệu menu
                    </template>
                  </td>
                </tr>
                <tr v-for="item in menuItems" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium" style="width: 25%">
                    <NuxtLink
                      :to="item.url"
                      class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                    >
                      {{ item.name }}
                    </NuxtLink>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-800 dark:text-gray-200" style="width: 75%">
                    {{ item.description }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer Section -->
        <div class="mt-6 text-center">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            Tìm hiểu thêm về <ULink to="/admin/menu" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">menu</ULink>
          </span>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
/* Custom styles for better spacing and typography */
.grid {
  min-height: 60px;
}
</style>
