import { ref, computed } from 'vue'
import { authService } from '@/services'
import type { LoginRequest } from '@/types/common'

export const useAuthService = () => {
  const toast = useToast()
  const router = useRouter()

  // State
  // State - use useState for global state sharing across composables
  const loading = useState<boolean>('auth:loading', () => false)
  const user = useState<any>('auth:user', () => null)
  const accessToken = useState<string | null>('auth:accessToken', () => null)
  const error = useState<Error | null>('auth:error', () => null)

  // Computed
  const isAuthenticated = computed(() => !!accessToken.value)
  const isLoading = computed(() => loading.value)

  // Methods
  async function login(credentials: LoginRequest) {
    loading.value = true
    error.value = null

    try {
      // Use the correct format that worked: {email, password}
      const response = await authService.login(credentials)

      // Check if response has accessToken (success) or success flag
      if ((response as any).success || (response as any).accessToken) {
        // Store tokens - check both data structure formats
        const tokenData = (response as any).data || response
        accessToken.value = tokenData.accessToken

        // Decode JWT token to get user info
        if (tokenData.accessToken && tokenData.accessToken.includes('.')) {
          try {
            const parts = tokenData.accessToken.split('.')
            if (parts[1]) {
              const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
              }).join(''))
              const payload = JSON.parse(jsonPayload)
              user.value = payload
              }
          } catch (error) {
            console.error('Failed to decode login token:', error)
            user.value = tokenData.user || { fullName: 'User' } // fallback
          }
        } else {
          user.value = tokenData.user || { fullName: 'User' } // fallback if no token data
        }

        // Security Strategy (Enhanced):
        // - access_token: ENCRYPTED before storing in cookie (AES-GCM)
        // - refresh_token: httpOnly (maximum security), long-lived (30 days)
        const isProd = !import.meta.dev
        
        // Encrypt access token before storing
        const { encryptToken } = await import('@/utils/crypto')
        const encryptedToken = await encryptToken(tokenData.accessToken)
        
        const accessTokenCookie = useCookie('access_token', {
          httpOnly: false,  // Must be readable for decryption
          secure: isProd,   // HTTPS only in production
          sameSite: 'strict', // CSRF protection
          path: '/',
          maxAge: 60 * 60 // 1 hour (short-lived to minimize XSS risk)
        })

        const refreshTokenCookie = useCookie('refresh_token', {
          httpOnly: true,   // Maximum security - cannot be read by JavaScript
          secure: isProd,
          sameSite: 'strict',
          path: '/',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })

        // Store ENCRYPTED token in cookie
        accessTokenCookie.value = encryptedToken
        refreshTokenCookie.value = tokenData.refreshToken
        // Store original token in memory for API calls
        accessToken.value = tokenData.accessToken

        console.log('[Auth] Login successful, tokens stored securely:', {
          email: credentials.email,
          user: user.value?.email || user.value?.name,
          tokenExpiry: '1 hour'
        })

        toast.add({
          title: 'Đăng nhập thành công',
          description: `Chào mừng ${user.value?.name || user.value?.email || 'bạn'}!`
        })

        // Redirect to dashboard
        await router.push('/')

        // Trigger bootstrap after successful login
        const shouldRunBootstrap = useState('shouldRunBootstrap', () => false)
        shouldRunBootstrap.value = true

        return tokenData
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Đăng nhập thất bại')

      toast.add({
        title: 'Lỗi đăng nhập',
        description: error.value.message,
        color: 'error'
      })

      throw error.value
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true

    try {
      // Call logout API
      await authService.logout()
    } catch (err) {
      console.error('Logout API failed:', err)
    } finally {
      // Clear local state
      accessToken.value = null
      user.value = null

      // Clear cookies (consistent with useAuth)
      const accessTokenCookie = useCookie('access_token')
      const refreshTokenCookie = useCookie('refresh_token')

      accessTokenCookie.value = null
      refreshTokenCookie.value = null

      // Clear global settings
      const { clearSettings } = useGlobalSettings()
      clearSettings()

      toast.add({
        title: 'Đăng xuất thành công',
        description: 'Hẹn gặp lại bạn!'
      })

      // Redirect to login
      await router.push('/login')

      loading.value = false
    }
  }

  async function refreshToken() {
    const refreshTokenCookie = useCookie('refresh_token')

    if (!refreshTokenCookie.value) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await authService.refreshToken(refreshTokenCookie.value)

      if (response.success) {
        accessToken.value = response.data.accessToken
        user.value = response.data.user

        // Encrypt and update access token cookie with short expiry
        const { encryptToken } = await import('@/utils/crypto')
        const encryptedToken = await encryptToken(response.data.accessToken)
        
        const isProd = !import.meta.dev
        const accessTokenCookie = useCookie('access_token', {
          httpOnly: false,
          secure: isProd,
          sameSite: 'strict',
          path: '/',
          maxAge: 60 * 60 // 1 hour
        })
        accessTokenCookie.value = encryptedToken

        console.log('[Auth] Token refreshed successfully')
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      // Refresh failed, redirect to login
      await logout()
      throw err
    }
  }

  async function getProfile() {
    try {
      const response = await authService.getProfile()

      if (response.success) {
        user.value = response.data
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      console.error('Failed to get profile:', err)
      throw err
    }
  }

  // Initialize from cookies
  async function initialize() {
    const accessTokenCookie = useCookie('access_token')

    if (accessTokenCookie.value) {
      try {
        // Decrypt the encrypted token from cookie
        const { decryptToken } = await import('@/utils/crypto')
        const token = await decryptToken(accessTokenCookie.value as string)
        
        // Decode JWT token to get user info
        if (token && typeof token === 'string' && token.includes('.')) {
          const parts = token.split('.')
          if (parts.length === 3 && parts[1]) {
            try {
              const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
              }).join(''))
              const payload = JSON.parse(jsonPayload)
              user.value = payload
              console.log('[Auth] User info decoded:', { email: payload.email, role: payload.role })
            } catch (jwtError) {
              console.error('[Auth] Failed to decode JWT payload:', jwtError)
            }
          }
        }
        accessToken.value = token
        console.log('[Auth] Access token restored and decrypted from cookie')
      } catch (error) {
        console.error('[Auth] Failed to decrypt access token:', error)
        // Clear invalid cookie
        accessTokenCookie.value = null
      }
    } else {
      console.log('[Auth] No access token found')
    }
  }

  // Auto-initialize on composable creation
  initialize()

  return {
    // State
    user: readonly(user),
    accessToken: readonly(accessToken),
    loading: readonly(loading),
    error: readonly(error),
    isAuthenticated,
    isLoading,

    // Methods
    login,
    logout,
    refreshToken,
    getProfile,
    initialize
  }
}
