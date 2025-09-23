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
  async getWardsByProvince(provinceId: number | string) {
    return this.get<LocationItem[]>(`https://localhost:62939/api/v1/locations/provinces/${provinceId}/wards`)
  }
}

export const locationService = new LocationService()
