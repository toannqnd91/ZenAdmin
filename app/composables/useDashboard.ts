import { createSharedComposable } from '@vueuse/core'
import { dashboardService } from '@/services'
import type { DashboardMenuItem, DashboardMenuResponse } from '@/types/dashboard'
import type { NavigationMenuItem } from '@nuxt/ui'

const _useDashboard = () => {
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const isNotificationsSlideoverOpen = ref(false)

  // Dashboard menu state
  const menuData = ref<DashboardMenuResponse>({
    code: '',
    success: false,
    message: '',
    data: []
  })
  const menuLoading = ref(false)
  const menuError = ref<Error | null>(null)

  // Computed
  const menuItems = computed<NavigationMenuItem[]>(() =>
    (menuData.value?.data || []).map(item => ({
      label: item.name,
      icon: item.icon || undefined,
      to: item.url,
      exact: false,
      children: item.children?.map(child => ({
        label: child.name,
        icon: child.icon || undefined,
        to: child.url,
        exact: false
      })) || undefined
    }))
  )

  const hasMenuError = computed(() => !!menuError.value)

  // Methods
  async function fetchMenu() {
    menuLoading.value = true
    menuError.value = null

    try {
      // Check if user is authenticated first
      const { accessToken } = useAuthService()
      if (!accessToken.value) {
        throw new Error('No access token available')
      }

      const response = await dashboardService.getMenu()
      if (response.success) {
        menuData.value = response as DashboardMenuResponse
      } else {
        // If response is not successful, it might be auth related
        if (response.code === '401' || response.message.includes('unauthorized')) {
          throw new Error('Authentication required')
        }
        throw new Error(response.message)
      }
    } catch (err) {
      menuError.value = err instanceof Error ? err : new Error('Failed to fetch menu')
      console.error('Failed to fetch dashboard menu:', err)

      // Handle different error types
      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.includes('unauthorized') || err.message.includes('Authentication required')) {
          toast.add({
            title: 'Phiên đăng nhập hết hạn',
            description: 'Vui lòng đăng nhập lại',
            color: 'error',
            actions: [{
              label: 'Đăng nhập',
              onClick: () => {
                router.push('/login')
              }
            }]
          })

          // Redirect to login after a short delay
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        } else {
          toast.add({
            title: 'Lỗi',
            description: 'Không thể tải menu dashboard',
            color: 'error',
            actions: [{
              label: 'Thử lại',
              onClick: () => {
                retryFetchMenu()
              }
            }]
          })
        }
      }
    } finally {
      menuLoading.value = false
    }
  }

  async function getStats() {
    try {
      // Check auth before making request
      const { accessToken } = useAuthService()
      if (!accessToken.value) {
        throw new Error('Authentication required')
      }

      const response = await dashboardService.getStats()
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err)

      if (err instanceof Error && err.message.includes('Authentication required')) {
        router.push('/login')
      }

      throw err
    }
  }

  async function getOverview() {
    try {
      // Check auth before making request
      const { accessToken } = useAuthService()
      if (!accessToken.value) {
        throw new Error('Authentication required')
      }

      const response = await dashboardService.getOverview()
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard overview:', err)

      if (err instanceof Error && err.message.includes('Authentication required')) {
        router.push('/login')
      }

      throw err
    }
  }

  function retryFetchMenu() {
    // Clear previous error before retry
    menuError.value = null
    fetchMenu()
  }

  // Keyboard shortcuts
  defineShortcuts({
    'g-h': () => router.push('/'),
    'g-i': () => router.push('/inbox'),
    'g-c': () => router.push('/customers'),
    'g-s': () => router.push('/settings'),
    'n': () => isNotificationsSlideoverOpen.value = !isNotificationsSlideoverOpen.value
  })

  // Auto-initialize menu when composable is created
  // But only if we're authenticated
  onMounted(async () => {
    const { accessToken } = useAuthService()
    if (accessToken.value) {
      const alreadyLoaded = Array.isArray(menuData.value?.data) && menuData.value.data.length > 0
      if (!alreadyLoaded) {
        await fetchMenu()
      }
    }
  })

  // Watch for auth state changes
  watch(() => {
    try {
      const { accessToken } = useAuthService()
      return accessToken.value
    } catch {
      return null
    }
  }, async (newToken, oldToken) => {
    // If user just logged in, fetch menu
    if (newToken && !oldToken) {
      const alreadyLoaded = Array.isArray(menuData.value?.data) && menuData.value.data.length > 0
      if (!alreadyLoaded) {
        await fetchMenu()
      }
    }
    // If user logged out, clear menu data
    else if (!newToken && oldToken) {
      menuData.value = {
        code: '',
        success: false,
        message: '',
        data: []
      }
      menuError.value = null
    }
  })

  watch(() => route.fullPath, () => {
    isNotificationsSlideoverOpen.value = false
  })

  // Debug watchers in development
  if (import.meta.dev) {
    watch(menuData, (val) => {
      console.log('Dashboard menu data:', val)
    }, { immediate: true, deep: true })

    watch(menuLoading, (val) => {
      console.log('Dashboard menu loading:', val)
    })

    watch(menuError, (val) => {
      if (val) {
        console.error('Dashboard menu error:', val)
      }
    })
  }

  return {
    // Navigation state
    isNotificationsSlideoverOpen,

    // Menu state
    menuData: readonly(menuData),
    menuItems,
    menuLoading: readonly(menuLoading),
    menuError: readonly(menuError),
    hasMenuError,

    // Methods
    fetchMenu,
    getStats,
    getOverview,
    retryFetchMenu
  }
}

export const useDashboard = createSharedComposable(_useDashboard)
