import { BaseService } from './base.service'
import type { ApiResponse } from '@/types/common'

export interface Translation {
  name: string
  description?: string
  [key: string]: any
}

export class LocalizationService extends BaseService {
  /**
   * Get translation for an entity
   */
  async getTranslation(entityType: string, entityId: number, culture: string = 'en-US'): Promise<ApiResponse<Translation>> {
    return this.get<Translation>(`/Localization/${entityType}/${entityId}/${culture}`)
  }

  /**
   * Update translation for an entity (batch update)
   */
  async updateTranslation(
    entityType: string,
    entityId: number,
    culture: string = 'en-US',
    data: Translation
  ): Promise<ApiResponse<null>> {
    return this.put<null>(`/Localization/${entityType}/${entityId}/${culture}/batch`, data)
  }
}

// Export singleton instance
export const localizationService = new LocalizationService()
