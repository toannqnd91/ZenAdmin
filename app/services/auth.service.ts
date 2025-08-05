import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { LoginRequest, LoginResponse } from '@/types/common'

export class AuthService extends BaseService {
  /**
   * Login user with credentials
   */
  async login(credentials: LoginRequest) {
    return this.post<LoginResponse>(API_ENDPOINTS.LOGIN, credentials)
  }

  /**
   * Logout user (if backend supports it)
   */
  async logout() {
    return this.post(API_ENDPOINTS.LOGOUT)
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    return this.post<LoginResponse>(API_ENDPOINTS.REFRESH_TOKEN, { refreshToken })
  }

  /**
   * Get current user profile
   */
  async getProfile() {
    return this.get(API_ENDPOINTS.PROFILE)
  }
}

// Export singleton instance
export const authService = new AuthService()
