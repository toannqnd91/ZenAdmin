<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { user: userInfo } = useAuthService()
const { isOnline, isOffline, connectionQuality } = useOffline()
const userRoles = computed(() => {
  return userInfo.value?.role
})

// Print out the user's roles
watch(userRoles, (val) => {
  }, { immediate: true })

const route = useRoute()
const toast = useToast()

const open = ref(false)
const sidebarCollapsed = computed(() => open.value === false)

// Use dashboard composable with service integration
const {
  menuItems,
  menuLoading,
  menuError,
  retryFetchMenu
} = useDashboard()

// No need to manually call fetchMenu anymore - composable handles it automatically
const staticLinks: NavigationMenuItem[] = [{
  label: 'Phản hồi',
  icon: 'i-lucide-message-circle',
  to: 'https://github.com/nuxt-ui-pro/dashboard',
  target: '_blank'
}, {
  label: 'Hướng dẫn & trợ giúp',
  icon: 'i-lucide-info',
  to: 'https://github.com/nuxt/ui-pro',
  target: '_blank'
}]

const links = computed<NavigationMenuItem[][]>(() => {
  const menuArray = Array.isArray(menuItems.value) ? menuItems.value : []
  const staticArray = Array.isArray(staticLinks) ? staticLinks : []
  return [menuArray, staticArray]
})

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.value.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-pro/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])

// Handle cookie consent
onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'Chúng tôi sử dụng cookie để nâng cao trải nghiệm của bạn trên trang web của chúng tôi.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Chấp nhận',
      color: 'neutral',
      variant: 'ghost',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }]
  })
})

// Provide loading state and sidebar collapsed state for child components
provide('dashboardLoading', menuLoading)
provide('dashboardError', menuError)
provide('refreshDashboard', retryFetchMenu)
provide('sidebarCollapsed', sidebarCollapsed)
</script>

<template>
  <!-- Offline Banner -->
  <div v-if="isOffline" class="bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium fixed top-0 left-0 right-0 z-50">
    ⚠️ Chế độ offline - Một số tính năng có thể bị hạn chế
    <span v-if="connectionQuality !== 'unknown'" class="ml-2 opacity-75">
      ({{ connectionQuality === 'poor' ? 'Kết nối yếu' : connectionQuality === 'slow' ? 'Kết nối chậm' : 'Kết nối tốt' }})
    </span>
  </div>
  
  <!-- Connection Status Info -->
  <div v-if="isOnline && connectionQuality !== 'unknown'" class="bg-blue-500 text-white px-4 py-1 text-center text-xs fixed top-0 right-4 z-40 rounded-b-md">
    📶 {{ connectionQuality === 'excellent' ? '4G' : connectionQuality === 'good' ? '3G' : connectionQuality === 'poor' ? '2G' : 'Chậm' }}
  </div>

  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <CustomNavigationMenu
          :items="links[0] || []"
          :collapsed="collapsed"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1] || []"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" placeholder="Tìm kiếm..." />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
