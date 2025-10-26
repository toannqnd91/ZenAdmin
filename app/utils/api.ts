// API Endpoints configuration
export const API_ENDPOINTS = {
  PRODUCT_QUICK_CREATE: '/Product/quick-create',
  // Warehouse endpoints
  WAREHOUSES: '/Warehouse',
  WAREHOUSE_DEFAULT: '/Warehouse/default',
  WAREHOUSE_CREATE: '/Warehouse',
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
  DASHBOARD_MENU: '/Identity/system-menu/auto',
  DASHBOARD_STATS: '/Dashboard/stats',
  DASHBOARD_OVERVIEW: '/Dashboard/overview',
  // Statistics endpoints
  STATISTICS_OVERVIEW: '/Statistics/overview',
  STATISTICS_TOP_PRODUCTS: '/Statistics/top-products',
  STATISTICS_TOP_CUSTOMERS: '/Statistics/top-customers',
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
  ORDER_SOURCES: '/OrdersRead/order-sources',
  ORDER_GRID_EXTERNAL: '/OrdersRead/grid',
  ORDER_CREATE_POS: '/OrdersMutation/create-pos-order',
  ORDER_BY_ID: (id: number | string) => `/OrdersRead/${id}`,
  ORDER_HISTORY: (id: number | string) => `/OrdersRead/${id}/history`,
  // Order payments
  ORDER_PAY: (orderCode: string) => `/orders/${orderCode}/pay`,

  // Inventory Transfer endpoints
  INVENTORY_TRANSFERS: '/InventoryTransfers',
  INVENTORY_TRANSFERS_GRID: '/InventoryTransfers/grid',
  INVENTORY_TRANSFERS_COUNT_BY_STATUS: '/InventoryTransfers/count-by-status',
  INVENTORY_TRANSFER_BY_CODE: (code: string) => `/InventoryTransfers/${code}`,
  INVENTORY_TRANSFER_UPDATE_STATUS: (code: string) => `/InventoryTransfers/${code}/status`,

  // Purchase Orders endpoints
  PURCHASE_ORDERS_GRID: '/PurchaseOrders/grid',
  PURCHASE_ORDER_BY_CODE: (code: string) => `/PurchaseOrders/by-code/${code}`,
  PURCHASE_ORDER_RECEIVE: (id: number | string) => `/PurchaseOrders/${id}/receive`,
  PURCHASE_ORDER_PAYMENTS: (id: number | string) => `/PurchaseOrders/${id}/payments`,

  // Damage Items endpoints
  DAMAGE_ITEMS_GRID: '/DamageItems/grid',

  // Supplier endpoints
  SUPPLIERS: '/Supplier/grid',
  SUPPLIER_BY_ID: (id: number | string) => `/Supplier/${id}`,
  SUPPLIER_CREATE: '/Supplier',
  // Customer endpoints
  CUSTOMERS_GRID: '/customers/grid',
  // External customer endpoints
  CUSTOMER_CREATE_EXTERNAL: '/customer',
  CUSTOMER_BY_ID_EXTERNAL: (id: string) => `/customer/${id}`,
  CUSTOMER_GROUPS_EXTERNAL: '/customergroups',
  CUSTOMER_ORDERS_EXTERNAL: (id: string) => `/customer/${id}/orders`,
  ORDER_COUNT_BY_STATUS_EXTERNAL: '/OrdersRead/count-by-status',

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
  BRAND_BY_ID: (id: number) => `/brands/${id}`,
  // Cash Book endpoints
  CASHBOOK_FILTER: '/cashbook/filter',
  CASHBOOK_DETAIL: (code: string) => `/cashbook/${code}`,

  // Location endpoints
  LOCATIONS_PROVINCES: '/locations/provinces',
  LOCATIONS_WARDS_BY_PROVINCE: (provinceCode: number | string) => `/locations/provinces/${provinceCode}/wards`,

  // Legacy duplicates (migrating away from getApiEndpoints())
  DASHBOARD_MENU_LEGACY: '/Identity/system-menu/auto',
  LOGIN_LEGACY: '/Identity/login',
  REFRESH_TOKEN_LEGACY: '/Identity/refresh',
  NEWS_CATEGORIES_LEGACY: '/NewsCategories',
  NEWS_LEGACY: '/News',
  PRODUCT_CATEGORIES_LEGACY: '/product-categories',
  PRODUCTS_LEGACY: '/Products',
  UPLOAD_FILE_LEGACY: '/File/Upload',
  UPLOAD_FILES_LEGACY: '/File/UploadMultiple',
  DELETE_FILE_LEGACY: (fileName: string) => `/File/${fileName}`,
  CAROUSEL_WIDGET_LEGACY: '/CarouselWidget',
  CAROUSEL_WIDGET_BY_ID_LEGACY: (id: number) => `/CarouselWidget/${id}`
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

/**
 * @deprecated Use API_ENDPOINTS directly. This helper will be removed once all call sites migrate.
 */
export const getApiEndpoints = () => {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBaseUrl
  return {
    dashboardMenu: `${apiBaseUrl}${API_ENDPOINTS.DASHBOARD_MENU}`,
    login: `${apiBaseUrl}${API_ENDPOINTS.LOGIN}`,
    refreshToken: `${apiBaseUrl}${API_ENDPOINTS.REFRESH_TOKEN}`,
    newsCategories: `${apiBaseUrl}${API_ENDPOINTS.NEWS_CATEGORIES}`,
    news: `${apiBaseUrl}${API_ENDPOINTS.NEWS}`,
    productCategories: `${apiBaseUrl}${API_ENDPOINTS.PRODUCT_CATEGORIES_LEGACY}`,
    products: `${apiBaseUrl}${API_ENDPOINTS.PRODUCTS_LEGACY}`,
    uploadFile: `${apiBaseUrl}${API_ENDPOINTS.UPLOAD_FILE}`,
    uploadFiles: `${apiBaseUrl}${API_ENDPOINTS.UPLOAD_MULTIPLE_FILES}`,
    deleteFile: (fileName: string) => `${apiBaseUrl}/File/${fileName}`,
    carouselWidget: `${apiBaseUrl}${API_ENDPOINTS.CAROUSEL_WIDGET}`,
    carouselWidgetById: (id: number) => `${apiBaseUrl}${API_ENDPOINTS.CAROUSEL_WIDGET_BY_ID(id)}`
  }
}
