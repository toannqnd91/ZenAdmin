export default defineNuxtPlugin(async () => {
  // Initialize auth state from cookies (consistent with useAuth)
  const accessTokenCookie = useCookie('access_token')
  const refreshTokenCookie = useCookie('refresh_token')

  // If we have tokens, validate them
  if (accessTokenCookie.value) {
    try {
      // Decode the token first (useAuth stores it encoded)
      let token = accessTokenCookie.value
      try {
        token = import.meta.client ? atob(token) : Buffer.from(token, 'base64').toString('utf8')
      } catch {
        // If decode fails, token might not be encoded
      }

      // Try to decode JWT to check if it's expired
      const tokenParts = token.split('.')
      if (tokenParts.length === 3 && tokenParts[1]) {
        const payload = JSON.parse(atob(tokenParts[1]))
        const isExpired = payload.exp * 1000 < Date.now()

        if (isExpired && refreshTokenCookie.value) {
          // Token is expired, try to refresh
          console.log('Access token expired, attempting refresh...')

          const { getApiEndpoints } = await import('@/utils/api')
          const endpoints = getApiEndpoints()
          const response = await fetch(endpoints.refreshToken, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              refreshToken: refreshTokenCookie.value
            })
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              // Encode token like useAuth does
              const encodedToken = import.meta.client ? btoa(data.data.accessToken) : Buffer.from(data.data.accessToken).toString('base64')
              accessTokenCookie.value = encodedToken

              if (data.data.refreshToken) {
                refreshTokenCookie.value = data.data.refreshToken
              }
              console.log('Token refreshed successfully')
            } else {
              console.warn('Token refresh failed:', data.message)
              // Clear invalid tokens
              accessTokenCookie.value = null
              refreshTokenCookie.value = null
            }
          } else {
            console.warn('Token refresh request failed')
            // Clear invalid tokens
            accessTokenCookie.value = null
            refreshTokenCookie.value = null
          }
        }
      }
    } catch (error) {
      console.error('Error validating/refreshing token:', error)
      // Clear invalid tokens
      accessTokenCookie.value = null
      refreshTokenCookie.value = null
    }
  }

  // Set up global error handler for 401s
  if (import.meta.client) {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('401')
        || event.reason?.message?.includes('unauthorized')) {
        console.warn('Global 401 handler triggered')

        // Clear tokens
        accessTokenCookie.value = null
        refreshTokenCookie.value = null

        // Redirect to login if not already there
        const router = useRouter()
        const route = useRoute()

        if (route.path !== '/login') {
          router.push('/login')
        }
      }
    })
  }
})
