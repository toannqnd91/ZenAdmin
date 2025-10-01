<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    focusable="false"
    aria-hidden="true"
    :class="['w-4 h-4', props.class]"
  >
    <path
      fill="currentColor"
      d="M20.895 7.319a2.52 2.52 0 0 0-.744-1.797l-1.349-1.35a2.54 2.54 0 0 0-3.594 0l-11.402 11.46a.7.7 0 0 0-.202.488l-.354 4.261a.69.69 0 0 0 .692.692l4.262-.353a.7.7 0 0 0 .488-.202l11.455-11.403a2.52 2.52 0 0 0 .748-1.796m-12.978 12.016-3.283.354.354-3.283 8.3-8.34 2.969 2.969zm11.254-11.201-1.933 1.925-2.974-2.974 1.925-1.932a1.14 1.14 0 0 1 .816-.34 1.15 1.15 0 0 1 .817.338l1.35 1.35a1.153 1.153 0 0 1-.002 1.633m2.077 12.247a.69.69 0 0 1-.692.692h-7.46a.692.692 0 1 1 0-1.384h7.46a.69.69 0 0 1 .692.692"
    />
  </svg>
</template>

<script setup lang="ts">
interface Props { class?: string }
const props = defineProps<Props>()
</script>
