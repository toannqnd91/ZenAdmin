<script setup lang="ts">
import { linksService } from '@/services'
import type { MenuItem } from '@/services'
import { VueDraggable } from 'vue-draggable-plus'
import type { SortableEvent } from 'sortablejs'

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
  title: `${currentMenu.value.title} - Cơ Khí Tam Long`
})

// Fetch menu data from API
const { data: menuResponse, refresh: refreshMenuData } = await useAsyncData(`menu-${menuId}`, async () => {
  const response = await linksService.getMenuCategories(menuId)
  return response
}, { server: false })

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
// Flatten menu items, giữ parentId cho từng item
const flattenMenuItems = (items: MenuItem[], level: number = 0, parentId: number | null = null): LinkItem[] => {
  const result: LinkItem[] = []
  items.forEach((item) => {
    const linkItem: LinkItem = {
      id: item.id,
      name: item.title,
      url: item.url,
      description: `Order: ${item.order}`,
      level,
      hasChildren: item.children && item.children.length > 0,
      parentId: parentId ?? undefined
    }
    result.push(linkItem)
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

// Modal state
const isAddModalOpen = ref(false)
const newLinkName = ref('')
const newLinkType = ref('Trang chủ')
const linkTypeOptions = [
  { label: 'Trang chủ', value: 'Trang chủ' },
  { label: 'Danh mục sản phẩm', value: 'Danh mục sản phẩm' },
  { label: 'Sản phẩm', value: 'Sản phẩm' },
  { label: 'Tất cả sản phẩm', value: 'Tất cả sản phẩm' },
  { label: 'Trang nội dung', value: 'Trang nội dung' },
  { label: 'Danh mục bài viết', value: 'Danh mục bài viết' },
  { label: 'Trang tìm kiếm', value: 'Trang tìm kiếm' },
  { label: 'Địa chỉ web', value: 'Địa chỉ web' }
]

const openAddModal = () => {
  isAddModalOpen.value = true
  newLinkName.value = ''
  newLinkType.value = linkTypeOptions[0]?.value || 'Trang chủ'
}

// Handler for LinkModal submit
interface LinkModalPayload {
  name: string
  type: string
}
const handleAddLinkModal = (payload: LinkModalPayload) => {
  // TODO: Gọi API thêm liên kết
  console.log('Adding new link:', {
    name: payload.name,
    type: payload.type,
    menuId
  })
  isAddModalOpen.value = false
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

// Drag & drop state - sử dụng Vue Draggable Plus
const isDragging = ref(false)

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

// Hàm helper để xác định parentId và level mới dựa trên vị trí drop
const determineNewHierarchy = (targetIndex: number, links: LinkItem[]) => {
  // Nếu drop ở đầu danh sách
  if (targetIndex === 0) {
    return { newParentId: null, newLevel: 0 }
  }
  
  // Lấy item trước vị trí drop
  const prevItem = links[targetIndex - 1]
  if (!prevItem) {
    return { newParentId: null, newLevel: 0 }
  }
  
  // Nếu item trước có children và đang expanded
  if (prevItem.hasChildren && expandedItems.value.has(prevItem.id)) {
    // Kiểm tra xem item sau có phải là con của prevItem không
    const nextItem = links[targetIndex]
    if (nextItem && nextItem.parentId === prevItem.id) {
      // Drop vào giữa các con của prevItem
      return { newParentId: prevItem.id, newLevel: prevItem.level + 1 }
    } else {
      // Drop sau prevItem và các con của nó - cùng level với prevItem
      return { newParentId: prevItem.parentId ?? null, newLevel: prevItem.level }
    }
  } else {
    // Item trước không có children hoặc đang collapsed - cùng level
    return { newParentId: prevItem.parentId ?? null, newLevel: prevItem.level }
  }
}

// Handle drag & drop events với Vue Draggable Plus
const onDragStart = () => {
  isDragging.value = true
}

const onDragEnd = async (event: SortableEvent) => {
  isDragging.value = false
  
  // Kiểm tra nếu có thay đổi vị trí
  if (event.oldIndex !== undefined && event.newIndex !== undefined && event.oldIndex !== event.newIndex) {
    const draggedLink = currentLinks.value[event.newIndex]
    
    if (draggedLink) {
      try {
        // Xác định hierarchy mới dựa trên vị trí mới
        const { newParentId, newLevel } = determineNewHierarchy(event.newIndex, currentLinks.value)
        
        // Cập nhật thông tin hierarchy cho draggedLink
        draggedLink.parentId = newParentId ?? undefined
        draggedLink.level = newLevel
        
        console.log('Hierarchy change:', {
          item: draggedLink.name,
          newParentId,
          newLevel,
          oldIndex: event.oldIndex,
          newIndex: event.newIndex
        })
        
        // Tính newSortOrder trong nhóm cha mới
        const siblings = currentLinks.value.filter(l => (l.parentId ?? null) === newParentId)
        const newSortOrder = siblings.findIndex(l => l.id === draggedLink.id)
        
        console.log('Calling reorder API with:', {
          menuId: draggedLink.id, // menuId chính là itemId
          newParentId,
          newSortOrder,
          siblingCount: siblings.length
        })
        
        await linksService.reorderMenuItemsV2(draggedLink.id, newParentId, newSortOrder)
        console.log('Successfully saved new order to API')
        
        // Refresh để cập nhật hierarchy từ server
        await refreshMenuData()
      } catch (error) {
        console.error('Error saving new order:', error)
        // Revert changes on error
        await refreshMenuData()
      }
    }
  }
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
            <table class="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th class="col-drag px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    <!-- Drag handle column -->
                  </th>
                  <th class="col-name px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Tên liên kết
                  </th>
                  <th class="col-url px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    URL
                  </th>
                  <th class="col-action px-6 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody v-if="!menuResponse || !currentLinks.length" class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <template v-if="!menuResponse">
                      Không có dữ liệu
                    </template>
                    <template v-else>
                      Không có dữ liệu
                    </template>
                  </td>
                </tr>
              </tbody>
              <VueDraggable
                v-else
                v-model="currentLinks"
                tag="tbody"
                handle=".drag-handle"
                ghost-class="ghost"
                chosen-class="chosen"
                drag-class="drag"
                :animation="300"
                easing="cubic-bezier(1, 0, 0, 1)"
                class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
                @start="onDragStart"
                @end="onDragEnd"
              >
                <tr
                  v-for="link in currentLinks"
                  :key="link.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                  :class="{ 'opacity-60': isDragging }"
                >
                  <td class="col-drag px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="drag-handle cursor-move">
                      <svg
                        class="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <circle cx="5" cy="5" r="2" />
                        <circle cx="5" cy="10" r="2" />
                        <circle cx="5" cy="15" r="2" />
                        <circle cx="10" cy="5" r="2" />
                        <circle cx="10" cy="10" r="2" />
                        <circle cx="10" cy="15" r="2" />
                      </svg>
                    </div>
                  </td>
                  <td class="col-name px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                    <div class="flex items-center">
                      <div
                        class="flex items-center"
                        :style="{
                          paddingLeft: `${link.level * 20}px`,
                          marginLeft: link.hasChildren ? '-32px' : '0px'
                        }"
                      >
                        <!-- Nút expand/collapse cho item có children -->
                        <button
                          v-if="link.hasChildren"
                          class="mr-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center"
                          @click="toggleExpand(link.id)"
                        >
                          <svg
                            class="w-4 h-4 text-gray-500 transition-transform"
                            :class="{ '-rotate-90': !expandedItems.has(link.id) }"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            viewBox="0 0 24 24"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                        <span>{{ link.name }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="col-url px-6 py-4 whitespace-nowrap text-sm text-primary-600 dark:text-primary-400 font-mono">
                    {{ link.url }}
                  </td>
                  <td class="col-action px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex items-center space-x-4 justify-end">
                      <button
                        title="Chỉnh sửa"
                        class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
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
                        class="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
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
              </VueDraggable>
            </table>
            
            <!-- Add new link button -->
            <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                class="flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                @click="openAddModal"
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

  <!-- Modal thêm/sửa liên kết dùng chung component -->
  <LinkModal
    :open="isAddModalOpen"
    title="Thêm liên kết"
    :initial-name="newLinkName"
    :initial-type="newLinkType"
    :link-type-options="linkTypeOptions"
    @update:open="isAddModalOpen = $event"
    @submit="handleAddLinkModal"
  />
</template>

<style scoped>
/* Table column widths */
.col-drag {
  width: 5%;
}

.col-name {
  width: 35%;
}

.col-url {
  width: 45%;
}

.col-action {
  width: 15%;
}

.drag-handle:hover {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

/* Vue Draggable Plus CSS Classes */
.ghost {
  opacity: 0.5;
  background: #f3f4f6;
  transform: rotate(2deg);
}

.chosen {
  opacity: 0.8;
  background: #e5e7eb;
}

.drag {
  opacity: 0.9;
  background: #ddd6fe;
  transform: rotate(-2deg);
  transition: all 0.3s ease;
}

.transition-transform {
  transition: transform 0.2s ease;
}

  .rotate-90 {
    transform: rotate(90deg);
  }

.transition-colors {
  transition: color 0.2s ease, background-color 0.2s ease;
}

/* Smooth animations */
tbody tr {
  transition: all 0.3s ease;
}

tbody tr.sortable-ghost {
  opacity: 0.4;
  background: #f3f4f6;
}

tbody tr.sortable-chosen {
  background: #e5e7eb;
}

tbody tr.sortable-drag {
  background: #ddd6fe;
  transform: rotate(1deg);
}
</style>
