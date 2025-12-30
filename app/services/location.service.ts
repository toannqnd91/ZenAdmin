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
   * Lấy danh sách Quận/Huyện theo Tỉnh/Thành phố
   */
  async getDistrictsByProvinceCode(provinceCode: number | string) {
    return this.get<LocationItem[]>(API_ENDPOINTS.LOCATIONS_DISTRICTS_BY_PROVINCE(provinceCode))
  }

  /**
   * Lấy danh sách Xã/Phường theo Tỉnh/Thành phố (legacy - trực tiếp)
   */
  async getWardsByProvinceCode(provinceCode: number | string) {
    return this.get<LocationItem[]>(API_ENDPOINTS.LOCATIONS_WARDS_BY_PROVINCE(provinceCode))
  }

  /**
   * Lấy danh sách Xã/Phường theo Quận/Huyện
   */
  async getWardsByDistrictCode(districtCode: number | string) {
    return this.get<LocationItem[]>(API_ENDPOINTS.LOCATIONS_WARDS_BY_DISTRICT(districtCode))
  }

  // Backward-compatible alias (treat input as code per API contract)
  async getWardsByProvince(provinceCode: number | string) {
    return this.getWardsByProvinceCode(provinceCode)
  }
}

export const locationService = new LocationService()
