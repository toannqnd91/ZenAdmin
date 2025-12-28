<script setup lang="ts">
interface Tab {
    id: number
    label: string
}

interface Props {
    searchQuery: string
    tabs: Tab[]
    activeTabId: number
    canScrollLeft: boolean
    canScrollRight: boolean
    isOnline: boolean
    selectedBranch: string
    branches: string[]
}

interface Emits {
    (e: 'update:searchQuery', value: string): void
    (e: 'update:isOnline', value: boolean): void
    (e: 'update:selectedBranch', value: string): void
    (e: 'setActiveTab', id: number): void
    (e: 'addTab'): void
    (e: 'closeTab', id: number): void
    (e: 'scrollTabs', direction: 'left' | 'right'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tabsContainer = ref<HTMLElement | null>(null)
const showBranchMenu = ref(false)

// Internal scroll state
const internalCanScrollLeft = ref(false)
const internalCanScrollRight = ref(false)
let resizeObserver: ResizeObserver | null = null

// Use internal state as primary source of truth for buttons
const canScrollLeftComputed = computed(() => internalCanScrollLeft.value)
const canScrollRightComputed = computed(() => internalCanScrollRight.value)

function updateScrollButtons() {
    if (!tabsContainer.value) return

    const container = tabsContainer.value
    const { scrollLeft, scrollWidth, clientWidth } = container

    // Allow small tolerance for floating point calculations (1px)
    const maxScroll = Math.max(0, scrollWidth - clientWidth)

    internalCanScrollLeft.value = scrollLeft > 1
    internalCanScrollRight.value = scrollLeft < maxScroll - 1

    // Debug log to ensure logic works
    // console.log('Scroll Update:', { scrollLeft, maxScroll, canLeft: internalCanScrollLeft.value, canRight: internalCanScrollRight.value })
}

function handleScrollTabs(direction: 'left' | 'right') {
    if (!tabsContainer.value) return

    const container = tabsContainer.value
    const tabSize = 120 // width approx + gap
    const currentScroll = container.scrollLeft

    const targetScroll = direction === 'left'
        ? Math.max(0, currentScroll - tabSize)
        : Math.min(container.scrollWidth, currentScroll + tabSize)

    container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
    })

    // Emit event if parent needs to know
    emit('scrollTabs', direction)

    // Debounce status update
    setTimeout(updateScrollButtons, 50)
    setTimeout(updateScrollButtons, 350)
}

onMounted(() => {
    if (tabsContainer.value) {
        const container = tabsContainer.value

        // Listen to scroll events
        container.addEventListener('scroll', updateScrollButtons)

        // Listen to resize events (robust detection)
        resizeObserver = new ResizeObserver(() => {
            updateScrollButtons()
        })
        resizeObserver.observe(container)

        // Initial check with delays to ensure DOM is ready
        updateScrollButtons()
        setTimeout(updateScrollButtons, 100)
        setTimeout(updateScrollButtons, 500)
    }
})

onUnmounted(() => {
    if (tabsContainer.value) {
        tabsContainer.value.removeEventListener('scroll', updateScrollButtons)
    }
    if (resizeObserver) {
        resizeObserver.disconnect()
    }
})

// Watch tabs length to update scroll buttons
watch(() => props.tabs.length, () => {
    nextTick(() => {
        setTimeout(updateScrollButtons, 100)
    })
})

defineExpose({
    tabsContainer
})
</script>

<template>
    <header class="h-14 bg-slate-900 text-white flex items-center px-4 gap-4 shadow-md z-20 shrink-0">
        <!-- Logo Area -->
        <div class="flex items-center gap-3 cursor-pointer" @click="navigateTo('/')">
            <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg shadow-inner">
                Z
            </div>
            <span class="font-semibold text-lg tracking-tight hidden md:inline-block opacity-90">ZenPOS</span>
        </div>

        <!-- Search Bar -->
        <div class="flex-1 max-w-md mx-auto relative group">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input :value="searchQuery" @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
                type="text" placeholder="Tìm kiếm sản phẩm (F3)"
                class="block w-full h-10 pl-10 pr-4 rounded-md border-0 bg-slate-800 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 transition-all text-sm" />
            <div class="absolute inset-y-0 right-2 flex items-center">
                <kbd
                    class="hidden sm:inline-block px-1.5 py-0.5 rounded border border-slate-600 bg-slate-700 text-xs text-slate-400 font-mono">F3</kbd>
            </div>
        </div>

        <!-- Tab Navigation -->
        <!-- Tab Navigation -->
        <div class="flex-1 max-w-md flex items-center gap-1 relative overflow-hidden pr-9 justify-end">
            <!-- Left Arrow (Overlay) -->
            <button v-show="canScrollLeftComputed" type="button" @click.stop="handleScrollTabs('left')"
                class="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-6 flex items-center justify-center rounded-r bg-slate-900/90 shadow-md text-slate-200 hover:text-white transition-all z-20 backdrop-blur-sm"
                title="Cuộn trái">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <!-- Tabs Container -->
            <div ref="tabsContainer"
                class="flex items-center gap-1 overflow-x-auto no-scrollbar w-auto max-w-full scroll-smooth px-1 h-full">
                <div v-for="tab in tabs" :key="tab.id" @click="$emit('setActiveTab', tab.id)"
                    class="relative group flex items-center h-8 px-2.5 min-w-[85px] max-w-[120px] justify-between rounded-t-lg cursor-pointer transition-all select-none shrink-0"
                    :class="activeTabId === tab.id ? 'bg-slate-100 text-slate-900 border-t-2 border-blue-600' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'">
                    <span class="text-xs font-medium truncate flex-1">{{ tab.label }}</span>
                    <button v-if="tabs.length > 1" @click.stop="$emit('closeTab', tab.id)"
                        class="ml-1.5 p-0.5 rounded-full hover:bg-slate-300/20 text-slate-400 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity">
                        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Right Arrow (Overlay) -->
            <button v-show="canScrollRightComputed" type="button" @click.stop="handleScrollTabs('right')"
                class="absolute right-9 top-1/2 -translate-y-1/2 h-8 w-6 flex items-center justify-center rounded-l bg-slate-900/90 shadow-md text-slate-200 hover:text-white transition-all z-20 backdrop-blur-sm"
                title="Cuộn phải">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
            </button>

            <!-- Add Tab Button (Absolute Fixed Right) -->
            <button @click="$emit('addTab')"
                class="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0 z-10"
                title="Thêm đơn hàng mới">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div>


        <!-- Online/Offline Toggle -->
        <button @click="$emit('update:isOnline', !isOnline)"
            class="hidden lg:flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-800 transition-all relative group"
            :class="isOnline ? 'text-emerald-400' : 'text-slate-500'"
            :title="isOnline ? 'Hệ thống đang Online' : 'Hệ thống đang Offline'">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            <span v-if="isOnline"
                class="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
        </button>

        <!-- User Info & Branch Selector -->
        <div class="flex items-center gap-3 border-l border-slate-700 pl-4 ml-2 relative">
            <div class="flex flex-col items-end text-xs cursor-pointer select-none"
                @click="showBranchMenu = !showBranchMenu">
                <div class="flex items-center gap-1 text-slate-200 hover:text-white transition-colors">
                    <span class="font-medium">{{ selectedBranch }}</span>
                    <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                <span class="text-slate-400">Quản trị viên</span>
            </div>

            <!-- Branch Dropdown -->
            <div v-if="showBranchMenu"
                class="absolute top-full right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 text-slate-800 animate-fade-in-up">
                <div class="py-1">
                    <button v-for="branch in branches" :key="branch"
                        @click="$emit('update:selectedBranch', branch); showBranchMenu = false"
                        class="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between"
                        :class="selectedBranch === branch ? 'text-blue-600 font-medium bg-blue-50' : 'text-slate-700'">
                        {{ branch }}
                        <svg v-if="selectedBranch === branch" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Close Dropdown Overlay -->
            <div v-if="showBranchMenu" @click="showBranchMenu = false"
                class="fixed inset-0 z-40 bg-transparent cursor-default">
            </div>

            <div
                class="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-slate-800">
                <span class="text-white font-bold text-xs">AD</span>
            </div>
        </div>
    </header>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
    display: none;
}

.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
