<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { linksService } from '@/services'
import type { MenuItem } from '@/services'
import { VueDraggable } from 'vue-draggable-plus'
import type { SortableEvent } from 'sortablejs'
import IconEnglish from '@/components/icons/IconEnglish.vue'
import BaseModal from '@/components/base/BaseModal.vue'

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

const appConfig = useAppConfig()
useHead({
  title: `${currentMenu.value.title} - ${appConfig.settings.title}`
})

// Fetch menu data from API
const { data: menuResponse, refresh: refreshMenuData } = await useAsyncData(`menu-${menuId}`, async () => {
  const response = await linksService.getMenuCategories(menuId)
  return response
}, { server: false })

// Fetch category info to get the ID using MenuCategories API
const currentMenuId = ref<number | null>(null)
const { data: categoryResponse } = await useAsyncData(`menu-category-${menuId}`, async () => {
  return await linksService.getMenuCategoryBySlug(menuId)
}, { server: false })

watch(categoryResponse, (res) => {
  console.log('Menu Category Response:', res)
  if (res?.success && res.data?.id) {
    currentMenuId.value = res.data.id
    console.log('Menu Category ID:', currentMenuId.value)
  }
}, { immediate: true })

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
  menuTypeId?: number
  entityId?: number
  icon?: string | null
  sortOrder?: number
  isActive?: boolean
  menuCategoryId?: number
  autoGenerateChildren?: boolean
  dynamicConfig?: string | null
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
      parentId: parentId ?? undefined,
      menuTypeId: item.menuType?.id ?? item.menuTypeId,
      entityId: item.entityId ?? item.menuType?.entityId,
      icon: item.icon || undefined,
      sortOrder: item.sortOrder ?? item.order,
      isActive: item.isActive,
      menuCategoryId: item.menuCategoryId,
      autoGenerateChildren: item.autoGenerateChildren,
      dynamicConfig: item.dynamicConfig ?? undefined
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
const isEditMode = ref(false)
const editingLinkId = ref<number | null>(null)
const newLinkName = ref('')
const newLinkTypeId = ref<string | number | undefined>(undefined)
const newLinkEntityId = ref<string | number | undefined>(undefined)

const openAddModal = () => {
  isEditMode.value = false
  editingLinkId.value = null
  newLinkName.value = ''
  newLinkTypeId.value = undefined
  newLinkEntityId.value = undefined
  isAddModalOpen.value = true
}

const editLink = (link: LinkItem) => {
  isEditMode.value = true
  editingLinkId.value = link.id
  newLinkName.value = link.name
  // Use menuTypeId from the link item (already extracted from menuType.id in flattenMenuItems)
  newLinkTypeId.value = link.menuTypeId

  // Logic to determine initial entity/url value
  // If entityId is set and > 0, use it. Otherwise use url.
  if (link.entityId && link.entityId > 0) {
    newLinkEntityId.value = link.entityId
  } else {
    newLinkEntityId.value = link.url
  }

  isAddModalOpen.value = true
}

// Translation modal state
const isTranslationModalOpen = ref(false)
const translatingLink = ref<LinkItem | null>(null)

const openTranslationModal = (link: LinkItem) => {
  translatingLink.value = link
  isTranslationModalOpen.value = true
}

const handleTranslationSaved = async () => {
  // Optionally refresh data after translation is saved
  await refreshMenuData()
}

// Handler for LinkModal submit
interface LinkModalPayload {
  name: string
  typeId: number | string
  typeName: string
  typeEntity: string | number | null // Updated type to allow number
  typeEntityUrl?: string
}
const handleLinkModalSubmit = async (payload: LinkModalPayload) => {
  if (isEditMode.value && editingLinkId.value) {
    // Edit existing link
    const originalItem = currentLinks.value.find(l => l.id === editingLinkId.value)
    if (!originalItem) return

    try {
      // Determine URL: 
      let url = originalItem.url

      // If we have an Entity URL from the modal (Dropdown selection), use it strictly.
      // This prevents fallback to originalItem.url which might be corrupted (e.g. repeated prefixes).
      if (payload.typeEntityUrl !== undefined) {
        url = payload.typeEntityUrl
      } else if (typeof payload.typeEntity === 'string' && payload.typeEntity) {
        url = payload.typeEntity
      }
      // If payload.typeEntityUrl is undefined, it means modal didn't resolve it (maybe text mode or error).

      // Specifically: If it is an entity type (number), and typeEntityUrl is empty string, we use empty string.
      // Do NOT fallback to originalItem.url.
      if (typeof payload.typeEntity === 'number') {
        url = payload.typeEntityUrl || ''
      }

      const updatePayload: any = {
        title: payload.name,
        url: url,
        icon: originalItem.icon || '',
        sortOrder: originalItem.sortOrder ?? 0,
        isActive: originalItem.isActive ?? true,
        parentId: originalItem.parentId ?? 0,
        menuCategoryId: currentMenuId.value || originalItem.menuCategoryId || 0,
        menuTypeId: payload.typeId ? Number(payload.typeId) : (originalItem.menuTypeId ?? 0),
        entityId: payload.typeEntity ? Number(payload.typeEntity) : 0,
        autoGenerateChildren: originalItem.autoGenerateChildren ?? false,
        dynamicConfig: originalItem.dynamicConfig || ''
      }

      console.log('Sending Update Payload:', updatePayload)
      await linksService.updateMenu(editingLinkId.value, updatePayload)
      await refreshMenuData()
    } catch (e) {
      console.error('Error updating link:', e)
      alert('Cập nhật thất bại')
    }
  } else {
    // Add new link
    if (!currentMenuId.value) {
      alert('Không tìm thấy ID của menu category')
      return
    }

    try {
      // Determine URL for new item
      let url = ''
      if (payload.typeEntityUrl) {
        url = payload.typeEntityUrl
      } else if (typeof payload.typeEntity === 'string' && payload.typeEntity) {
        url = payload.typeEntity
      }

      const createPayload: any = {
        title: payload.name,
        url: url,
        icon: '',
        sortOrder: 0,
        isActive: true,
        parentId: 0,
        menuCategoryId: currentMenuId.value,
        menuTypeId: payload.typeId ? Number(payload.typeId) : 0,
        entityId: payload.typeEntity ? Number(payload.typeEntity) : 0,
        autoGenerateChildren: false,
        dynamicConfig: ''
      }

      console.log('Sending Create Payload:', createPayload)
      await linksService.createMenu(createPayload)
      await refreshMenuData()
    } catch (e) {
      console.error('Error creating link:', e)
      alert('Tạo mới thất bại')
    }
  }
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
const dragState = reactive({
  linkId: null as number | null,
  startX: 0,
  initialLevel: 0,
  previewLevel: null as number | null
})

// Helper to get clientX from various pointer events
const getClientX = (evt: MouseEvent | TouchEvent | PointerEvent): number => {
  if ('clientX' in evt && typeof evt.clientX === 'number') return evt.clientX
  const touch = (evt as TouchEvent).touches?.[0] || (evt as TouchEvent).changedTouches?.[0]
  return touch?.clientX ?? 0
}

const onPointerMove = (e: MouseEvent | TouchEvent | PointerEvent) => {
  if (!isDragging.value || !dragState.linkId) return
  const idx = currentLinks.value.findIndex(l => l.id === dragState.linkId)
  if (idx < 0) return
  const clientX = getClientX(e)
  // Initialize startX on first move to make horizontal delta stable
  if (dragState.startX === 0) {
    dragState.startX = clientX
  }
  const deltaX = clientX - dragState.startX
  const step = 12 // px per indent level (more sensitive)
  const desiredDelta = Math.round(deltaX / step)
  const prevItem = currentLinks.value[idx - 1]
  const maxLevel = prevItem ? prevItem.level + 1 : 0
  const desiredLevel = Math.max(0, Math.min(maxLevel, dragState.initialLevel + desiredDelta))
  dragState.previewLevel = desiredLevel
}

// editLink is already implemented above
// removing duplicated function stub if any
// (Code previously had const editLink = ... // TODO)

// Delete modal state
const isDeleteModalOpen = ref(false)
const linkToDelete = ref<LinkItem | null>(null)
const isDeleting = ref(false) // loading state for delete action

const deleteLink = (link: LinkItem) => {
  linkToDelete.value = link
  isDeleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!linkToDelete.value) return

  isDeleting.value = true
  try {
    await linksService.deleteMenu(linkToDelete.value.id)
    await refreshMenuData()
    isDeleteModalOpen.value = false
    linkToDelete.value = null
  } catch (error) {
    console.error('Error deleting link:', error)
    alert('Xóa menu thất bại')
  } finally {
    isDeleting.value = false
  }
}

// Removed legacy determineNewHierarchy (now computed from drag preview)

// Handle drag & drop events với Vue Draggable Plus
const onDragStart = (event: SortableEvent) => {
  isDragging.value = true
  const oldIdx = typeof event.oldIndex === 'number' ? event.oldIndex : -1
  const item = currentLinks.value[oldIdx]
  dragState.linkId = item?.id ?? null
  dragState.initialLevel = item?.level ?? 0
  const origEvtAny = (event as unknown as { originalEvent?: MouseEvent | TouchEvent | PointerEvent }).originalEvent
  // Capture initial pointer X if available; otherwise it will be initialized on first move
  dragState.startX = origEvtAny ? getClientX(origEvtAny) : 0
  dragState.previewLevel = null
  window.addEventListener('mousemove', onPointerMove)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('touchmove', onPointerMove, { passive: true })
}

const onDragEnd = async (event: SortableEvent) => {
  isDragging.value = false
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('touchmove', onPointerMove)

  // Kiểm tra nếu có thay đổi vị trí
  if (event.oldIndex !== undefined && event.newIndex !== undefined && event.oldIndex !== event.newIndex) {
    const draggedLink = currentLinks.value[event.newIndex]

    if (draggedLink) {
      try {
        // Tính level mục tiêu: ưu tiên theo kéo ngang (previewLevel)
        const idx = event.newIndex
        const prevItem = currentLinks.value[idx - 1]
        const maxLevel = prevItem ? prevItem.level + 1 : 0
        const targetLevel = Math.max(0, Math.min(maxLevel, dragState.previewLevel ?? draggedLink.level))

        // Tìm parent theo level mục tiêu: parent là item gần nhất phía trên có level = targetLevel - 1
        let newParentId: number | null = null
        if (targetLevel > 0) {
          for (let i = idx - 1; i >= 0; i -= 1) {
            const cand = currentLinks.value[i]
            if (!cand) continue
            if (cand.level === targetLevel - 1) {
              newParentId = cand.id
              break
            }
          }
        }
        const newLevel = targetLevel

        // Cập nhật thông tin hierarchy cho draggedLink
        draggedLink.parentId = newParentId ?? undefined
        draggedLink.level = newLevel

        // Tính lại toàn bộ thứ tự trong nhóm cha mới (gửi full danh sách cùng cấp)
        const siblings = currentLinks.value.filter(l => (l.parentId ?? null) === newParentId)
        const items = siblings.map((l, sIdx) => ({
          menuId: l.id,
          parentId: newParentId ?? null,
          sortOrder: sIdx
        }))

        await linksService.reorderMenuItemsV2(items)
        // Refresh để cập nhật hierarchy từ server
        await refreshMenuData()
      } catch (error) {
        console.error('Error saving new order:', error)
        // Revert changes on error
        await refreshMenuData()
      }
    }
  }
  // Reset drag state
  dragState.linkId = null
  dragState.previewLevel = null
  dragState.startX = 0
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('touchmove', onPointerMove)
})
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
                <path fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd" />
              </svg>
              <span class="text-gray-900 dark:text-white font-medium">{{ currentMenu.title }}</span>
            </li>
          </ol>
        </nav>

        <!-- Main Content -->
        <div
          class="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
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
                  <th
                    class="col-drag px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    <!-- Drag handle column -->
                  </th>
                  <th
                    class="col-name px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Tên liên kết
                  </th>
                  <th
                    class="col-url px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    URL
                  </th>
                  <th
                    class="col-action px-6 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody v-if="!menuResponse || !currentLinks.length"
                class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
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
              <VueDraggable v-else v-model="currentLinks" tag="tbody" handle=".drag-handle" ghost-class="ghost"
                chosen-class="chosen" drag-class="drag" :animation="180" easing="ease-in-out"
                class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700" :fallback-on-body="true"
                :force-fallback="true" :fallback-tolerance="3" @start="onDragStart" @end="onDragEnd">
                <tr v-for="link in currentLinks" :key="link.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                  :class="{ 'opacity-60': isDragging }">
                  <td class="col-drag px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="drag-handle cursor-move">
                      <svg class="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" fill="currentColor"
                        viewBox="0 0 20 20">
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
                      <div class="flex items-center indent-smooth" :style="{
                        paddingLeft: `${((isDragging && dragState.linkId === link.id && dragState.previewLevel !== null) ? dragState.previewLevel : link.level) * 20}px`,
                        marginLeft: link.hasChildren ? '-32px' : '0px'
                      }">
                        <!-- Nút expand/collapse cho item có children -->
                        <button v-if="link.hasChildren"
                          class="mr-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center"
                          @click="toggleExpand(link.id)">
                          <svg class="w-4 h-4 text-gray-500 transition-transform"
                            :class="{ '-rotate-90': !expandedItems.has(link.id) }" fill="none" stroke="currentColor"
                            stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                        <span>{{ link.name }}</span>
                      </div>
                    </div>
                  </td>
                  <td
                    class="col-url px-6 py-4 whitespace-nowrap text-sm text-primary-600 dark:text-primary-400 font-mono">
                    {{ link.url }}
                  </td>
                  <td class="col-action px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex items-center space-x-4 justify-end">
                      <button title="English Content"
                        class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        @click="openTranslationModal(link)">
                        <IconEnglish class="w-4 h-auto" />
                      </button>
                      <button title="Chỉnh sửa"
                        class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        @click="editLink(link)">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button title="Xóa"
                        class="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                        @click="deleteLink(link)">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                @click="openAddModal">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
  <LinkModal v-if="isAddModalOpen" v-model:open="isAddModalOpen"
    :title="isEditMode ? 'Cập nhật liên kết' : 'Thêm liên kết mới'" :initial-name="newLinkName"
    :initial-type-id="newLinkTypeId" :initial-entity-id="newLinkEntityId" @submit="handleLinkModalSubmit" />

  <BaseModal v-model="isDeleteModalOpen" title="Xác nhận xóa" width-class="max-w-md">
    <div class="py-4">
      <p>Bạn có chắc chắn muốn xóa liên kết <span class="font-bold">{{ linkToDelete?.name }}</span>?</p>
      <p class="text-gray-500 text-sm mt-2">Hành động này không thể hoàn tác.</p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <button type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          @click="isDeleteModalOpen = false">
          Hủy
        </button>
        <button type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          :disabled="isDeleting" @click="confirmDelete">
          {{ isDeleting ? 'Đang xóa...' : 'Xóa' }}
        </button>
      </div>
    </template>
  </BaseModal>

  <!-- Translation Modal -->
  <TranslationModal v-model="isTranslationModalOpen" entity-type="MenuDTO" :entity-id="translatingLink?.id || 0"
    :current-name="translatingLink?.name || ''" @saved="handleTranslationSaved" />
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
/* Drag/ghost/chosen: very light blue, not purple */
.ghost {
  opacity: 0.6;
  background: rgba(59, 130, 246, 0.10);
  /* blue-500, 10% */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}

.chosen {
  opacity: 0.95;
  background: rgba(59, 130, 246, 0.13);
  /* blue-500, 13% */
}

.drag {
  opacity: 0.98;
  background: rgba(59, 130, 246, 0.16);
  /* blue-500, 16% */
  transition: background-color 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
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
  transition: background-color 0.15s ease, opacity 0.15s ease, transform 0.15s ease;
}

tbody tr.sortable-ghost {
  opacity: 0.5;
  background: rgba(59, 130, 246, 0.10);
}

tbody tr.sortable-chosen {
  background: rgba(59, 130, 246, 0.13);
}

tbody tr.sortable-drag {
  background: rgba(59, 130, 246, 0.16);
}

/* Smooth indent transition */
.indent-smooth {
  transition: padding-left 0.15s ease;
}
</style>
