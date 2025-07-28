<script setup lang="ts">
interface MenuItem {
  id: number
  name: string
  description: string
  url: string
}

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Danh sách menu - Đông Trùng Hạ Thảo Phú Nhân'
})

// Menu data structure
const menuItems: MenuItem[] = [
  {
    id: 1,
    name: 'Main menu',
    description: 'Trang chủ, Giới thiệu, Sản phẩm, Tin tức, Liên hệ',
    url: '/links/main-menu'
  },
  {
    id: 2,
    name: 'Footer',
    description: 'Tìm kiếm, Giới thiệu',
    url: '/links/footer'
  },
  {
    id: 3,
    name: 'Thông tin',
    description: 'Trang chủ, Giới thiệu, Sản phẩm',
    url: '/links/thong-tin'
  },
  {
    id: 4,
    name: 'Hỗ trợ',
    description: 'Tìm kiếm, Đăng nhập, Đăng ký 12222, Giỏ hàng',
    url: '/links/ho-tro'
  },
  {
    id: 5,
    name: 'Hướng dẫn',
    description: 'Hướng dẫn mua hàng, Hướng dẫn thanh toán, Hướng dẫn giao nhận, Điều khoản dịch vụ',
    url: '/links/huong-dan'
  },
  {
    id: 6,
    name: 'Chính sách',
    description: 'Chính sách bảo mật, Chính sách vận chuyển, Chính sách đổi trả, Quy định sử dụng',
    url: '/links/chinh-sach'
  }
]
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
      <div class="max-w-5xl mx-auto p-6">
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
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Tên menu
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Liên kết
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="item in menuItems" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                    <NuxtLink
                      :to="item.url"
                      class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                    >
                      {{ item.name }}
                    </NuxtLink>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
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
