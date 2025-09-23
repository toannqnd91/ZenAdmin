// API Endpoints configuration
export const API_ENDPOINTS = {
  // Warehouse endpoints
  WAREHOUSES: '/Warehouse',
  WAREHOUSE_DEFAULT: '/Warehouse/default',
  // File endpoints
  UPLOAD_FILE: '/File/Upload',
  UPLOAD_MULTIPLE_FILES: '/File/UploadMultiple',
  DELETE_FILE: (fileName: string) => `/File/${fileName}`,
  // Widget endpoints
  CAROUSEL_WIDGET: '/CarouselWidget',
  CAROUSEL_WIDGET_BY_ID: (id: number) => `/CarouselWidget/${id}`,
  NEWS_WIDGET: '/NewsWidget',
  NEWS_WIDGET_BY_ID: (id: number) => `/NewsWidget/${id}`,
  WIDGET_INSTANCES: '/widget-instances',
  WIDGET_INSTANCES_REORDER: '/widget-instances/reorder',
  WIDGET_ZONES: '/widget-zones',
  CUSTOM_DATA_WIDGETS: '/custom-data-widgets',
  CUSTOM_DATA_WIDGET_BY_ID: (id: number) => `/custom-data-widgets/${id}`,
  SIMPLE_NEWS_WIDGETS: '/simple-news-widgets',
  SIMPLE_NEWS_WIDGET_BY_ID: (id: number) => `/simple-news-widgets/${id}`,
  // Auth endpoints
  LOGIN: '/Identity/login',
  LOGOUT: '/Identity/logout',
  REFRESH_TOKEN: '/Identity/refresh',
  PROFILE: '/Identity/profile',
  // Content endpoints
  COLLECTIONS: '/collections',
  DASHBOARD_MENU: '/DashboardMenu',
  DASHBOARD_STATS: '/Dashboard/stats',
  DASHBOARD_OVERVIEW: '/Dashboard/overview',
  NEWS_CATEGORIES: '/NewsCategories',
  NEWS_CATEGORY_BY_ID: (id: number) => `/NewsCategories/${id}`,
  NEWS: '/News',
  NEWS_BY_ID: (id: number) => `/News/${id}`,
  NEWS_CREATE: '/News/create',
  NEWS_UPDATE: (id: number) => `/News/${id}/update`,
  NEWS_DELETE: (id: number) => `/News/${id}/delete`,
  NEWS_DELETE_MULTI: '/News/delete-multiple',
  // Product endpoints
  PRODUCT_CATEGORIES: '/ProductCategories',
  PRODUCT_CATEGORY_BY_ID: (id: number) => `/ProductCategories/${id}`,
  PRODUCTS: '/product/grid',
  PRODUCT_BY_ID: (id: number) => `/Product/${id}`,
  PRODUCT_CREATE: '/Product',
  PRODUCT_UPDATE: (id: number) => `/Product/${id}`,
  PRODUCT_DELETE_MULTI: '/Product/delete-multiple',

  // Order endpoints
  ORDER_SOURCES: '/Order/order-sources',

  // Supplier endpoints
  SUPPLIERS: '/Suppliers',
  // Customer endpoints
  CUSTOMERS_GRID: '/customers/grid',
  // External customer endpoints
  CUSTOMER_CREATE_EXTERNAL: 'https://localhost:62939/api/v1/customer',

  // Pages endpoints
  PAGES: '/pages',
  // Links endpoints
  LINKS: '/Links',
  LINK_BY_URL: (url: string) => `/Links/${url}`,
  LINK_MENU_ITEMS: (linkUrl: string) => `/Links/${linkUrl}/MenuItems`,
  LINK_MENU_ITEM_BY_ID: (linkUrl: string, itemId: number) => `/Links/${linkUrl}/MenuItems/${itemId}`,
  LINK_MENU_ITEMS_REORDER: (linkUrl: string) => `/Links/${linkUrl}/MenuItems/reorder`,
  // Menu endpoints
  MENU_CATEGORIES: (menuUrl: string) => `/Menus/${menuUrl}/category`,
  MENU_REORDER: '/Menus/reorder',

  // Menu type endpoints
  MENU_TYPES: '/MenuTypes',

  // Brand endpoints
  BRANDS: '/brands',
  BRAND_BY_ID: (id: number) => `/brands/${id}`
} as const

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
    productCategories: `${apiBaseUrl}/product-categories`,
    products: `${apiBaseUrl}/Products`,
    // File endpoints
    uploadFile: `${apiBaseUrl}/File/Upload`,
    uploadFiles: `${apiBaseUrl}/File/UploadMultiple`,
    deleteFile: (fileName: string) => `${apiBaseUrl}/File/${fileName}`,
    // Widget endpoints
    carouselWidget: `${apiBaseUrl}/CarouselWidget`,
    carouselWidgetById: (id: number) => `${apiBaseUrl}/CarouselWidget/${id}`
  }
}
