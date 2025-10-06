import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface LocationItem {
  id: number | string
  code?: string
  name: string
  division_type?: string
}

export class LocationService extends BaseService {
  /**
   * Lấy danh sách Tỉnh/Thành phố
   */
  async getProvinces() {
    return this.get<LocationItem[]>(API_ENDPOINTS.LOCATIONS_PROVINCES)
  }

  /**
   * Lấy danh sách Xã/Phường theo Tỉnh/Thành phố
   */
  async getWardsByProvinceCode(provinceCode: number | string) {
    return this.get<LocationItem[]>(API_ENDPOINTS.LOCATIONS_WARDS_BY_PROVINCE(provinceCode))
  }

  // Backward-compatible alias (treat input as code per API contract)
  async getWardsByProvince(provinceCode: number | string) {
    return this.getWardsByProvinceCode(provinceCode)
  }
}

export const locationService = new LocationService()
