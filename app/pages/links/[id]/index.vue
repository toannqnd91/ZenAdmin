<script setup lang="ts">
const route = useRoute()
const menuId = route.params.id as string

definePageMeta({
  layout: 'default'
})

// Menu configurations
const menuConfigs = {
  'main-menu': {
    title: 'Main menu',
    description: 'Quản lý các liên kết trong menu chính của website. Menu này sẽ hiển thị ở header và là navigation chính cho khách hàng.',
    links: [
      { id: 1, name: 'Trang chủ', url: '/', description: 'Trang chủ của website' },
      { id: 2, name: 'Giới thiệu', url: '/gioi-thieu', description: 'Thông tin về công ty' },
      { id: 3, name: 'Sản phẩm', url: '/san-pham', description: 'Danh sách sản phẩm' },
      { id: 4, name: 'Tin tức', url: '/tin-tuc', description: 'Tin tức và bài viết' },
      { id: 5, name: 'Liên hệ', url: '/lien-he', description: 'Thông tin liên hệ' }
    ]
  },
  'footer': {
    title: 'Footer',
    description: 'Quản lý các liên kết trong footer của website. Những liên kết này sẽ hiển thị ở cuối mỗi trang.',
    links: [
      { id: 1, name: 'Tìm kiếm', url: '/tim-kiem', description: 'Chức năng tìm kiếm sản phẩm' },
      { id: 2, name: 'Giới thiệu', url: '/gioi-thieu', description: 'Thông tin về công ty (footer)' }
    ]
  },
  'thong-tin': {
    title: 'Thông tin',
    description: 'Quản lý các liên kết thông tin quan trọng của website. Menu này chứa các trang cung cấp thông tin cơ bản về công ty và sản phẩm.',
    links: [
      { id: 1, name: 'Trang chủ', url: '/', description: 'Trang chủ website' },
      { id: 2, name: 'Giới thiệu', url: '/gioi-thieu', description: 'Thông tin chi tiết về công ty' },
      { id: 3, name: 'Sản phẩm', url: '/san-pham', description: 'Catalog sản phẩm đông trùng hạ thảo' }
    ]
  },
  'ho-tro': {
    title: 'Hỗ trợ',
    description: 'Quản lý các liên kết hỗ trợ khách hàng. Menu này chứa các chức năng hỗ trợ người dùng trên website.',
    links: [
      { id: 1, name: 'Tìm kiếm', url: '/tim-kiem', description: 'Tìm kiếm sản phẩm nhanh chóng' },
      { id: 2, name: 'Đăng nhập', url: '/login', description: 'Đăng nhập tài khoản' },
      { id: 3, name: 'Đăng ký', url: '/signup', description: 'Tạo tài khoản mới' },
      { id: 4, name: 'Giỏ hàng', url: '/gio-hang', description: 'Xem giỏ hàng của bạn' }
    ]
  },
  'huong-dan': {
    title: 'Hướng dẫn',
    description: 'Quản lý các liên kết hướng dẫn sử dụng website. Menu này chứa các trang hướng dẫn chi tiết cho khách hàng.',
    links: [
      { id: 1, name: 'Hướng dẫn mua hàng', url: '/huong-dan/mua-hang', description: 'Cách thức mua hàng trên website' },
      { id: 2, name: 'Hướng dẫn thanh toán', url: '/huong-dan/thanh-toan', description: 'Các phương thức thanh toán' },
      { id: 3, name: 'Hướng dẫn giao nhận', url: '/huong-dan/giao-nhan', description: 'Quy trình giao nhận hàng' },
      { id: 4, name: 'Điều khoản dịch vụ', url: '/dieu-khoan', description: 'Điều khoản và điều kiện sử dụng' }
    ]
  },
  'chinh-sach': {
    title: 'Chính sách',
    description: 'Quản lý các liên kết chính sách của website. Menu này chứa các trang về chính sách và quy định.',
    links: [
      { id: 1, name: 'Chính sách bảo mật', url: '/chinh-sach/bao-mat', description: 'Chính sách bảo vệ thông tin khách hàng' },
      { id: 2, name: 'Chính sách vận chuyển', url: '/chinh-sach/van-chuyen', description: 'Quy định về vận chuyển hàng hóa' },
      { id: 3, name: 'Chính sách đổi trả', url: '/chinh-sach/doi-tra', description: 'Quy trình đổi trả sản phẩm' },
      { id: 4, name: 'Quy định sử dụng', url: '/quy-dinh', description: 'Quy định chung khi sử dụng website' }
    ]
  }
}

// Get current menu config
const currentMenu = computed(() => {
  return menuConfigs[menuId as keyof typeof menuConfigs] || null
})

// Handle 404 if menu not found
if (!currentMenu.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Menu không tìm thấy'
  })
}

useHead({
  title: `${currentMenu.value.title} - Đông Trùng Hạ Thảo Phú Nhân`
})

// Action handlers
interface LinkItem {
  id: number
  name: string
  url: string
  description: string
}

// Make links reactive for drag & drop
const currentLinks = ref<LinkItem[]>([])

// Initialize links when menu changes
watch(currentMenu, (newMenu) => {
  if (newMenu) {
    currentLinks.value = [...newMenu.links]
  }
}, { immediate: true })

// Drag & drop state
const draggedItem = ref<LinkItem | null>(null)
const draggedIndex = ref<number>(-1)

const editLink = (link: LinkItem) => {
  console.log('Edit link:', link)
  // TODO: Implement edit functionality
}

const deleteLink = (link: LinkItem) => {
  console.log('Delete link:', link)
  // TODO: Implement delete functionality
}

// Drag & drop handlers
const onDragStart = (event: DragEvent, item: LinkItem, index: number) => {
  draggedItem.value = item
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', '')
  }
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onDrop = (event: DragEvent, targetIndex: number) => {
  event.preventDefault()
  
  if (draggedIndex.value !== -1 && draggedIndex.value !== targetIndex && draggedItem.value) {
    const links = [...currentLinks.value]
    const draggedLink = links.splice(draggedIndex.value, 1)[0]
    if (draggedLink) {
      links.splice(targetIndex, 0, draggedLink)
      currentLinks.value = links
      
      console.log('Reordered links:', links)
      // TODO: Save new order to backend
    }
  }
  
  draggedItem.value = null
  draggedIndex.value = -1
}

const onDragEnd = () => {
  draggedItem.value = null
  draggedIndex.value = -1
}
</script>

<template>
  <UDashboardPanel :id="menuId">
    <template #header>
      <UDashboardNavbar :title="currentMenu.title">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full p-6">
        <!-- Breadcrumb -->
        <nav class="mb-6" aria-label="Breadcrumb">
          <ol class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <NuxtLink to="/links" class="hover:text-primary-600 dark:hover:text-primary-400">
                Danh sách menu
              </NuxtLink>
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-900 dark:text-white font-medium">{{ currentMenu.title }}</span>
            </li>
          </ol>
        </nav>

        <!-- Main Content -->
        <div class="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <!-- Header Section -->
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {{ currentMenu.title }}
            </h1>
            <p class="text-gray-700 dark:text-gray-300 text-sm">
              {{ currentMenu.description }}
            </p>
          </div>

          <!-- Links Table -->
          <div class="overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider" style="width: 5%">
                    <!-- Drag handle column -->
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider" style="width: 20%">
                    Tên liên kết
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider" style="width: 20%">
                    URL
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider" style="width: 40%">
                    Mô tả
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider" style="width: 15%">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="(link, index) in currentLinks"
                  :key="link.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800"
                  :class="{ 'opacity-50': draggedIndex === index }"
                  draggable="true"
                  @dragstart="onDragStart($event, link, index)"
                  @dragover="onDragOver($event)"
                  @drop="onDrop($event, index)"
                  @dragend="onDragEnd"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" style="width: 5%">
                    <div class="cursor-move">
                      <svg
                        class="w-4 h-4 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        <path d="M6 6a2 2 0 110-4 2 2 0 010 4zM6 12a2 2 0 110-4 2 2 0 010 4zM6 18a2 2 0 110-4 2 2 0 010 4z" />
                        <path d="M14 6a2 2 0 110-4 2 2 0 010 4zM14 12a2 2 0 110-4 2 2 0 010 4zM14 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium" style="width: 20%">
                    {{ link.name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-primary-600 dark:text-primary-400 font-mono" style="width: 20%">
                    {{ link.url }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-800 dark:text-gray-200" style="width: 40%">
                    {{ link.description }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" style="width: 15%">
                    <div class="flex items-center space-x-2 justify-end">
                      <button
                        title="Chỉnh sửa"
                        class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        @click="editLink(link)"
                      >
                        <svg
                          class="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        title="Xóa"
                        class="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                        @click="deleteLink(link)"
                      >
                        <svg
                          class="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.cursor-move:hover {
  cursor: grab;
}

.cursor-move:active {
  cursor: grabbing;
}

tr[draggable="true"]:hover {
  cursor: grab;
}

tr[draggable="true"]:active {
  cursor: grabbing;
}

tr.opacity-50 {
  background-color: rgba(59, 130, 246, 0.1) !important;
}
</style>
