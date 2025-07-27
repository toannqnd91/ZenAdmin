import type { ApiResponse } from '@/types/common'

/**
 * Composable for making authenticated API calls using services
 * This wraps the service calls with authentication headers
 */
export function useApiService() {
  const { accessToken } = useAuthService()

  /**
   * Generic service caller with authentication
   */
  async function callService<T>(
    serviceCall: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
    try {
      // If we have an access token, we could intercept the service call
      // to add authentication headers, but since we're using the services
      // directly, we'll rely on the useApiFetch composable for auth
      return await serviceCall()
    } catch (error) {
      console.error('Service call failed:', error)
      throw error
    }
  }

  /**
   * Service caller with loading state
   */
  function useServiceCall<T>(
    serviceCall: () => Promise<ApiResponse<T>>,
    options?: {
      immediate?: boolean
      default?: () => T
    }
  ) {
    const loading = ref(false)
    const error = ref<Error | null>(null)
    const data = ref<T | null>(options?.default?.() || null)

    const execute = async () => {
      loading.value = true
      error.value = null

      try {
        const response = await callService(serviceCall)
        if (response.success) {
          data.value = response.data
        } else {
          throw new Error(response.message)
        }
      } catch (err) {
        error.value = err instanceof Error ? err : new Error('Unknown error')
      } finally {
        loading.value = false
      }
    }

    if (options?.immediate !== false) {
      execute()
    }

    return {
      data: readonly(data),
      loading: readonly(loading),
      error: readonly(error),
      execute,
      refresh: execute
    }
  }

  /**
   * Service caller with reactive parameters
   */
  function useServiceWatch<T, P>(
    serviceCall: (params: P) => Promise<ApiResponse<T>>,
    params: Ref<P> | ComputedRef<P>,
    options?: {
      immediate?: boolean
      default?: () => T
    }
  ) {
    const loading = ref(false)
    const error = ref<Error | null>(null)
    const data = ref<T | null>(options?.default?.() || null)

    const execute = async () => {
      loading.value = true
      error.value = null

      try {
        const response = await callService(() => serviceCall(unref(params)))
        if (response.success) {
          data.value = response.data
        } else {
          throw new Error(response.message)
        }
      } catch (err) {
        error.value = err instanceof Error ? err : new Error('Unknown error')
      } finally {
        loading.value = false
      }
    }

    // Watch params changes
    watchEffect(() => {
      if (options?.immediate !== false) {
        execute()
      }
    })

    return {
      data: readonly(data),
      loading: readonly(loading),
      error: readonly(error),
      execute,
      refresh: execute
    }
  }

  return {
    callService,
    useServiceCall,
    useServiceWatch
  }
}
