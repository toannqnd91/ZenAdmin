import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

// API: GET /api/v1/Statistics/overview
// Query params: from, to (ISO), range (today|yesterday|last7d|thismonth|lastmonth), sourceId, warehouseId
// If from/to provided, backend prioritizes them over range.

export interface OverviewMetric {
  value: number
  previous: number
  growth: number
}

export interface OverviewMetricsGroup {
  revenue: OverviewMetric
  profit: OverviewMetric
  orders: OverviewMetric
  returns: OverviewMetric
}

export interface OverviewPending {
  ordersToProcess: number
  returnsToProcess: number
}

export interface OverviewChartPoint {
  period: string // ISO date/time string
  revenue: number
  profit: number
  orders: number
  returns?: number
}

export interface OverviewChart {
  granularity: 'day' | 'week' | 'month'
  points: OverviewChartPoint[]
}

export interface OverviewPeriodWindow {
  from: string
  to: string
  previousFrom: string
  previousTo: string
}

export interface OverviewResponseData {
  period: OverviewPeriodWindow
  metrics: OverviewMetricsGroup
  pending: OverviewPending
  chart: OverviewChart
}

export type OverviewRangeKey = 'today' | 'yesterday' | 'last7d' | 'thismonth' | 'lastmonth'

export interface OverviewQuery {
  from?: string
  to?: string
  sourceId?: number | null
  warehouseId?: number | null
  range?: OverviewRangeKey
}

export class StatisticsService extends BaseService {
  async getOverview(params: OverviewQuery) {
    // Strip undefined so URL is clean
    const clean: Record<string, string | number> = {}
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue
      clean[k] = typeof v === 'number' ? v : String(v)
    }
    return this.get<OverviewResponseData>(API_ENDPOINTS.STATISTICS_OVERVIEW, clean)
  }
}

export const statisticsService = new StatisticsService()
