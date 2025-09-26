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
  <div class="relative">
    <USelect
      v-model="model"
      :items="uiPeriods"
      variant="ghost"
      class="data-[state=open]:bg-elevated pr-6"
      :ui="{ value: 'pr-1', itemLabel: 'none', trailingIcon: (uiPeriods.length > 0 && model !== (uiPeriods[0]?.value)) ? 'opacity-0 w-0' : 'ml-1 group-data-[state=open]:rotate-180 transition-transform duration-200' }"
    />
    <button
      v-if="uiPeriods.length > 0 && model !== (uiPeriods[0]?.value)"
      type="button"
      class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-sm hover:bg-gray-100 transition"
      :title="'Đặt lại'"
      @click="model = uiPeriods[0]?.value || model"
    >
      <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
    </button>
  </div>
</template>
