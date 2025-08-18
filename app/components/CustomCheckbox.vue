<template>
  <label :class="['inline-flex items-center cursor-pointer select-none', disabled ? 'opacity-60 pointer-events-none' : '']">
    <span class="relative flex items-center justify-center">
      <input
        ref="checkboxRef"
        type="checkbox"
        class="peer appearance-none w-5 h-5 border border-gray-300 rounded-md bg-white checked:bg-primary-600 checked:border-primary-600 focus:ring-2 focus:ring-primary-200 transition-all duration-150 outline-none"
        :checked="modelValue"
        :disabled="disabled"
        @change="(e) => $emit('update:modelValue', (e.target as HTMLInputElement)?.checked)"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
      >
      <span
        class="pointer-events-none absolute left-0 top-0 w-5 h-5 flex items-center justify-center"
      >
        <template v-if="indeterminate">
          <span class="indeterminate-box" />
        </template>
        <svg
          v-else-if="modelValue"
          class="w-4 h-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="3"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    </span>
    <span class="ml-2"><slot /></span>
  </label>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  modelValue: boolean
  disabled?: boolean
  indeterminate?: boolean
}>()
defineEmits(['update:modelValue', 'focus', 'blur'])
const checkboxRef = ref<HTMLInputElement | null>(null)
onMounted(() => {
  if (checkboxRef.value) checkboxRef.value.indeterminate = !!props.indeterminate
})
watch(() => props.indeterminate, (val) => {
  if (checkboxRef.value) checkboxRef.value.indeterminate = !!val
})
</script>

<style scoped>
input[type="checkbox"].peer:checked {
  background-color: #2563eb;
  border-color: #2563eb;
}
.indeterminate-box {
  width: 20px;
  height: 20px;
  background: #2563eb;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 0;
  top: 0;
}
.indeterminate-box:after {
  content: '';
  display: block;
  width: 12px;
  height: 3px;
  background: #fff;
  border-radius: 2px;
  margin: auto;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
