import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface PermissionItemApi {
  id: number
  name: string
  description?: string | null
  sortOrder?: number | null
}

export interface PermissionGroupApi {
  id: number
  name: string
  description?: string | null
  sortOrder?: number | null
  permissionCount?: number | null
  permissions?: PermissionItemApi[]
}

export class PermissionsService extends BaseService {
  async getPermissionGroups() {
    // Returns ApiResponse<PermissionGroupApi[]> (BaseService wraps envelope)
    return this.get<PermissionGroupApi[]>(API_ENDPOINTS.PERMISSION_GROUPS)
  }
}

export const permissionsService = new PermissionsService()
