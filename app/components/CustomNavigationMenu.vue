<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

interface Props {
  items: NavigationMenuItem[]
  collapsed?: boolean
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()

// Track expanded items - chỉ cho phép 1 menu mở tại 1 thời điểm
const expandedItems = ref<Set<string>>(new Set())

const toggleExpand = (item: NavigationMenuItem) => {
  const key = item.label || ''
  if (expandedItems.value.has(key)) {
    // Nếu menu này đang mở, đóng nó lại
    expandedItems.value.delete(key)
  } else {
    // Đóng tất cả menu khác và mở menu này
    expandedItems.value.clear()
    expandedItems.value.add(key)
  }
}

const handleItemClick = (e: MouseEvent, item: NavigationMenuItem) => {
  // Ngăn sự kiện lan ra ngoài làm ảnh hưởng layout/resize của sidebar
  e.preventDefault()
  e.stopPropagation()

  // Khi đang thu gọn, không mở submenu — chỉ điều hướng
  if (props.collapsed) {
    if (item.to && route.path !== String(item.to)) {
      router.push(item.to)
    }
    return
  }

  if (item.children && item.children.length > 0) {
    // Toggle expand trước
    toggleExpand(item)
    // Điều hướng nếu có to và khác route hiện tại
    if (item.to && route.path !== String(item.to)) {
      router.push(item.to)
    }
  } else if (item.to && route.path !== String(item.to)) {
    router.push(item.to)
  }
}

const isExpanded = (item: NavigationMenuItem) => {
  return expandedItems.value.has(item.label || '')
}

// Khi sidebar chuyển sang trạng thái thu gọn, đóng tất cả submenu
watch(() => props.collapsed, (val) => {
  if (val) {
    expandedItems.value.clear()
  }
})
</script>

<template>
  <div class="space-y-1">
    <div v-for="item in items" :key="item.label" class="space-y-1">
      <!-- Menu Item -->
      <div
        :title="collapsed ? item.label : undefined"
        class="flex items-center rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        :class="[
          $route.path === item.to ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : '',
          collapsed ? 'justify-center p-2' : 'gap-2 px-3 py-2'
        ]"
        @click="(e) => handleItemClick(e, item)"
      >
        <UIcon v-if="item.icon" :name="item.icon" class="w-5 h-5 shrink-0" />
        <span v-if="!collapsed" class="flex-1 text-sm font-medium">
          {{ item.label }}
        </span>
        <UIcon
          v-if="!collapsed && item.children && item.children.length > 0"
          :name="isExpanded(item) ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
          class="w-3 h-3 transition-transform"
        />
      </div>

      <!-- Submenu -->
      <div
        v-if="!collapsed && item.children && item.children.length > 0 && isExpanded(item)"
        class="ml-6 space-y-1"
      >
        <div
          v-for="child in item.children"
          :key="child.label"
          class="flex items-center rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          :class="[
            $route.path === child.to ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : '',
            'gap-2 px-3 py-2'
          ]"
          @click="(e) => { e.preventDefault(); e.stopPropagation(); child.to && route.path !== String(child.to) && router.push(child.to) }"
        >
          <UIcon v-if="child.icon" :name="child.icon" class="w-4 h-4 shrink-0" />
          <span class="text-sm">{{ child.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
