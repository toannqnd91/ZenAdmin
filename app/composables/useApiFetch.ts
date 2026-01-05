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
    // Token is likely a JWT
    const isJWT = token.includes('.') && token.split('.').length === 3
    
    if (!isJWT) {
      console.warn('[ApiFetch] Token does not look like a valid JWT')
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
