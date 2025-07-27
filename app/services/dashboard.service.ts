import { BaseService } from './base.service'
import type { DashboardMenuItem } from '@/types/dashboard'

export class DashboardService extends BaseService {
  /**
   * Get dashboard menu items
   */
  async getMenu() {
    return this.get<DashboardMenuItem[]>('/DashboardMenu')
  }

  /**
   * Get dashboard statistics
   */
  async getStats() {
    return this.get('/Dashboard/stats')
  }

  /**
   * Get dashboard overview data
   */
  async getOverview() {
    return this.get('/Dashboard/overview')
  }
}

// Export singleton instance
export const dashboardService = new DashboardService()
