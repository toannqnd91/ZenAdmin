// Composable để quản lý API configuration
export const useApiConfig = () => {
  const config = useRuntimeConfig()
  const apiBaseUrl = (config.public.apiBaseUrl as string || '').replace(/\/$/, '')
  const imageBaseUrl = (config.public.imageBaseUrl as string || '').replace(/\/$/, '')
  const ep = (p: string) => `${apiBaseUrl}${p}`

  return {
    apiBaseUrl,
    imageBaseUrl,
    getEndpoint: ep,
    getImageUrl: (p: string) => `${imageBaseUrl}${p}`,
    endpoints: {
      dashboardMenu: ep('/DashboardMenu'),
      login: ep('/Identity/login'),
      refreshToken: ep('/Identity/refresh'),
      newsCategories: ep('/NewsCategories'),
      news: ep('/News'),
      productCategories: ep('/product-categories'),
      products: ep('/Products'),
      uploadFiles: ep('/File/UploadMultiple')
    }
  }
}
