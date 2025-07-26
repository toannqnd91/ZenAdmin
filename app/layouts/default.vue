<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { DashboardMenuResponse } from '~/types/dashboard'
import { API_ENDPOINTS } from '~/utils/api'

const { userInfo } = useAuth()
const userRoles = computed(() => userInfo.value?.role)

// in ra các quyền của người dùng
watch(userRoles, (val) => {
  console.log('User roles:', val)
}, { immediate: true })


const route = useRoute()
const toast = useToast()

const open = ref(false)

const { data: menuRes } = await useApiFetch<DashboardMenuResponse>(API_ENDPOINTS.dashboardMenu, {
  default: () => ({ code: '', success: false, message: '', data: [] })
})

const menuItems = computed<NavigationMenuItem[]>(() =>
  (menuRes.value.data || []).map(item => ({
    label: item.name,
    icon: item.icon || undefined,
    to: item.url,
    exact: false,
    onSelect: () => {
      open.value = false
    },
    children: item.children?.map(child => ({
      label: child.name,
      icon: child.icon || undefined,
      to: child.url,
      exact: false
    })) || undefined
  }))
)

// in ra kết quả call API
watch(menuRes, (val) => {
  console.log('API Response:', val)
}, { immediate: true, deep: true })


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
      variant: 'ghost'
    }]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0] || []"
          orientation="vertical"
          tooltip
          popover
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