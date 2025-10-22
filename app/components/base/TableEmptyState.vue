<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  actionLabel?: string
  actionIcon?: string
}
const props = withDefaults(defineProps<Props>(), {
  title: 'Chưa có dữ liệu',
  description: 'Hiện chưa có bản ghi nào để hiển thị',
  actionLabel: '',
  actionIcon: 'i-lucide-plus'
})
const emit = defineEmits<{ (e: 'action'): void }>()
</script>

<template>
  <div class="w-full py-16 px-6 flex items-center justify-center">
    <div class="text-center">
      <div class="mx-auto w-16 h-16 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
        <!-- Inline SVG icon for empty state (inbox) -->
        <svg
          class="w-7 h-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M22 12h-6l-2 3h-4l-2-3H2" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 3H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      </div>
      <div class="mt-4 text-gray-900 text-base font-semibold">
        {{ props.title }}
      </div>
      <div class="mt-1 text-gray-500 text-sm">
        {{ props.description }}
      </div>
      <div v-if="props.actionLabel" class="mt-4">
        <UButton
          :label="props.actionLabel"
          color="primary"
          :icon="props.actionIcon"
          @click="emit('action')"
        />
      </div>
    </div>
  </div>
</template>
