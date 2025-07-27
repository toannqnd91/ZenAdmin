// @ts-nocheck
import type { UseFetchOptions } from '#app'

export function useApiFetch<T>(url: string | (() => string), options: UseFetchOptions<T> = {}) {
  const { accessToken } = useAuthService()

  return useFetch<T>(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {})
    }
  })
}