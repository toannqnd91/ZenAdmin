import type { UseFetchOptions } from '#app'

export function useApiFetch<T>(url: string | (() => string), options: UseFetchOptions<T> = {}) {
  const { accessToken } = useAuth()

  const headers = {
    ...(options.headers || {}),
    ...(accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {})
  } as Record<string, string>

  return useFetch<T>(url, { ...options, headers })
}