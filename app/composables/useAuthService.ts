import { ref, computed } from 'vue'
import { authService } from '@/services'
import type { LoginRequest } from '@/types/common'

export const useAuthService = () => {
  const toast = useToast()
  const router = useRouter()
  
  // State
  const loading = ref(false)
  const user = ref<any>(null)
  const accessToken = ref<string | null>(null)
  const error = ref<Error | null>(null)

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
      
      console.log('Full API response:', response)
      
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
              const payload = JSON.parse(atob(parts[1]))
              user.value = payload
              console.log('Decoded user from login token:', payload)
            }
          } catch (error) {
            console.error('Failed to decode login token:', error)
            user.value = tokenData.user || { fullName: 'User' } // fallback
          }
        } else {
          user.value = tokenData.user || { fullName: 'User' } // fallback if no token data
        }
        
        // Store in localStorage/cookies (consistent with useAuth)
        const accessTokenCookie = useCookie('access_token', {
          httpOnly: false,
          secure: true,
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        })
        
        const refreshTokenCookie = useCookie('refresh_token', {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })

        // Encode token like useAuth does
        const encodedToken = process.client ? btoa(tokenData.accessToken) : Buffer.from(tokenData.accessToken).toString('base64')
        accessTokenCookie.value = encodedToken
        refreshTokenCookie.value = tokenData.refreshToken

        toast.add({
          title: 'Đăng nhập thành công',
          description: `Chào mừng ${tokenData.user?.fullName || 'bạn'}!`
        })

        // Redirect to dashboard
        await router.push('/')

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
        
        // Update access token cookie (encode like useAuth)
        const accessTokenCookie = useCookie('access_token')
        const encodedToken = process.client ? btoa(response.data.accessToken) : Buffer.from(response.data.accessToken).toString('base64')
        accessTokenCookie.value = encodedToken
        
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

  // Initialize from cookies (consistent with useAuth)
  function initialize() {
    const accessTokenCookie = useCookie('access_token')
    
    console.log('Initialize - accessTokenCookie.value:', accessTokenCookie.value)
    
    if (accessTokenCookie.value) {
      // Decode token like useAuth stores it
      try {
        let token = accessTokenCookie.value
        
        // First decode from base64 if needed
        try {
          const decodedFromBase64 = import.meta.client ? atob(accessTokenCookie.value) : Buffer.from(accessTokenCookie.value, 'base64').toString('utf8')
          token = decodedFromBase64
        } catch {
          // If base64 decode fails, use original value
          token = accessTokenCookie.value
        }
        
        accessToken.value = token
        console.log('Initialize - final token:', token)
        
        // Decode JWT token to get user info
        if (token && typeof token === 'string' && token.includes('.')) {
          const parts = token.split('.')
          if (parts.length === 3 && parts[1]) {
            try {
              const payload = JSON.parse(atob(parts[1]))
              user.value = payload
              console.log('Initialize - decoded user from JWT token:', payload)
            } catch (jwtError) {
              console.error('Failed to decode JWT payload:', jwtError)
            }
          }
        }
      } catch (error) {
        console.error('Failed to process token:', error)
        accessToken.value = accessTokenCookie.value
      }
    } else {
      console.log('No access token cookie found')
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