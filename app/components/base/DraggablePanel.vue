<script setup lang="ts">
/**
 * DraggablePanel.vue
 * A reusable floating panel component that supports drag-and-drop integration.
 * Perfect for Properties panels, Toolbars, or Floating Settings.
 */

const props = defineProps({
  title: {
    type: String,
    default: 'Properties'
  },
  width: {
    type: String,
    default: '320px'
  },
  initialRight: {
    type: Number,
    default: 20
  },
  initialTop: {
    type: Number,
    default: 80
  },
  minimizable: {
    type: Boolean,
    default: true
  },
  closable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const el = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)
const isMinimized = ref(false)

// Position state
const x = ref(0)
const y = ref(0)

const { style } = useDraggable(el, {
  initialValue: { x, y },
  handle: handle,
  preventDefault: true
})

onMounted(() => {
  // Calculate initial position relative to right edge
  // We use window.innerWidth to ensure it sticks to the right initially
  const w = parseInt(props.width) || 320
  x.value = window.innerWidth - w - props.initialRight
  y.value = props.initialTop
})

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}
</script>

<template>
  <div 
    ref="el" 
    :style="[style, { width: width }]" 
    class="fixed z-[100] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-200"
    :class="{ 'h-auto': !isMinimized, 'h-11 overflow-hidden': isMinimized }"
  >
    <!-- Header (Draggable Handle) -->
    <div 
      ref="handle" 
      class="cursor-move px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-t-lg select-none group"
      @dblclick="toggleMinimize"
    >
       <div class="flex items-center gap-2">
         <UIcon name="i-lucide-grip-vertical" class="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
         <span class="font-semibold text-sm text-gray-700 dark:text-gray-200 tracking-tight">
           {{ title }}
         </span>
       </div>

       <!-- Window Controls -->
       <div class="flex items-center gap-1">
          <!-- Custom controls slot -->
          <slot name="controls" />

          <UButton 
            v-if="minimizable"
            color="neutral" 
            variant="ghost" 
            size="2xs" 
            square
            :icon="isMinimized ? 'i-lucide-maximize-2' : 'i-lucide-minus'" 
            class="opacity-0 group-hover:opacity-100 transition-opacity"
            @click="toggleMinimize" 
          >
            <UIcon :name="isMinimized ? 'i-lucide-chevron-down' : 'i-lucide-minus'" class="w-3.5 h-3.5" />
          </UButton>
          
          <UButton 
            v-if="closable"
            color="neutral" 
            variant="ghost" 
            size="2xs" 
            square
            class="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
            @click="emit('close')"
          >
            <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
          </UButton>
       </div>
    </div>
    
    <!-- Content -->
    <div v-show="!isMinimized" class="flex-1 overflow-y-auto max-h-[calc(100vh-150px)] custom-scrollbar bg-white dark:bg-gray-900">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 20px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #374151;
}
</style>
