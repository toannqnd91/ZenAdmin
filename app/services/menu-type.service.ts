import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface MenuType {
  id: number
  name: string
  entity: string | null
}

class MenuTypeService extends BaseService {
  async getMenuTypes(): Promise<MenuType[]> {
    const res = await this.get<{ data: MenuType[] }>(API_ENDPOINTS.MENU_TYPES)
    return Array.isArray(res.data) ? res.data : []
  }
}

export const menuTypeService = new MenuTypeService()
