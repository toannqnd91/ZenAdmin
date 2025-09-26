import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler, Title } from 'chart.js'

// Only register once (Nuxt may import plugin multiple times in dev HMR)
// Use a symbol on globalThis to avoid 'any'
const ZEN_FLAG_KEY = '__ZEN_CHART_REGISTERED__'
const g = globalThis as Record<string, unknown>
if (!g[ZEN_FLAG_KEY]) {
  ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler, Title)
  g[ZEN_FLAG_KEY] = true
}

// You can tweak global defaults here if needed later
ChartJS.defaults.responsive = true
ChartJS.defaults.maintainAspectRatio = false
ChartJS.defaults.font.family = 'Inter, system-ui, sans-serif'

export default () => {
  // No direct injection required for vue-chartjs; the components are imported where used.
}
