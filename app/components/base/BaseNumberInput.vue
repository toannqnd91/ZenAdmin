<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: number | null | undefined
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  allowDecimal?: boolean
  decimalDigits?: number
  groupSeparator?: string
  decimalSeparator?: string
}>(), {
  allowDecimal: false,
  decimalDigits: 2,
  groupSeparator: ',',
  decimalSeparator: '.'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
  (e: 'blur' | 'focus', ev: FocusEvent): void
  (e: 'input', ev: Event): void
}>()

const display = ref<string>('')

const format = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(Number(val))) return ''
  const num = Number(val)
  const group = props.groupSeparator || '.'
  const dec = props.decimalSeparator || ','
  const abs = Math.abs(num)
  const parts = String(abs).split('.')
  const intRaw = (parts[0] ?? '0')
  const fracRaw = (parts[1] ?? '')
  const intPart = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, group)
  if (!props.allowDecimal) return intPart
  const trimmedFrac = (fracRaw || '').replace(/0+$/g, '').slice(0, props.decimalDigits)
  return trimmedFrac ? `${intPart}${dec}${trimmedFrac}` : intPart
}

watch(() => props.modelValue, (nv) => {
  display.value = format(nv)
}, { immediate: true })

const parseFromText = (raw: string): number | null => {
  if (!raw) return null
  // Keep digits and at most one decimal separator
  let s = raw.replace(/[^\d.,\s-]/g, '')
  s = s.replace(/-/g, '') // no negatives for prices
  if (!props.allowDecimal) {
    // keep digits only
    const digits = s.replace(/\D/g, '')
    if (!digits) return null
    return Number(digits)
  } else {
    const group = props.groupSeparator || ','
    const dec = props.decimalSeparator || '.'
    // Remove grouping and normalize decimal to '.'
    const groupEsc = group.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    s = s.replace(new RegExp(groupEsc, 'g'), '')
    if (dec !== '.') s = s.replace(new RegExp(dec.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), '.')
    const match = s.match(/^\d*(?:\.\d*)?/)
    const cleaned = match ? match[0] : ''
    if (!cleaned) return null
    const num = Number(cleaned)
    return Number.isNaN(num) ? null : num
  }
}

const onInput = (e: Event) => {
  const t = e.target as HTMLInputElement
  const num = parseFromText(t.value)
  // Emit numeric value (fallback 0 to maintain previous behavior when field is emptied)
  emit('update:modelValue', num ?? 0)
  display.value = format(num ?? 0)
  emit('input', e)
}

const onBlur = (e: FocusEvent) => {
  display.value = format(props.modelValue ?? 0)
  emit('blur', e)
}
const onFocus = (e: FocusEvent) => {
  emit('focus', e)
}
</script>

<template>
  <input
    :value="display"
    type="text"
    inputmode="numeric"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readOnly"
    class="w-full"
    @input="onInput"
    @blur="onBlur"
    @focus="onFocus"
  >
</template>
