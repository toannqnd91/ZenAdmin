import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface ShopOwner {
  id: string
  email: string
  name: string
  fullName: string
  userName: string
  avatarUrl: string | null
  language: string | null
  phoneNumber: string | null
  gender: string | null
  birthday: string | null
  extensionData: unknown
  createdOn: string
  bio: string | null
  citizenId: string | null
  roles: string[]
  permissions: string[]
  isActivated: boolean
}

export interface ShopOwnerResponse {
  code: string
  success: boolean
  message: string
  data: ShopOwner | null
}

export interface Role {
  id: string
  name: string
  description?: string | null
  history?: unknown
}

export class IdentityService extends BaseService {
  private _ownerCache: { data: ShopOwner | null, ts: number } | null = null

  async getShopOwnerCached(opts?: { onUpdated?: (data: ShopOwner | null) => void }): Promise<{ data: ShopOwner | null, fromCache: boolean, refreshPromise?: Promise<boolean> }> {
    const cached = this._ownerCache
    if (cached) {
      const refreshPromise = this.getShopOwner()
        .then((res) => {
          const owner: ShopOwner | null = res?.success ? res.data : null
          if (JSON.stringify(owner) !== JSON.stringify(cached.data)) {
            this._ownerCache = { data: owner, ts: Date.now() }
            opts?.onUpdated?.(owner as ShopOwner | null)
            return true
          }
          return false
        })
        .catch(() => false)
      return { data: cached.data, fromCache: true, refreshPromise }
    }
    const res = await this.getShopOwner()
    const owner: ShopOwner | null = res?.success ? res.data : null
    this._ownerCache = { data: owner, ts: Date.now() }
    return { data: owner, fromCache: false }
  }

  async getShopOwner() {
    // API returns envelope ApiResponse<ShopOwner>
    return this.get<ShopOwner>(API_ENDPOINTS.SHOP_OWNER)
  }

  // Roles
  async getRoles() {
    // API returns envelope ApiResponse<Role[]> where data is an array of roles
    return this.get<Role[]>(API_ENDPOINTS.IDENTITY_ROLES)
  }
}

export const identityService = new IdentityService()
