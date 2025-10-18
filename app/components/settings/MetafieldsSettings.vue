<script setup lang="ts">
const rows = [
  { name: 'Sản phẩm', icon: 'i-lucide-cube', count: 0 },
  { name: 'Phiên bản sản phẩm', icon: 'i-lucide-lock', count: 0 },
  { name: 'Đơn hàng', icon: 'i-lucide-file-text', count: 0 },
  { name: 'Khách hàng', icon: 'i-lucide-user', count: 0 }
]
</script>

<template>
  <div class="space-y-4">
    <UPageCard title="Danh sách định nghĩa" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-700 mb-3">
          Thêm các dữ liệu giúp bạn tuỳ chỉnh chức năng và giao diện của cửa hàng
        </div>
        <div class="rounded-md border border-gray-200 overflow-hidden">
          <div class="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700 grid grid-cols-[1fr_auto]">
            <div>
              Thông tin
            </div>
            <div>
              Định nghĩa
            </div>
          </div>
          <div class="border-t border-gray-200" />
          <div
            v-for="r in rows"
            :key="r.name"
            class="px-4 py-3 grid grid-cols-[1fr_auto] items-center gap-3"
          >
            <div class="flex items-center gap-3">
              <span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 text-gray-600">
                <UIcon :name="r.icon" />
              </span>
              <span class="text-gray-900">
                {{ r.name }}
              </span>
            </div>
            <div class="text-gray-900 font-medium">
              {{ r.count }}
            </div>
          </div>
        </div>
      </div>
    </UPageCard>
    <div class="text-center text-sm text-gray-600">
      Tìm hiểu thêm về
      <NuxtLink to="#" class="text-primary-600">
        định nghĩa metafield
      </NuxtLink>
    </div>
  </div>
</template>
