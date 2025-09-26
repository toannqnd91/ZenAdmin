<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import type { OverviewChartPoint } from '@/services/statistics.service'
import type { ChartOptions } from 'chart.js'
// Explicit Chart.js registration fallback (in case global plugin not loaded early enough)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  Title
} from 'chart.js'

// Idempotent registration – safe to call multiple times
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  Title
)

type MetricKey = 'revenue' | 'profit' | 'orders' | 'returns'

const props = withDefaults(defineProps<{
  points: OverviewChartPoint[]
  metrics?: MetricKey[]
  height?: number
  loading?: boolean
  lineWidth?: number
  normalize?: boolean
  showYAxis?: boolean
  yTicks?: number
  strokeJoin?: CanvasLineJoin | string
  strokeCap?: CanvasLineCap | string
  lineOpacity?: number
  miterLimit?: number
}>(), {
  metrics: () => ['revenue', 'profit'],
  height: 220,
  loading: false,
  lineWidth: 1,
  normalize: false,
  showYAxis: true,
  yTicks: 4,
  strokeJoin: 'miter',
  strokeCap: 'butt',
  lineOpacity: 0.95,
  miterLimit: 2
})

// Consistent color palette
const metricColors: Record<MetricKey, string> = {
  revenue: '#1B64F2',
  profit: '#10B981',
  orders: '#6366F1',
  returns: '#F87171'
}

const labelMap: Record<MetricKey, string> = {
  revenue: 'Doanh thu',
  profit: 'Lợi nhuận',
  orders: 'Đơn hàng',
  returns: 'Trả hàng'
}

interface SeriesItem {
  key: MetricKey
  values: number[]
}
const series = computed<SeriesItem[]>(() => {
  if (!props.points?.length) return []
  const arr = props.metrics
    .filter(m => ['revenue', 'profit', 'orders', 'returns'].includes(m))
    .map(m => ({
      key: m as MetricKey,
      values: props.points.map((p) => {
        // Access numeric metric safely
        const val = (p as unknown as Record<string, unknown>)[m]
        return typeof val === 'number' ? val : 0
      })
    }))
  // Sort by sum desc so smaller lines draw last (on top)
  return arr.sort((a, b) => b.values.reduce((s, v) => s + v, 0) - a.values.reduce((s, v) => s + v, 0))
})

const seriesMaxMap = computed<Record<string, number>>(() => {
  const m: Record<string, number> = {}
  for (const s of series.value) m[s.key] = Math.max(0, ...s.values)
  return m
})

function formatCompact(v: number) {
  if (v == null || isNaN(v)) return '--'
  const abs = Math.abs(v)
  if (abs >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2).replace(/\.00$/, '') + 'B'
  if (abs >= 1_000_000) return (v / 1_000_000).toFixed(2).replace(/\.00$/, '') + 'M'
  if (abs >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return v.toLocaleString('vi-VN')
}

const labels = computed(() => props.points?.map(p => p.period) || [])

const datasets = computed(() => {
  return series.value.map((s) => {
    const raw = s.values
    const max = seriesMaxMap.value[s.key] || 0
    const data = props.normalize && max > 0 ? raw.map(v => (v / max) * 100) : raw
    const color = metricColors[s.key]
    const opacity = props.lineOpacity ?? 0.95
    const rgba = hexToRgba(color, opacity)
    return {
      label: labelMap[s.key],
      data,
      borderColor: color,
      pointBackgroundColor: color,
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      pointRadius: 2.2,
      pointHoverRadius: 4,
      borderWidth: props.lineWidth,
      tension: 0.25,
      spanGaps: true,
      borderJoinStyle: props.strokeJoin as CanvasLineJoin,
      borderCapStyle: props.strokeCap as CanvasLineCap,
      miterLimit: props.miterLimit,
      fill: false,
      backgroundColor: rgba
    }
  })
})

// Utility: convert hex to rgba
function hexToRgba(hex: string, alpha: number) {
  const h = (hex || '').replace('#', '')
  if (h.length === 3) {
    const r = parseInt(h[0]! + h[0]!, 16)
    const g = parseInt(h[1]! + h[1]!, 16)
    const b = parseInt(h[2]! + h[2]!, 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some(n => Number.isNaN(n))) return `rgba(0,0,0,${alpha})`
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const chartData = computed(() => ({
  labels: labels.value,
  datasets: datasets.value
}))

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      align: 'start' as const,
      labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'rectRounded' }
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const rawVal = ctx.parsed.y as number
          if (props.normalize) return `${ctx.dataset.label}: ${rawVal.toFixed(0)}%`
          const label = ctx.dataset.label || ''
          // Monetary datasets (Vietnamese labels)
          const isMoney = ['Doanh thu', 'Lợi nhuận'].includes(label)
          return `${label}: ${formatCompact(rawVal)}${isMoney ? ' đ' : ''}`
        },
        title: items => items[0]?.label || ''
      }
    },
    title: { display: false }
  },
  scales: {
    x: {
      display: true,
      grid: { display: false, drawBorder: false },
      ticks: { maxRotation: 0, autoSkip: true }
    },
    y: {
      display: props.showYAxis,
      beginAtZero: true,
      grid: { color: '#E2E8F0', drawBorder: false },
      ticks: {
        maxTicksLimit: Math.max(2, (props.yTicks || 4) + 1),
        callback: (val) => {
          const num = Number(val)
          if (props.normalize) return num + '%'
          const moneyAxis = (props.metrics || []).length > 0 && (props.metrics || []).every(m => m === 'revenue' || m === 'profit')
          return formatCompact(num) + (moneyAxis ? ' đ' : '')
        }
      },
      // Add 12% headroom so highest point doesn't stick to top line
      suggestedMax: (() => {
        if (!datasets.value.length) return undefined
        if (props.normalize) return 100
        const allValues = datasets.value.flatMap(d => d.data as number[])
        const max = Math.max(0, ...allValues)
        if (max === 0) return undefined
        return max * 1.12
      })(),
      title: { display: false }
    }
  },
  elements: {
    line: { borderJoinStyle: props.strokeJoin as CanvasLineJoin, borderCapStyle: props.strokeCap as CanvasLineCap, borderWidth: props.lineWidth },
    point: { radius: 2.2, hitRadius: 8, hoverRadius: 4 }
  },
  animation: { duration: 0 }
}))
</script>

<template>
  <div class="relative" :style="{ height: height + 'px' }">
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <div class="animate-pulse text-xs text-gray-400">
        Đang tải biểu đồ...
      </div>
    </div>
    <div v-else-if="!points || !points.length" class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
      Không có dữ liệu
    </div>
    <Line
      v-else
      :data="chartData"
      :options="chartOptions"
      class="w-full h-full"
    />
  </div>
</template>

<style scoped>
.chartjs-render-monitor { font-size: 10px; }
</style>
