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

export class IdentityService extends BaseService {
  private _ownerCache: { data: ShopOwner | null, ts: number } | null = null

  async getShopOwnerCached(opts?: { onUpdated?: (data: ShopOwner | null) => void }): Promise<{ data: ShopOwner | null, fromCache: boolean, refreshPromise?: Promise<boolean> }> {
    const cached = this._ownerCache
    if (cached) {
      const refreshPromise = this.getShopOwner()
        .then((res) => {
          const owner = res?.success ? res.data : null
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
    const owner = res?.success ? res.data : null
    this._ownerCache = { data: owner as ShopOwner | null, ts: Date.now() }
    return { data: owner as ShopOwner | null, fromCache: false }
  }

  async getShopOwner() {
    return this.get<ShopOwnerResponse>(API_ENDPOINTS.SHOP_OWNER)
  }
}

export const identityService = new IdentityService()
