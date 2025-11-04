<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCardHeader from '@/components/BaseCardHeader.vue'

const route = useRoute()
const router = useRouter()

const orderCode = computed(() => {
  const raw = (route.query.code as string | undefined) || ''
  return raw.replace(/^#/, '')
})

function goBack() {
  router.back()
}
</script>

<template>
  <UDashboardPanel id="return-create">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <button
              class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              @click="goBack"
            >
              <svg
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div>
              <div class="text-lg font-semibold">
                Tạo đơn trả hàng
              </div>
            </div>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-screen-xl mx-auto px-6">
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 py-4">
          <!-- Left column: select products to return -->
          <div class="space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Chọn sản phẩm trả hàng
              </BaseCardHeader>
              <div class="-mx-4 lg:-mx-6 px-4 lg:px-6 pb-2 text-sm text-gray-600">
                <div v-if="orderCode" class="text-gray-600">
                  {{ orderCode }}
                </div>
                <div v-else class="text-gray-400">
                  Nhập mã đơn hoặc chọn sản phẩm
                </div>
              </div>
              <div class="-mx-4 lg:-mx-6">
                <div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 text-sm text-gray-700 bg-gray-50 px-4 py-2 rounded-t-md">
                  <div class="font-medium">
                    Sản phẩm
                  </div>
                  <div class="font-medium">
                    Số lượng
                  </div>
                  <div class="font-medium">
                    Đơn giá
                  </div>
                  <div class="font-medium text-right">
                    Thành tiền
                  </div>
                </div>
                <!-- Empty state row -->
                <div class="px-4 py-6 text-sm text-gray-500">
                  Chưa có sản phẩm nào được chọn
                </div>
              </div>
            </UPageCard>

            <!-- Notes -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Ghi chú
              </BaseCardHeader>
              <div class="-mx-4 lg:-mx-6 px-4 lg:px-6 pb-4">
                <input
                  type="text"
                  placeholder="Nhập lý do hoàn trả hàng"
                  class="w-full h-11 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                <div class="text-xs text-gray-500 mt-2">
                  Chỉ có bạn và nhân viên trong cửa hàng có thể nhìn thấy lý do này
                </div>
              </div>
            </UPageCard>
          </div>

          <!-- Right column: sidebar -->
          <div class="space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Chi nhánh trả hàng
              </BaseCardHeader>
              <div class="-mx-4 lg:-mx-6 px-4 lg:px-6 py-4 space-y-4">
                <div>
                  <div class="relative">
                    <select class="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>
                        Cửa hàng chính
                      </option>
                    </select>
                    <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                      <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clip-rule="evenodd" />
                      </svg>
                    </span>
                  </div>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900 mb-1">
                    Mã đơn trả hàng
                  </div>
                  <input
                    type="text"
                    placeholder="Nhập mã đơn trả hàng"
                    class="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Tóm tắt
              </BaseCardHeader>
              <div class="-mx-4 lg:-mx-6 px-4 lg:px-6 py-4">
                <div class="text-sm text-gray-500">
                  Chưa có sản phẩm nào được chọn
                </div>
                <div class="pt-4">
                  <button type="button" disabled class="w-full h-10 rounded-md bg-gray-100 text-gray-400 font-medium cursor-not-allowed">
                    Tạo đơn trả hàng
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
