<script setup lang="ts">
import { linksService } from '@/services'
import type { MenuItem } from '@/services'

const route = useRoute()
const menuId = route.params.id as string

definePageMeta({
  layout: 'default'
})

// Menu configurations for display info
const menuConfigs = {
  'main-menu': {
    title: 'Main menu',
    description: 'Quản lý các liên kết trong menu chính của website. Menu này sẽ hiển thị ở header và là navigation chính cho khách hàng.'
  },
  'footer': {
    title: 'Footer',
    description: 'Quản lý các liên kết trong footer của website. Những liên kết này sẽ hiển thị ở cuối mỗi trang.'
  },
  'thong-tin': {
    title: 'Thông tin',
    description: 'Quản lý các liên kết thông tin quan trọng của website. Menu này chứa các trang cung cấp thông tin cơ bản về công ty và sản phẩm.'
  },
  'ho-tro': {
    title: 'Hỗ trợ',
    description: 'Quản lý các liên kết hỗ trợ khách hàng. Menu này chứa các chức năng hỗ trợ người dùng trên website.'
  },
  'huong-dan': {
    title: 'Hướng dẫn',
    description: 'Quản lý các liên kết hướng dẫn sử dụng website. Menu này chứa các trang hướng dẫn chi tiết cho khách hàng.'
  },
  'chinh-sach': {
    title: 'Chính sách',
    description: 'Quản lý các liên kết chính sách của website. Menu này chứa các trang về chính sách và quy định.'
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

// Fetch menu data from API
const { data: menuResponse, refresh: refreshMenuData } = await useAsyncData(`menu-${menuId}`, async () => {
  const response = await linksService.getMenuCategories(menuId)
  return response
})

// Transform API data to display format with children support
interface LinkItem {
  id: number
  name: string
  url: string
  description: string
  level: number
  isExpanded?: boolean
  hasChildren: boolean
  parentId?: number
}

// Make links reactive for drag & drop
const currentLinks = ref<LinkItem[]>([])
const expandedItems = ref<Set<number>>(new Set())

// Function to flatten menu items with hierarchy
const flattenMenuItems = (items: MenuItem[], level: number = 0, parentId?: number): LinkItem[] => {
  const result: LinkItem[] = []
  
  items.forEach((item) => {
    const linkItem: LinkItem = {
      id: item.id,
      name: item.title,
      url: item.url,
      description: `Order: ${item.order}`,
      level,
      hasChildren: item.children && item.children.length > 0,
      parentId
    }
    
    result.push(linkItem)
    
    // Add children if item is expanded
    if (item.children && item.children.length > 0 && expandedItems.value.has(item.id)) {
      result.push(...flattenMenuItems(item.children, level + 1, item.id))
    }
  })
  
  return result
}

// Toggle expand/collapse for items with children
const toggleExpand = (itemId: number) => {
  if (expandedItems.value.has(itemId)) {
    expandedItems.value.delete(itemId)
  } else {
    expandedItems.value.add(itemId)
  }
  
  // Refresh the flattened list
  if (menuResponse.value?.success && menuResponse.value.data) {
    currentLinks.value = flattenMenuItems(menuResponse.value.data)
  }
}

// Add new link function
const addNewLink = () => {
  console.log('Add new link for menu:', menuId)
  // TODO: Implement add new link functionality
}

// Initialize links from API data
watch(menuResponse, (newResponse) => {
  if (newResponse?.success && newResponse.data) {
    currentLinks.value = flattenMenuItems(newResponse.data)
  }
}, { immediate: true })

// Watch for changes in expanded items
watch(expandedItems, () => {
  if (menuResponse.value?.success && menuResponse.value.data) {
    currentLinks.value = flattenMenuItems(menuResponse.value.data)
  }
}, { deep: true })

// Drag & drop state
const draggedItem = ref<LinkItem | null>(null)
const draggedIndex = ref<number>(-1)

const editLink = (link: LinkItem) => {
  console.log('Edit link:', link)
  // TODO: Implement edit functionality
}

const deleteLink = async (link: LinkItem) => {
  console.log('Delete link:', link)
  // TODO: Implement delete functionality using API
  try {
    await linksService.deleteMenuItem(menuId, link.id)
    // Refresh data after deletion
    await refreshMenuData()
  } catch (error) {
    console.error('Error deleting link:', error)
  }
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

const onDrop = async (event: DragEvent, targetIndex: number) => {
  event.preventDefault()
  
  if (draggedIndex.value !== -1 && draggedIndex.value !== targetIndex && draggedItem.value) {
    const links = [...currentLinks.value]
    const draggedLink = links.splice(draggedIndex.value, 1)[0]
    if (draggedLink) {
      links.splice(targetIndex, 0, draggedLink)
      currentLinks.value = links
      
      console.log('Reordered links:', links)
      
      // Save new order to backend (new API)
      try {
        // Gọi API mới cho từng item bị reorder
        for (let i = 0; i < links.length; i++) {
          const link = links[i]
          // menuId: menuId, newParentId: null (chưa hỗ trợ drag vào nhóm), newSortOrder: i
          await linksService.reorderMenuItemsV2(Number(menuId), null, i)
        }
        console.log('Successfully saved new order to API')
      } catch (error) {
        console.error('Error saving new order:', error)
        // Revert changes on error
        await refreshMenuData()
      }
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
      <div class="w-full">
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
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider" style="width: 35%">
                    Tên liên kết
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider" style="width: 45%">
                    URL
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider" style="width: 15%">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="!menuResponse || !currentLinks.length" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <template v-if="!menuResponse">
                      Không có dữ liệu
                    </template>
                    <template v-else>
                      Không có dữ liệu
                    </template>
                  </td>
                </tr>
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
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium" style="width: 35%">
                    <div class="flex items-center">
                      <!-- Container with indentation for hierarchy and negative margin for parent items -->
                      <div
                        class="flex items-center"
                        :style="{
                          paddingLeft: `${link.level * 20}px`,
                          marginLeft: link.hasChildren ? '-30px' : '0px'
                        }"
                      >
                        <!-- Expand/Collapse button for items with children -->
                        <button
                          v-if="link.hasChildren"
                          class="mr-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          @click="toggleExpand(link.id)"
                        >
                          <svg
                            class="w-4 h-4 text-gray-500 transition-transform"
                            :class="{ 'rotate-90': expandedItems.has(link.id) }"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                          </svg>
                        </button>
                        
                        <!-- Text name with hierarchy indentation -->
                        <span>{{ link.name }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-primary-600 dark:text-primary-400 font-mono" style="width: 45%">
                    {{ link.url }}
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
            
            <!-- Add new link button -->
            <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                class="flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                @click="addNewLink"
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Thêm liên kết
              </button>
            </div>
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

.transition-transform {
  transition: transform 0.2s ease;
}

.rotate-90 {
  transform: rotate(90deg);
}
</style>
