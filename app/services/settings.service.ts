import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { ApiResponse } from '@/types/common'

export interface AppSettingItem {
  id: string
  value: string
}

export class SettingsService extends BaseService {
  /**
   * Get all application settings
   */
  async getAppSettings() {
    return this.get<AppSettingItem[]>(API_ENDPOINTS.APP_SETTINGS)
  }
}

export const settingsService = new SettingsService()
