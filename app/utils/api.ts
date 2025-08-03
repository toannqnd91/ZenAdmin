// Best practice: Sử dụng composable useApiConfig() trực tiếp
// import { useApiConfig } from '@/composables/useApiConfig'

// Backward compatibility exports (deprecated)
export const getApiBaseUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiBaseUrl
}

export const getImageBaseUrl = () => {
  const config = useRuntimeConfig()
  return config.public.imageBaseUrl
}

export const getApiEndpoints = () => {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBaseUrl
  return {
    dashboardMenu: `${apiBaseUrl}/DashboardMenu`,
    login: `${apiBaseUrl}/Identity/login`,
    refreshToken: `${apiBaseUrl}/Identity/refresh`,
    newsCategories: `${apiBaseUrl}/NewsCategories`,
    news: `${apiBaseUrl}/News`,
    productCategories: `${apiBaseUrl}/ProductCategories`,
    products: `${apiBaseUrl}/Products`,
    uploadFiles: `${apiBaseUrl}/File/UploadMultiple`
  }
}
