// Get API base URL from runtime config
export const getApiBaseUrl = () => {
  const runtimeConfig = useRuntimeConfig()
  return runtimeConfig.public.apiBaseUrl
}

// Fallback API base URL for server-side or when runtime config is not available
export const API_BASE_URL = process.env.NUXT_PUBLIC_API_BASE_URL || 'https://demo.cokhitamlong.vn/api/v1'

export const API_ENDPOINTS = {
  dashboardMenu: `${API_BASE_URL}/DashboardMenu`,
  login: `${API_BASE_URL}/Identity/login`,
  newsCategories: `${API_BASE_URL}/NewsCategories`,
  news: `${API_BASE_URL}/News`,
  productCategories: `${API_BASE_URL}/ProductCategories`,
  products: `${API_BASE_URL}/Products`,
  uploadFiles: `${API_BASE_URL}/File/UploadMultiple`
}
