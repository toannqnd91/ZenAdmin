import type { UseFetchOptions } from '#app'

export function useApiFetch<T>(url: string | (() => string), options: UseFetchOptions<T> = {}) {
  const { accessToken } = useAuthService()

  // Always decode from base64 if possible. If accessToken composable isn't ready yet
  // (e.g., on first SSR load), fallback to reading cookie directly.
  let token = accessToken.value
  if (!token) {
    const cookieToken = useCookie<string | null>('access_token').value
    if (cookieToken) {
      token = cookieToken
    }
  }
  if (token) {
    try {
      // Only decode if looks like base64 (not a JWT)
      if (!token.includes('.')) {
        token = typeof atob !== 'undefined' ? atob(token) : Buffer.from(token, 'base64').toString('utf8')
      }
    } catch {
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
