<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { Bar } from 'vue-chartjs'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import { makeTickFormatter, formatTooltipValue } from '@/utils/number-format'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

interface BaseItem {
  name: string
  revenue?: number
  quantity?: number
  orders?: number
  imageUrl?: string | null
  avatarUrl?: string | null
}

interface PeriodOption {
  value: string
  label: string
}

interface Props<T extends BaseItem> {
  title: string
  items?: T[]
  loading?: boolean
  metric: 'revenue' | 'quantity' | 'orders'
  metricSelectable?: boolean
  periodSelectable?: boolean
  periods?: PeriodOption[]
  selectedPeriod?: string
}

const props = withDefaults(defineProps<Props<BaseItem>>(), {
  items: () => [],
  loading: false,
  metricSelectable: false,
  periodSelectable: false,
  periods: () => []
})

const emit = defineEmits<{
  (e: 'update:metric', value: 'revenue' | 'quantity' | 'orders'): void
  (e: 'update:period', value: string): void
  (e: 'bar-click', item: BaseItem): void
}>()

const internalMetric = ref(props.metric)
watch(
  () => props.metric,
  (v) => {
    if (v !== internalMetric.value) {
      internalMetric.value = v
    }
  }
)
watch(internalMetric, v => emit('update:metric', v))

const internalPeriod = ref(props.selectedPeriod || '')
watch(
  () => props.selectedPeriod,
  (v) => {
    if (v && v !== internalPeriod.value) {
      internalPeriod.value = v
    }
  }
)
watch(internalPeriod, v => emit('update:period', v))

// metric options and wrapper state for RemoteSearchSelect
const metricOptions = [
  { id: 'revenue', name: 'Doanh thu' },
  { id: 'quantity', name: 'Số lượng' }
]
const fetchMetrics = async () => metricOptions
interface MetricOption {
  id: string
  name: string
  [key: string]: unknown
}
type MetricKey = 'revenue' | 'quantity' | 'orders'
const selectedMetricOption = computed<MetricOption>({
  get() {
    return (metricOptions.find(o => o.id === internalMetric.value) || metricOptions[0]) as MetricOption
  },
  set(val: MetricOption) {
    if (val && ['revenue', 'quantity', 'orders'].includes(val.id)) {
      internalMetric.value = val.id as MetricKey
    }
  }
})

const chartData = computed(() => {
  const items = props.items || []
  const labels = items.map(i => i.name)
  const values = items.map(i => (i[internalMetric.value] as number | undefined) || 0)
  return {
    labels,
    datasets: [
      {
        label: '',
        data: values,
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        maxBarThickness: 24
      }
    ]
  }
})

const isMoney = computed(() => internalMetric.value === 'revenue')

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  layout: { padding: { top: 4, bottom: 4, left: 4, right: 10 } },
  scales: {
    x: {
      grid: { color: '#f1f5f9', drawBorder: false },
      ticks: {
        callback: makeTickFormatter(),
        font: { size: 11 }
      },
      border: { display: false }
    },
    y: {
      grid: { display: false },
      ticks: {
        font: { size: 11 },
        color: '#334155',
        callback: (val: unknown) => {
          const idx = Number(val)
          const label = chartData.value.labels[idx] || ''
          return label.length > 22 ? label.slice(0, 21) + '…' : label
        }
      },
      border: { display: false }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: function (ctx: { raw: unknown }) {
          const rawVal = typeof ctx.raw === 'number' ? ctx.raw : Number(ctx.raw || 0)
          return formatTooltipValue(rawVal, isMoney.value)
        },
        title: function (items: Array<{ label?: string }>) { return items[0]?.label || '' }
      },
      displayColors: false
    }
  },
  animation: { duration: 200 }
}))

interface ChartClickEvent {
  chart: ChartJS
  native: unknown
}
interface ActiveElementLike { index: number }
function onBarClick(evt: ChartClickEvent) {
  const chart = evt.chart
  const nativeEvt = evt.native as Event | undefined
  const points = nativeEvt ? chart.getElementsAtEventForMode(nativeEvt, 'nearest', { intersect: true }, true) : []
  if (!points.length) return
  const first = points[0]
  if (!first) return
  const idx = (first as unknown as ActiveElementLike).index
  const items = props.items || []
  const item = items[idx]
  if (item) emit('bar-click', item)
}
</script>

<template>
  <div class="bg-white rounded-md p-5 border border-dashed border-gray-200">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div class="font-semibold text-base">
        {{ title }}
      </div>
      <div v-if="metricSelectable || periodSelectable" class="flex items-center gap-2">
        <RemoteSearchSelect
          v-if="metricSelectable"
          v-model="selectedMetricOption"
          :fetch-fn="fetchMetrics"
          label-field="name"
          :clearable="false"
          :searchable="false"
          :full-width="false"
          placeholder="Chỉ số"
          borderless
          auto-width
        />
        <select
          v-if="periodSelectable"
          v-model="internalPeriod"
          class="text-sm border rounded px-2 py-1 bg-white focus:outline-none focus:ring"
        >
          <option
            v-for="p in periods"
            :key="p.value"
            :value="p.value"
          >
            {{ p.label }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="n in 6" :key="n" class="h-6 bg-gray-100 rounded animate-pulse" />
    </div>
    <div v-else-if="!items.length" class="text-sm text-gray-500 py-2">
      Không có dữ liệu
    </div>
    <div v-else class="h-[320px]">
      <Bar :data="chartData" :options="chartOptions" @click="onBarClick" />
    </div>
  </div>
</template>
