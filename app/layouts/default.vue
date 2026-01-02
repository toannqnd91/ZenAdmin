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

// Print out the user's roles
watch(userRoles, (val) => {
}, { immediate: true })

const isDev = import.meta.dev
const isDevMenuOpen = ref(false)

const createSampleProduct = () => {
  toast.add({ title: 'Đang tạo sản phẩm mẫu...', color: 'info' })
  setTimeout(() => toast.add({ title: 'Đã tạo sản phẩm mẫu thành công', color: 'success' }), 1000)
  isDevMenuOpen.value = false
}

const resetData = () => {
  if (!confirm('Bạn có chắc chắn muốn reset toàn bộ dữ liệu?')) return
  toast.add({ title: 'Đang reset dữ liệu...', color: 'warning' })
  setTimeout(() => toast.add({ title: 'Reset dữ liệu thành công', color: 'success' }), 1500)
  isDevMenuOpen.value = false
}

// Draggable bubble logic
const devBubbleRef = ref<HTMLElement | null>(null)
const devButtonRef = ref<HTMLElement | null>(null)
const dragStart = ref({ x: 0, y: 0 })

const { style: bubbleStyle, x, y, isDragging } = useDraggable(devBubbleRef, {
  handle: devButtonRef,
  initialValue: { x: 0, y: 0 },
  onStart: () => {
    dragStart.value = { x: x.value, y: y.value }
  }
})

function onToggleDevMenu() {
  // If moved more than 3 pixels, consider it a drag and don't toggle
  if (Math.abs(x.value - dragStart.value.x) > 3 || Math.abs(y.value - dragStart.value.y) > 3) {
    return
  }
  isDevMenuOpen.value = !isDevMenuOpen.value
}

// Chat logic
interface ChatMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

const chatContainerRef = ref<HTMLElement | null>(null)
const chatInput = ref('')
const isChatLoading = ref(false)
const chatMessages = ref<ChatMessage[]>([
  { role: 'model', parts: [{ text: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?' }] }
])

async function sendMessage() {
  if (!chatInput.value.trim() || isChatLoading.value) return

  const userText = chatInput.value.trim()
  chatMessages.value.push({ role: 'user', parts: [{ text: userText }] })
  chatInput.value = ''
  isChatLoading.value = true

  nextTick(() => scrollToBottom())

  try {
    const history = chatMessages.value.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.parts[0]?.text || '' }]
    }))

    const res = await $fetch<{ text: string }>('/api/gemini', {
      method: 'POST',
      body: { history }
    })

    chatMessages.value.push({ role: 'model', parts: [{ text: res.text }] })
  } catch (e: any) {
    chatMessages.value.push({ role: 'model', parts: [{ text: 'Có lỗi xảy ra khi kết nối với AI.' }] })
  } finally {
    isChatLoading.value = false
    nextTick(() => scrollToBottom())
  }
}

function scrollToBottom() {
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
  }
}

onMounted(() => {
  // Set initial position to bottom-right corner
  if (import.meta.client) {
    x.value = window.innerWidth - 80
    y.value = window.innerHeight - 80
  }
})

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

const salesLinks: NavigationMenuItem[] = [{
  label: 'Website',
  icon: 'i-lucide-globe',
  to: '/sales/website'
}, {
  label: 'POS',
  icon: 'i-lucide-store',
  to: '/pos'
}]

const appLinks: NavigationMenuItem[] = [{
  label: 'Chat đa kênh',
  icon: 'i-lucide-bot',
  to: '/apps/chat-ai'
}, {
  label: 'Trợ lý AI',
  icon: 'i-lucide-sparkles',
  to: '/apps/ai-assistant'
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
  <div v-if="isOffline"
    class="bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium fixed top-0 left-0 right-0 z-50">
    ⚠️ Chế độ offline - Một số tính năng có thể bị hạn chế
    <span v-if="connectionQuality !== 'unknown'" class="ml-2 opacity-75">
      ({{ connectionQuality === 'poor' ? 'Kết nối yếu' : connectionQuality === 'slow' ? 'Kết nối chậm' : 'Kết nối tốt'
      }})
    </span>
  </div>

  <!-- Connection Status Info -->
  <!-- <div v-if="isOnline && connectionQuality !== 'unknown'" class="bg-blue-500 text-white px-4 py-1 text-center text-xs fixed top-0 right-4 z-40 rounded-b-md">
    📶 {{ connectionQuality === 'excellent' ? '4G' : connectionQuality === 'good' ? '3G' : connectionQuality === 'poor' ? '2G' : 'Chậm' }}
  </div> -->

  <UDashboardGroup unit="rem">
    <UDashboardSidebar id="default" v-model:open="open" collapsible resizable
      :ui="{ footer: 'lg:border-t lg:border-default' }">
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <CustomNavigationMenu :items="links[0] || []" :collapsed="collapsed" />

        <!-- KÊNH BÁN HÀNG -->
        <template v-if="!collapsed">
          <div class="px-3 mt-0 mb-0 flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">Kênh bán hàng</span>
            <UIcon name="i-lucide-plus-circle"
              class="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" />
          </div>
        </template>
        <div v-else class="my-0 h-px bg-gray-200 dark:bg-gray-800 mx-4" />

        <CustomNavigationMenu :items="salesLinks" :collapsed="collapsed" />

        <!-- ỨNG DỤNG -->
        <template v-if="!collapsed">
          <div class="px-3 mt-0 mb-0 flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">Ứng dụng</span>
            <UIcon name="i-lucide-plus-circle"
              class="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" />
          </div>
        </template>
        <div v-else class="my-0 h-px bg-gray-200 dark:bg-gray-800 mx-4" />

        <CustomNavigationMenu :items="appLinks" :collapsed="collapsed" />

        <UNavigationMenu :collapsed="collapsed" :items="links[1] || []" orientation="vertical" tooltip
          class="mt-auto" />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" placeholder="Tìm kiếm..." />

    <slot />

    <NotificationsSlideover />

    <!-- AI Assistant Bubble -->
    <div ref="devBubbleRef" :style="bubbleStyle" class="fixed z-50 w-12 h-12 pointer-events-none">
      <div v-if="isDevMenuOpen"
        class="absolute bottom-14 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 w-80 h-96 pointer-events-auto origin-bottom-right transition-all flex flex-col overflow-hidden">
        <!-- Chat Header -->
        <div class="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 class="font-semibold text-gray-700">AI Assistant</h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-maximize-2" size="xs" />
        </div>

        <!-- Chat Messages -->
        <div ref="chatContainerRef" class="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-4">
          <div v-for="(msg, idx) in chatMessages" :key="idx" class="flex gap-2"
            :class="{ 'flex-row-reverse': msg.role === 'user' }">
            <div v-if="msg.role === 'model'"
              class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-bot" class="w-5 h-5 text-blue-600" />
            </div>
            <div v-else class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-user" class="w-5 h-5 text-gray-600" />
            </div>

            <div class="p-3 shadow-sm text-sm border max-w-[80%]" :class="[
              msg.role === 'user' ? 'bg-primary-600 text-white rounded-l-lg rounded-br-lg border-primary-600' : 'bg-white text-gray-600 rounded-r-lg rounded-bl-lg border-gray-100'
            ]">
              {{ msg.parts[0].text }}
            </div>
          </div>
          <div v-if="isChatLoading" class="flex gap-2">
            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-bot" class="w-5 h-5 text-blue-600" />
            </div>
            <div
              class="bg-white p-3 rounded-r-lg rounded-bl-lg shadow-sm text-sm text-gray-500 border border-gray-100 italic">
              Đang suy nghĩ...
            </div>
          </div>
        </div>

        <!-- Chat Input -->
        <div class="p-3 bg-white border-t border-gray-200">
          <div class="relative">
            <input v-model="chatInput" @keydown.enter="sendMessage" :disabled="isChatLoading" type="text"
              placeholder="Nhập tin nhắn..."
              class="w-full pl-4 pr-10 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100" />
            <button @click="sendMessage" :disabled="isChatLoading || !chatInput.trim()"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary-600 hover:bg-primary-50 rounded-full disabled:opacity-50">
              <UIcon name="i-lucide-send" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <button ref="devButtonRef"
        class="h-12 w-12 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors pointer-events-auto cursor-move"
        @click="onToggleDevMenu" title="AI Assistant (Drag to move)">
        <UIcon v-if="!isDevMenuOpen" name="i-lucide-sparkles" class="w-6 h-6" />
        <UIcon v-else name="i-lucide-x" class="w-6 h-6" />
      </button>
    </div>

    <!-- Dev Box Bottom Center -->
    <div v-if="isDev" class="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 group flex flex-col items-center">
      <!-- Expanded Menu (Show on Hover) -->
      <div
        class="mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 w-64 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
        <div class="flex flex-col gap-1">
          <button
            class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md w-full text-left"
            @click="createSampleProduct">
            <UIcon name="i-lucide-package-plus" class="w-4 h-4" />
            Tạo sản phẩm mẫu
          </button>
          <button
            class="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md w-full text-left"
            @click="resetData">
            <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
            Xoá tất cả dữ liệu
          </button>
        </div>
      </div>

      <!-- Status Bar -->
      <div
        class="bg-gray-900 text-white text-xs px-3 py-1 rounded-t-lg shadow-lg flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity cursor-default">
        <span class="font-bold">DEV BOX</span>
        <span class="w-px h-3 bg-gray-700"></span>
        <span>Version 1.0</span>
        <span class="w-px h-3 bg-gray-700"></span>
        <span>{{ route.name }}</span>
      </div>
    </div>
  </UDashboardGroup>
</template>
