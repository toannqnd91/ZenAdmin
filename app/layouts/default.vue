<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { userInfo } = useAuth()
const userRoles = computed(() => userInfo.value?.role)

// in ra các quyền của người dùng
watch(userRoles, (val) => {
  console.log('User roles:', val)
}, { immediate: true })

const route = useRoute()
const toast = useToast()

const open = ref(false)

const links = [[{
  label: 'Trang chủ',
  icon: 'i-lucide-home',
  to: '/',
  exact: false,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Đăng ký xét tuyển',
  icon: 'i-lucide-file-text',
  to: '/dang-ky-xet-tuyen',
  exact: false,
  onSelect: () => {
    open.value = false
  }
},{
  label: 'Đăng ký học bổng',
  icon: 'i-lucide-award',
  to: '/dang-ky-hoc-bong',
  exact: false,
  // badge: '4',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Kết quả xét tuyển',
  icon: 'i-lucide-check-circle',
  to: '/ket-qua-xet-tuyen',
  exact: false,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Nhập học',
  icon: 'i-lucide-graduation-cap',
  to: '/nhap-hoc',
  exact: false,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Thanh toán',
  icon: 'i-lucide-credit-card',
  to: '/thanh-toan',
  exact: false,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Khảo sát',
  icon: 'i-lucide-clipboard-list',
  to: '/khao-sat',
  exact: false,
  onSelect: () => {
    open.value = false
  }
}], [{
  label: 'Phản hồi',
  icon: 'i-lucide-message-circle',
  to: 'https://github.com/nuxt-ui-pro/dashboard',
  target: '_blank'
}, {
  label: 'Hướng dẫn & trợ giúp',
  icon: 'i-lucide-info',
  to: 'https://github.com/nuxt/ui-pro',
  target: '_blank'
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
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
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Từ chối',
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
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
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
