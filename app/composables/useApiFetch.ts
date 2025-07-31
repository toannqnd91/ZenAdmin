// @ts-nocheck
import type { UseFetchOptions } from '#app'

export function useApiFetch<T>(url: string | (() => string), options: UseFetchOptions<T> = {}) {
  const { accessToken } = useAuthService()

  // Always decode from base64 if possible
  let token = accessToken.value
  if (token) {
    try {
      // Only decode if looks like base64 (not a JWT)
      if (!token.includes('.')) {
        token = typeof atob !== 'undefined' ? atob(token) : Buffer.from(token, 'base64').toString('utf8')
      }
    } catch (e) {
      // If decode fails, use as is
    }
  }

  return useFetch<T>(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
}