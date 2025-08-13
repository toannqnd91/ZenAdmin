<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

interface Props {
  items: NavigationMenuItem[]
  collapsed?: boolean
}

const props = defineProps<Props>()
const router = useRouter()

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

const handleItemClick = (item: NavigationMenuItem) => {
  if (item.children && item.children.length > 0) {
    // Menu cha có children: vừa toggle expand vừa navigate
    toggleExpand(item)
    if (item.to) {
      router.push(item.to)
    }
  } else if (item.to) {
    // Menu không có children: chỉ navigate
    router.push(item.to)
  }
}

const isExpanded = (item: NavigationMenuItem) => {
  return expandedItems.value.has(item.label || '')
}
</script>

<template>
  <div class="space-y-1">
    <div v-for="item in items" :key="item.label" class="space-y-1">
      <!-- Menu Item -->
      <div
        class="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        :class="{
          'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300': $route.path === item.to
        }"
        @click="handleItemClick(item)"
      >
        <UIcon v-if="item.icon" :name="item.icon" class="w-4 h-4 shrink-0" />
        <span class="flex-1 text-sm font-medium" :class="{ 'sr-only': collapsed && !item.children }">
          {{ item.label }}
        </span>
        <UIcon
          v-if="item.children && item.children.length > 0"
          :name="isExpanded(item) ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
          class="w-3 h-3 transition-transform"
        />
      </div>

      <!-- Submenu -->
      <div
        v-if="item.children && item.children.length > 0 && isExpanded(item)"
        class="ml-6 space-y-1"
      >
        <div
          v-for="child in item.children"
          :key="child.label"
          class="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          :class="{
            'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300': $route.path === child.to
          }"
          @click="child.to && router.push(child.to)"
        >
          <UIcon v-if="child.icon" :name="child.icon" class="w-4 h-4 shrink-0" />
          <span class="text-sm">{{ child.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
