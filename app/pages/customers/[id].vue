<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()

// id is string per request
const customerId = computed(() => String(route.params.id || ''))

if (!customerId.value) {
  // If no id, go back to customers list
  router.replace('/customers')
}

function goBack() {
  router.push('/customers')
}
</script>

<template>
  <UDashboardPanel id="customer-detail" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <UDashboardSidebarCollapse />
            <div class="text-lg font-semibold">
              Khách hàng
            </div>
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
              @click="goBack"
            >
              Quay lại
            </button>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-screen-xl mx-auto px-6 py-6">
        <div class="mb-6">
          <h1 class="text-xl font-semibold">
            Chi tiết khách hàng
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            ID: <span class="font-mono">{{ customerId }}</span>
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left: General Info -->
          <div class="lg:col-span-2 space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <div class="px-6 py-4 border-b">
                <h2 class="text-base font-medium">
                  Thông tin chung
                </h2>
              </div>
              <div class="-mx-6 px-6 py-4">
                <p class="text-sm text-gray-500">
                  Sẽ hiển thị thông tin khách hàng sau khi tích hợp API.
                </p>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <div class="px-6 py-4 border-b">
                <h2 class="text-base font-medium">
                  Đơn hàng gần đây
                </h2>
              </div>
              <div class="-mx-6 px-6 py-4">
                <p class="text-sm text-gray-500">
                  Danh sách đơn hàng của khách hàng này sẽ hiển thị ở đây.
                </p>
              </div>
            </UPageCard>
          </div>

          <!-- Right: Notes/Actions -->
          <div class="space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <div class="px-6 py-4 border-b">
                <h2 class="text-base font-medium">
                  Ghi chú
                </h2>
              </div>
              <div class="-mx-6 px-6 py-4">
                <p class="text-sm text-gray-500">
                  Ghi chú liên quan đến khách hàng.
                </p>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <div class="px-6 py-4">
                <div class="flex gap-2">
                  <button class="h-9 px-3 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
                    Tạo đơn hàng
                  </button>
                  <button class="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50">
                    Chỉnh sửa
                  </button>
                </div>
              </div>
            </UPageCard>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
