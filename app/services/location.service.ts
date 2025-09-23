import { BaseService } from './base.service'

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
    // Absolute URL so it bypasses apiBaseUrl
    return this.get<LocationItem[]>('https://localhost:62939/api/v1/locations/provinces')
  }

  /**
   * Lấy danh sách Xã/Phường theo Tỉnh/Thành phố
   */
  async getWardsByProvinceCode(provinceCode: number | string) {
    return this.get<LocationItem[]>(`https://localhost:62939/api/v1/locations/provinces/${provinceCode}/wards`)
  }

  // Backward-compatible alias (treat input as code per API contract)
  async getWardsByProvince(provinceCode: number | string) {
    return this.getWardsByProvinceCode(provinceCode)
  }
}

export const locationService = new LocationService()
