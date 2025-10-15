<script setup lang="ts">
import { useRoute } from '#imports'

const route = useRoute()
const currentTab = computed(() => String(route.query.tab || 'general'))

const links = [
  { label: 'Cấu hình chung', value: 'general', icon: 'i-lucide-store' },
  { label: 'Quản lý chi nhánh', value: 'branches', icon: 'i-lucide-map-pin' },
  { label: 'Xử lý đơn hàng', value: 'orders', icon: 'i-lucide-package' },
  { label: 'Phương thức thanh toán', value: 'payments', icon: 'i-lucide-credit-card' },
  { label: 'Trang thanh toán', value: 'checkout', icon: 'i-lucide-layout-list' },
  { label: 'Thuế', value: 'taxes', icon: 'i-lucide-percent' },
  { label: 'Đối tác vận chuyển', value: 'shipping-partners', icon: 'i-lucide-truck' },
  { label: 'Cấu hình vận chuyển', value: 'shipping', icon: 'i-lucide-settings' },
  { label: 'Quản lý nhân viên', value: 'members', icon: 'i-lucide-users' },
  { label: 'Kênh bán hàng', value: 'channels', icon: 'i-lucide-store' },
  { label: 'Thông báo', value: 'notifications', icon: 'i-lucide-bell' },
  { label: 'Quản lý file', value: 'files', icon: 'i-lucide-paperclip' },
  { label: 'Mẫu in', value: 'print-templates', icon: 'i-lucide-printer' },
  { label: 'Gói dịch vụ', value: 'plans', icon: 'i-lucide-badge-dollar-sign' },
  { label: 'Nhật ký hoạt động', value: 'audit-log', icon: 'i-lucide-history' },
  { label: 'Metafield', value: 'metafields', icon: 'i-lucide-table-properties' }
]
</script>

<template>
  <div class="space-y-1 p-2 rounded-xl bg-white border border-gray-200">
    <ul>
      <li v-for="item in links" :key="item.value">
        <NuxtLink
          :to="{ path: '/settings', query: { tab: item.value } }"
          :class="[
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-50',
            currentTab === item.value
              ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600'
              : 'text-gray-700'
          ]"
        >
          <UIcon :name="item.icon" class="w-4 h-4" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
