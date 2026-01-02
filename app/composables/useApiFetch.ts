import type { UseFetchOptions } from '#app'

export function useApiFetch<T>(url: string | (() => string), options: UseFetchOptions<T> = {}) {
  const { accessToken } = useAuthService()

  let token = accessToken.value
  if (!token) {
    const cookieToken = useCookie<string | null>('access_token').value
    if (cookieToken) {
      token = cookieToken
    }
  }
  
  if (token) {
    try {
      // Token is stored as base64, decode it
      token = typeof atob !== 'undefined' ? atob(token) : Buffer.from(token, 'base64').toString('utf8')
      console.log('[ApiFetch] Token decoded for request:', {
        url: typeof url === 'string' ? url : 'dynamic',
        tokenParts: token.split('.').length,
        tokenPreview: token.substring(0, 50) + '...'
      })
    } catch (e) {
      console.error('[ApiFetch] Failed to decode token:', e)
      // If decode fails, use as is
    }
  } else {
    console.warn('[ApiFetch] No token available for request:', typeof url === 'string' ? url : 'dynamic')
  }

  return useFetch<T>(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
}
