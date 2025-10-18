<script setup lang="ts">
const sections = [
  {
    title: 'Vận chuyển',
    items: [
      { label: 'Phiếu giao hàng', desc: 'Mẫu nội dung khi in phiếu giao hàng' },
      { label: 'Phiếu bàn giao vận đơn', desc: 'Mẫu nội dung phiếu bàn giao vận đơn' }
    ]
  },
  {
    title: 'Đơn hàng',
    items: [
      { label: 'In đơn hàng', desc: 'Mẫu nội dung khi in đơn hàng' },
      { label: 'In đơn hàng POS', desc: 'Mẫu nội dung đơn hàng trên kênh Pos' }
    ]
  },
  {
    title: 'Quản lý kho',
    items: [
      { label: 'In đơn đặt hàng nhập', desc: 'Mẫu nội dung khi in đơn đặt hàng nhập' },
      { label: 'In đơn nhập hàng', desc: 'Mẫu nội dung khi in đơn nhập hàng' },
      { label: 'In phiếu chuyển kho', desc: 'Mẫu nội dung khi in phiếu chuyển kho' }
    ]
  },
  {
    title: 'Phiếu thu',
    items: [
      { label: 'In phiếu thu', desc: 'Mẫu nội dung khi in phiếu thu' }
    ]
  },
  {
    title: 'Phiếu chi',
    items: [
      { label: 'In phiếu chi', desc: 'Mẫu nội dung khi in phiếu chi' }
    ]
  }
]
</script>

<template>
  <div class="space-y-4">
    <!-- Top banner -->
    <div class="rounded-md bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
      <div class="font-medium">
        Ứng dụng cấu hình mẫu in giúp bạn dễ dàng tuỳ chỉnh & thiết lập bố cục mẫu in
      </div>
      <UButton
        color="success"
        variant="solid"
        label="Khám phá ngay"
        class="text-sm"
      />
    </div>

    <!-- Sections -->
    <UPageCard
      v-for="section in sections"
      :key="section.title"
      :title="section.title"
      variant="soft"
      class="bg-white rounded-lg"
    >
      <div class="-mx-6 px-6 pt-1 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="divide-y divide-gray-200">
          <div
            v-for="item in section.items"
            :key="item.label"
            class="flex items-center justify-between gap-3 py-3"
          >
            <NuxtLink to="#" class="text-primary-600 hover:underline">
              {{ item.label }}
            </NuxtLink>
            <div class="text-sm text-gray-600">
              {{ item.desc }}
            </div>
          </div>
        </div>
      </div>
    </UPageCard>
  </div>
</template>
