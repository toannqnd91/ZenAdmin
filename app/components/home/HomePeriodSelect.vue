<script setup lang="ts">
import { eachDayOfInterval } from 'date-fns'
// removed Period/Range types because they're not exported from ~/types in this workspace

const model = defineModel<string>({ required: true })

const props = defineProps({
  range: { type: Object, required: true }
})

const days = computed(() => {
  const maybeRange = props.range
  // runtime guard: ensure range has start/end
  const mr = maybeRange as Record<string, unknown>
  if (!mr || typeof mr !== 'object' || !('start' in mr) || !('end' in mr)) return []
  return eachDayOfInterval({ start: mr['start'] as Date, end: mr['end'] as Date })
})

const periods = computed(() => {
  if (days.value.length <= 8) {
    return [
      'daily'
    ]
  }

  if (days.value.length <= 31) {
    return [
      'daily',
      'weekly'
    ]
  }

  return [
    'weekly',
    'monthly'
  ]
})

// Provide localized labels for the UI component. USelect accepts either strings or
// { label, value } objects; map periods to Vietnamese where needed.
const uiPeriods = computed(() => {
  return periods.value.map((p) => {
    if (p === 'daily') return { label: 'Hàng ngày', value: p }
    if (p === 'weekly') return { label: 'Hàng tuần', value: p }
    if (p === 'monthly') return { label: 'Hàng tháng', value: p }
    return { label: String(p), value: p }
  })
})

// Ensure the model value is always a valid period
watch(periods, () => {
  if (!periods.value.includes(model.value as string)) {
    model.value = periods.value[0] ?? 'daily'
  }
})
</script>

<template>
  <USelect
    v-model="model"
    :items="uiPeriods"
    variant="ghost"
    class="data-[state=open]:bg-elevated"
    :ui="{ value: 'none', itemLabel: 'none', trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
  />
</template>
