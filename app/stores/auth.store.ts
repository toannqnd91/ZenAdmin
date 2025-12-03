/**
 * Authentication store
 * Centralized auth state management with Pinia
 */

import { defineStore } from 'pinia'
import { authService } from '@/services'
import type { LoginRequest } from '@/types/common'

interface User {
  id: number
  username: string
  email: string
  fullName: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated && !!state.accessToken,
    userEmail: (state) => state.user?.email || '',
    userName: (state) => state.user?.fullName || state.user?.username || ''
  },

  actions: {
    /**
     * Login user
     */
    async login(credentials: LoginRequest) {
      this.loading = true
      this.error = null

      try {
        const response = await authService.login(credentials)
        
        if (response.success && response.data) {
          this.user = response.data.user
          this.accessToken = response.data.accessToken
          this.refreshToken = response.data.refreshToken
          this.isAuthenticated = true

          // Store tokens in cookies
          const accessTokenCookie = useCookie('access_token')
          const refreshTokenCookie = useCookie('refresh_token')
          
          accessTokenCookie.value = btoa(response.data.accessToken)
          refreshTokenCookie.value = response.data.refreshToken

          return true
        }

        this.error = response.message || 'Login failed'
        return false
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Login failed'
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Logout user
     */
    async logout() {
      try {
        await authService.logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearAuth()
      }
    },

    /**
     * Clear authentication state
     */
    clearAuth() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.isAuthenticated = false
      this.error = null

      // Clear cookies
      const accessTokenCookie = useCookie('access_token')
      const refreshTokenCookie = useCookie('refresh_token')
      
      accessTokenCookie.value = null
      refreshTokenCookie.value = null
    },

    /**
     * Refresh tokens
     */
    async refreshTokens() {
      if (!this.refreshToken) {
        this.clearAuth()
        return false
      }

      try {
        const response = await authService.refreshToken(this.refreshToken)
        
        if (response.success && response.data) {
          this.accessToken = response.data.accessToken
          
          if (response.data.refreshToken) {
            this.refreshToken = response.data.refreshToken
          }

          // Update cookies
          const accessTokenCookie = useCookie('access_token')
          const refreshTokenCookie = useCookie('refresh_token')
          
          accessTokenCookie.value = btoa(response.data.accessToken)
          if (response.data.refreshToken) {
            refreshTokenCookie.value = response.data.refreshToken
          }

          return true
        }

        this.clearAuth()
        return false
      } catch (error) {
        this.clearAuth()
        return false
      }
    },

    /**
     * Initialize auth from cookies
     */
    initializeAuth() {
      const accessTokenCookie = useCookie('access_token')
      const refreshTokenCookie = useCookie('refresh_token')

      if (accessTokenCookie.value && refreshTokenCookie.value) {
        try {
          this.accessToken = atob(accessTokenCookie.value)
          this.refreshToken = refreshTokenCookie.value
          this.isAuthenticated = true
        } catch (error) {
          this.clearAuth()
        }
      }
    }
  }
})
