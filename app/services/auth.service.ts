import { BaseService } from './base.service'
import type { LoginRequest, LoginResponse } from '@/types/common'

export class AuthService extends BaseService {
  /**
   * Login user with credentials
   */
  async login(credentials: LoginRequest) {
    return this.post<LoginResponse>('/Identity/login', credentials)
  }

  /**
   * Logout user (if backend supports it)
   */
  async logout() {
    return this.post('/Identity/logout')
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    return this.post<LoginResponse>('/Identity/refresh', { refreshToken })
  }

  /**
   * Get current user profile
   */
  async getProfile() {
    return this.get('/Identity/profile')
  }
}

// Export singleton instance
export const authService = new AuthService()
