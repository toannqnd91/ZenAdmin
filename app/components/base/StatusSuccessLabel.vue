<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label?: string
  pill?: boolean
}>(), {
  pill: false
})

const wrapperClass = computed(() => props.pill
  ? 'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'
  : 'inline-flex items-center gap-2 text-emerald-700')
</script>

<template>
  <span :class="wrapperClass">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      focusable="false"
      aria-hidden="true"
      class="w-5 h-5"
    >
      <path
        fill="#fff"
        stroke="#CFF6E7"
        stroke-width="4"
        d="M12 22c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10Z"
      />
      <path
        fill="#0DB473"
        fill-rule="evenodd"
        d="M4 12c0-4.416 3.584-8 8-8s8 3.584 8 8-3.584 8-8 8-8-3.584-8-8m6.4 1.736 5.272-5.272 1.128 1.136-6.4 6.4-3.2-3.2 1.128-1.128z"
        clip-rule="evenodd"
      />
    </svg>
    <slot>{{ props.label }}</slot>
  </span>
<!-- eslint-enable -->
</template>
