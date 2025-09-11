<script setup lang="ts">
import { computed } from 'vue'

type Size = 'sm' | 'md' | 'lg'
type Color = 'primary' | 'gray'

const props = withDefaults(defineProps<{
  modelValue: unknown
  value: unknown
  name?: string
  label?: string
  description?: string
  disabled?: boolean
  invalid?: boolean
  size?: Size
  color?: Color
}>(), {
  size: 'md',
  color: 'primary',
  disabled: false,
  invalid: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void
}>()

const isChecked = computed(() => props.modelValue === props.value)

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return { outer: 'w-4 h-4', dot: 'w-2 h-2' }
    case 'lg':
      return { outer: 'w-6 h-6', dot: 'w-3 h-3' }
    default:
      return { outer: 'w-5 h-5', dot: 'w-2.5 h-2.5' }
  }
})

const colorClasses = computed(() => {
  if (props.invalid) {
    return {
      border: 'border-red-400',
      ring: 'peer-focus-visible:ring-red-500',
      dot: 'bg-red-500'
    }
  }
  if (props.color === 'gray') {
    return {
      border: isChecked.value ? 'border-gray-700' : 'border-gray-300',
      ring: 'peer-focus-visible:ring-gray-400',
      dot: 'bg-gray-700'
    }
  }
  // primary
  return {
    border: isChecked.value ? 'border-primary-600' : 'border-gray-300',
    ring: 'peer-focus-visible:ring-primary-500',
    dot: 'bg-primary-600'
  }
})

function onChange() {
  if (props.disabled) return
  emit('update:modelValue', props.value)
}
</script>

<template>
  <label :class="['inline-flex items-start gap-3 select-none', disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer']">
    <input
      class="peer sr-only"
      type="radio"
      :name="name"
      :value="value as any"
      :checked="isChecked"
      :disabled="disabled"
      @change="onChange"
    >
    <span
      :class="[
        'mt-0.5 inline-flex items-center justify-center rounded-full border transition focus:outline-none',
        sizeClasses.outer,
        colorClasses.border,
        colorClasses.ring,
        disabled ? '' : 'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2'
      ]"
      aria-hidden="true"
    >
      <span
        :class="[
          'rounded-full transform transition duration-150 ease-out',
          sizeClasses.dot,
          isChecked ? 'scale-100' : 'scale-0',
          colorClasses.dot
        ]"
      />
    </span>
    <span class="text-sm leading-5">
      <slot>{{ label }}</slot>
      <span v-if="description" class="block text-xs text-gray-500">{{ description }}</span>
    </span>
  </label>
</template>
