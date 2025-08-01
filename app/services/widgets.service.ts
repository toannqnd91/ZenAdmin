
import { BaseService } from './base.service'
import type { ApiResponse } from '@/types/common'

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

export interface WidgetZone {
  id: number
  name: string
  description: string | null
}

export interface WidgetApiResponse {
  code: string
  success: boolean
  message: string
  data: WidgetInstance[]
}

export interface CarouselWidgetItem {
  image: string
  imageUrl: string
  caption: string
  subCaption: string
  linkText: string
  targetUrl: string
  sortOrder: number
}

export interface CreateCarouselWidgetRequest {
  id: number
  name: string
  widgetZoneId: number
  publishStart: string
  publishEnd: string
  displayOrder: number
  items: CarouselWidgetItem[]
}

export interface CreateWidgetApiResponse {
  code: string
  success: boolean
  message: string
  data: null
}

export class WidgetsService extends BaseService {
  /**
   * Get all widgets
   */
  async getWidgets() {
    return this.get<WidgetInstance[]>('/widget-instances')
  }

  /**
   * Get all widget zones
   */
  async getWidgetZones(): Promise<ApiResponse<WidgetZone[]>> {
    return this.get<WidgetZone[]>('/widget-zones')
  }

  /**
   * Create carousel widget
   */
  async createCarouselWidget(data: CreateCarouselWidgetRequest) {
    return this.post<CreateWidgetApiResponse>('/widgets/carousel-widgets', data)
  }

  // You can add more CRUD methods here as needed
  // async getWidgetById(id: number) { ... }
  // async updateWidget(id: number, data: ...) { ... }
  // async deleteWidget(id: number) { ... }
}

// Export singleton instance
export const widgetsService = new WidgetsService()
