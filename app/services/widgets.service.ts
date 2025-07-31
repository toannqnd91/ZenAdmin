
import { BaseService } from './base.service'

export interface WidgetInstance {
  id: number
  name: string
  widgetType: string
  widgetZone: string
  createdOn: string
  editUrl: string
  publishStart: string
  publishEnd: string | null
  displayOrder: number
}

export interface WidgetApiResponse {
  code: string
  success: boolean
  message: string
  data: WidgetInstance[]
}

export class WidgetsService extends BaseService {
  /**
   * Get all widgets
   */
  async getWidgets() {
    return this.get<WidgetInstance[]>('/widget-instances')
  }

  // You can add more CRUD methods here as needed
  // async getWidgetById(id: number) { ... }
  // async createWidget(data: ...) { ... }
  // async updateWidget(id: number, data: ...) { ... }
  // async deleteWidget(id: number) { ... }
}

// Export singleton instance
export const widgetsService = new WidgetsService()
