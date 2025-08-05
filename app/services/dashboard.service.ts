import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { DashboardMenuItem } from '@/types/dashboard'

export class DashboardService extends BaseService {
  /**
   * Get dashboard menu items
   */
  async getMenu() {
    return this.get<DashboardMenuItem[]>(API_ENDPOINTS.DASHBOARD_MENU)
  }

  /**
   * Get dashboard statistics
   */
  async getStats() {
    return this.get(API_ENDPOINTS.DASHBOARD_STATS)
  }

  /**
   * Get dashboard overview data
   */
  async getOverview() {
    return this.get(API_ENDPOINTS.DASHBOARD_OVERVIEW)
  }
}

// Export singleton instance
export const dashboardService = new DashboardService()
