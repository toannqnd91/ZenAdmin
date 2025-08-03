// Composable để quản lý API configuration
export const useApiConfig = () => {
  const config = useRuntimeConfig()
  
  return {
    apiBaseUrl: config.public.apiBaseUrl,
    imageBaseUrl: config.public.imageBaseUrl,
    
    // Helper để tạo endpoint URLs
    getEndpoint: (path: string) => `${config.public.apiBaseUrl}${path}`,
    getImageUrl: (path: string) => `${config.public.imageBaseUrl}${path}`,
    
    // Common endpoints
    endpoints: {
      dashboardMenu: `${config.public.apiBaseUrl}/DashboardMenu`,
      login: `${config.public.apiBaseUrl}/Identity/login`,
      refreshToken: `${config.public.apiBaseUrl}/Identity/refresh`,
      newsCategories: `${config.public.apiBaseUrl}/NewsCategories`,
      news: `${config.public.apiBaseUrl}/News`,
      productCategories: `${config.public.apiBaseUrl}/ProductCategories`,
      products: `${config.public.apiBaseUrl}/Products`,
      uploadFiles: `${config.public.apiBaseUrl}/File/UploadMultiple`
    }
  }
}
