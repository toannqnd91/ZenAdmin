import { BaseService } from './base.service'
import type { ApiResponse } from '@/types/common'
import { API_ENDPOINTS } from '@/utils/api'

// API: GET /api/v1/Statistics/overview
// Query params: from, to (ISO), range (today|yesterday|last7d|thismonth|lastmonth), sourceId, warehouseId
// If from/to provided, backend prioritizes them over range.

export interface OverviewMetric {
  value: number
  previous: number
  growth: number
}

// Internal normalized metrics that UI expects.
// Backend now returns: grossRevenue, netRevenue, refunded, returnedValue, pendingRefund, profit, orders, returns
// We decide to expose 'revenue' = netRevenue (net sales), keep profit/orders/returns.
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
  revenue: number // mapped from netRevenue
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
    interface RawOverviewEnvelope {
      period: {
        from: string
        to: string
        previousFrom: string
        previousTo: string
      }
      metrics: {
        grossRevenue: OverviewMetric
        netRevenue: OverviewMetric
        refunded: OverviewMetric
        returnedValue: OverviewMetric
        pendingRefund: OverviewMetric
        profit: OverviewMetric
        orders: OverviewMetric
        returns: OverviewMetric
      }
      pending?: OverviewPending
      chart: {
        granularity: 'day' | 'week' | 'month'
        points: Array<{
          period: string
          grossRevenue?: number
          netRevenue?: number
          refunded?: number
          returnedValue?: number
          pendingRefundValue?: number
          profit?: number
          orders?: number
          returns?: number
        }>
      }
    }

    const res = await this.get<RawOverviewEnvelope>(API_ENDPOINTS.STATISTICS_OVERVIEW, clean)
    const raw = res.data

    // Normalize metrics to existing UI contract
    const normalized: OverviewResponseData = {
      period: raw.period,
      metrics: {
        revenue: raw.metrics.netRevenue || raw.metrics.grossRevenue, // fallback
        profit: raw.metrics.profit,
        orders: raw.metrics.orders,
        returns: raw.metrics.returns
      },
      pending: raw.pending || { ordersToProcess: 0, returnsToProcess: 0 },
      chart: {
        granularity: raw.chart.granularity,
        points: raw.chart.points.map(p => ({
          period: p.period,
          // prefer netRevenue
          revenue: (p.netRevenue ?? p.grossRevenue ?? 0),
          profit: p.profit ?? 0,
          orders: p.orders ?? 0,
          returns: p.returns
        }))
      }
    }
    return { ...res, data: normalized }
  }

  // --- Top Products & Customers ---
  // API: GET /api/v1/Statistics/top-products
  // Query params: range | from | to, metric (revenue|quantity|orders), limit (default 10)
  // Response shape (assumed): { success, code, message, data: TopProductDTO[] }
  // We'll define strict interfaces so consuming code is typed.

  async getTopProducts(params: TopItemsQuery) {
    const clean: Record<string, string | number> = {}
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue
      clean[k] = typeof v === 'number' ? v : String(v)
    }
    if (!clean.limit) clean.limit = 10
    console.log('[StatisticsService] getTopProducts params:', clean)
    interface RawTopProductsEnvelope {
      period?: { from: string, to: string }
      metric?: string
      items?: Array<{
        productId: number
        productName: string
        quantity?: number
        revenue?: number
        profit?: number
        orders?: number
      }>
    }
    const res = await this.get<RawTopProductsEnvelope | TopProductDTO[]>(API_ENDPOINTS.STATISTICS_TOP_PRODUCTS, clean)
    console.log('[StatisticsService] getTopProducts raw response:', res)
    const data = res.data
    console.log('[StatisticsService] getTopProducts data:', data)
    console.log('[StatisticsService] getTopProducts data is array?', Array.isArray(data))
    if (Array.isArray(data)) {
      console.log('[StatisticsService] getTopProducts returning array directly')
      return res as ApiResponse<TopProductDTO[]>
    }
    if (data && data.items) {
      console.log('[StatisticsService] getTopProducts mapping items:', data.items)
      const mapped: TopProductDTO[] = data.items.map(it => ({
        productId: it.productId,
        name: it.productName,
        revenue: it.revenue ?? 0,
        quantity: it.quantity ?? 0,
        orders: it.orders ?? 0,
        profit: it.profit ?? 0
      }))
      console.log('[StatisticsService] getTopProducts mapped:', mapped)
      return { ...res, data: mapped }
    }
    console.log('[StatisticsService] getTopProducts returning empty array')
    return { ...res, data: [] }
  }

  async getTopCustomers(params: TopItemsQuery) {
    const clean: Record<string, string | number> = {}
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue
      clean[k] = typeof v === 'number' ? v : String(v)
    }
    if (!clean.limit) clean.limit = 10
    console.log('[StatisticsService] getTopCustomers params:', clean)
    interface RawTopCustomersEnvelope {
      items?: Array<{
        customerId?: string | number
        id?: string | number
        CustomerId?: string | number
        customerName?: string
        name?: string
        revenue?: number
        orders?: number
        orderCount?: number
        quantity?: number
        totalQuantity?: number
        avatarUrl?: string | null
      }>
    }
    const res = await this.get<RawTopCustomersEnvelope | TopCustomerDTO[]>(API_ENDPOINTS.STATISTICS_TOP_CUSTOMERS, clean)
    console.log('[StatisticsService] getTopCustomers raw response:', res)
    const data = res.data
    console.log('[StatisticsService] getTopCustomers data:', data)
    console.log('[StatisticsService] getTopCustomers data is array?', Array.isArray(data))
    if (Array.isArray(data)) {
      console.log('[StatisticsService] getTopCustomers returning array directly')
      return res as ApiResponse<TopCustomerDTO[]>
    }
    if (data && data.items) {
      console.log('[StatisticsService] getTopCustomers mapping items:', data.items)
      const mapped: TopCustomerDTO[] = data.items.map(it => ({
        customerId: it.customerId ?? it.id ?? it.CustomerId ?? 0,
        name: it.customerName ?? it.name ?? 'Unknown',
        revenue: it.revenue ?? 0,
        orders: it.orders ?? it.orderCount ?? 0,
        quantity: it.quantity ?? it.totalQuantity ?? undefined,
        avatarUrl: it.avatarUrl ?? null
      }))
      console.log('[StatisticsService] getTopCustomers mapped:', mapped)
      return { ...res, data: mapped }
    }
    console.log('[StatisticsService] getTopCustomers returning empty array')
    return { ...res, data: [] }
  }
}

export const statisticsService = new StatisticsService()

// ----- Top lists types -----
export type TopRangeKey = OverviewRangeKey | 'all'

export interface TopItemsQuery {
  from?: string
  to?: string
  range?: TopRangeKey
  metric?: 'revenue' | 'quantity' | 'orders'
  limit?: number
  sourceId?: number | null
  warehouseId?: number | null
}

export interface TopProductDTO {
  productId: number
  name: string
  sku?: string
  imageUrl?: string | null
  revenue: number
  quantity: number
  orders: number
  profit?: number
}

export interface TopCustomerDTO {
  customerId: string | number
  name: string
  avatarUrl?: string | null
  revenue: number
  orders: number
  quantity?: number // optional if backend returns
}
