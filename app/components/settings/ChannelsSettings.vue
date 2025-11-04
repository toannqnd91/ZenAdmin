<script setup lang="ts">
const channels = [
  {
    name: 'Kênh Website - Bán hàng trên Website',
    desc: 'Tăng trưởng doanh thu online với website chuyên nghiệp',
    icon: 'i-lucide-globe',
    color: 'bg-emerald-500',
    link: true
  },
  {
    name: 'Kênh POS - Bán tại cửa hàng',
    desc: 'Bán và vận hành cửa hàng chuyên nghiệp',
    icon: 'i-lucide-store',
    color: 'bg-sky-500',
    link: true
  },
  {
    name: 'Kênh Facebook - Bán hàng trên mạng xã hội Facebook',
    desc: 'Tối ưu bán hàng và quản lý trên Facebook',
    icon: 'i-logos-facebook',
    color: 'bg-blue-600'
  },
  {
    name: 'Kênh Shopee - Bán hàng trên sàn Shopee',
    desc: 'Quản lý và tăng trưởng toàn diện trên Shopee',
    icon: 'i-logos-shopee',
    color: 'bg-orange-500'
  },
  {
    name: 'Kênh TikTok Shop - Bán hàng trên sàn TikTok Shop',
    desc: 'Quản lý và tăng trưởng toàn diện trên Tiktok Shop',
    icon: 'i-logos-tiktok-icon',
    color: 'bg-black'
  },
  {
    name: 'Kênh Lazada - Bán hàng trên sàn Lazada',
    desc: 'Quản lý và tăng trưởng toàn diện trên Lazada',
    icon: 'i-lucide-shopping-bag',
    color: 'bg-indigo-600'
  },
  {
    name: 'Kênh Tiki - Bán hàng trên sàn Tiki',
    desc: 'Quản lý và tăng trưởng toàn diện trên Tiki',
    icon: 'i-lucide-shopping-bag',
    color: 'bg-cyan-600'
  },
  {
    name: 'Kênh Google Shopping - Bán hàng trên Google',
    desc: 'Tiếp cận hàng triệu khách hàng mua sắm online trên Google',
    icon: 'i-logos-google',
    color: 'bg-amber-500'
  }
]
</script>

<template>
  <div class="space-y-4">
    <UPageCard title="Kênh bán hàng" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-1 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="divide-y divide-gray-200">
          <div
            v-for="ch in channels"
            :key="ch.name"
            class="flex items-center justify-between gap-3 py-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="h-10 w-10 rounded-md flex items-center justify-center text-white" :class="ch.color">
                <UIcon :name="ch.icon" class="text-lg" />
              </div>
              <div class="min-w-0">
                <div class="font-medium truncate">
                  {{ ch.name }}
                </div>
                <div class="text-sm text-gray-600 truncate">
                  {{ ch.desc }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                v-if="!ch.link"
                color="primary"
                variant="solid"
                label="Cài đặt kênh"
                class="text-sm"
              />
              <UIcon
                v-if="ch.link"
                name="i-lucide-link-2"
                class="text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>
    </UPageCard>
  </div>
</template>
