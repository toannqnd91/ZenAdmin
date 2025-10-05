<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'

interface Props {
  modelValue?: boolean
  title?: string
  widthClass?: string // allow overriding max width (default max-w-3xl)
  closeOnOverlay?: boolean
  escToClose?: boolean
  bodyClass?: string
  hideHeader?: boolean
  hideFooter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '',
  widthClass: 'max-w-3xl',
  closeOnOverlay: true,
  escToClose: true,
  bodyClass: 'px-6 py-5 space-y-8 text-sm',
  hideHeader: false,
  hideFooter: false
})
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

function close() {
  open.value = false
  emit('close')
}

function onKey(e: KeyboardEvent) {
  if (!props.escToClose) return
  if (e.key === 'Escape') {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4"
      @click="() => { if (closeOnOverlay) close() }"
    >
      <div
        class="bg-white w-full rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]"
        :class="widthClass"
        role="dialog"
        aria-modal="true"
        @click.stop
      >
        <!-- Header -->
        <div
          v-if="!hideHeader"
          class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0"
        >
          <h3 v-if="title" class="text-lg font-semibold leading-none">
            <slot name="title">
              {{ title }}
            </slot>
          </h3>
          <slot name="header-actions">
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600"
              @click="close"
            >
              &times;
            </button>
          </slot>
        </div>
        <!-- Body -->
        <div class="flex-1 overflow-y-auto modal-body-scroll" :class="bodyClass">
          <slot />
        </div>
        <!-- Footer -->
        <div
          v-if="!hideFooter"
          class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0"
        >
          <slot name="footer">
            <button
              type="button"
              class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
              @click="close"
            >
              Đóng
            </button>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-body-scroll { -webkit-overflow-scrolling: touch; }
.modal-body-scroll::-webkit-scrollbar { width: 8px; }
.modal-body-scroll::-webkit-scrollbar-track { background: transparent; }
.modal-body-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
.modal-body-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>
