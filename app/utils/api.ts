// API Endpoints configuration
export const API_ENDPOINTS = {
  SHOP_OWNER: '/Identity/shop-owner',
  PRODUCT_QUICK_CREATE: '/Product/quick-create',
  // Warehouse endpoints
  WAREHOUSES: '/Warehouse',
  WAREHOUSE_DEFAULT: '/Warehouse/default',
  WAREHOUSE_CREATE: '/Warehouse',
  WAREHOUSE_BY_ID: (id: number | string) => `/Warehouse/${id}`,
  WAREHOUSE_UPDATE: (id: number | string) => `/Warehouse/${id}`,
  // File endpoints
  UPLOAD_FILE: '/FileUpload/upload',
  UPLOAD_MULTIPLE_FILES: '/FileUpload/upload-multiple',
  DELETE_FILE: (fileName: string) => `/File/${fileName}`, // User didn't specify delete endpoint change, but let's leave it unless specified. Or wait, if controller changed to FileUpload, maybe delete changed too? But user only showed upload endpoints. Let's stick to what is shown.
  // Widget endpoints
  CAROUSEL_WIDGET: '/CarouselWidget',
  CAROUSEL_WIDGET_BY_ID: (id: number) => `/CarouselWidget/${id}`,
  HTML_WIDGET: '/HtmlWidget',
  HTML_WIDGET_BY_ID: (id: number) => `/HtmlWidget/${id}`,
  NEWS_WIDGET: '/NewsWidget',
  NEWS_WIDGET_BY_ID: (id: number) => `/NewsWidget/${id}`,
  PRODUCT_WIDGET: '/ProductWidget',
  PRODUCT_WIDGET_BY_ID: (id: number) => `/ProductWidget/${id}`,
  WIDGET_INSTANCES: '/widget-instances',
  WIDGET_INSTANCES_REORDER: '/widget-instances/reorder',
  WIDGET_ZONES: '/widget-zones',
  CUSTOM_DATA_WIDGETS: '/custom-data-widgets',
  CUSTOM_DATA_WIDGET_BY_ID: (id: number) => `/custom-data-widgets/${id}`,
  SIMPLE_NEWS_WIDGETS: '/simple-news-widgets',
  SIMPLE_NEWS_WIDGET_BY_ID: (id: number) => `/simple-news-widgets/${id}`,
  SIMPLE_PRODUCT_WIDGETS: '/simple-product-widgets',
  SIMPLE_PRODUCT_WIDGET_BY_ID: (id: number) => `/simple-product-widgets/${id}`,
  // Auth endpoints
  LOGIN: '/Identity/login',
  LOGOUT: '/Identity/logout',
  REFRESH_TOKEN: '/Identity/refresh',
  PROFILE: '/Identity/profile',
  // Roles
  IDENTITY_ROLES: '/Identity/GetRoles',
  // Permissions
  PERMISSION_GROUPS: '/permissions/groups',
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
  NEWS_CATEGORY_DETAIL: (id: number) => `/NewsCategory/${id}`,
  NEWS_CATEGORY_CREATE: '/NewsCategory/create',
  NEWS_CATEGORY_UPDATE: (id: number) => `/NewsCategory/${id}/update`,
  NEWS: '/News',
  NEWS_BY_ID: (id: number) => `/News/${id}`,
  NEWS_CREATE: '/News/create',
  NEWS_UPDATE: (id: number) => `/News/${id}/update`,
  NEWS_DELETE: (id: number) => `/News/${id}/delete`,
  NEWS_DELETE_MULTI: '/News/delete-multiple',
  // Product endpoints
  PRODUCT_CATEGORIES: '/ProductCategories',
  PRODUCT_CATEGORY_BY_ID: (id: number) => `/ProductCategories/${id}`,
  // Some backends expose singular route for detail fetch
  PRODUCT_CATEGORY_DETAIL_BY_ID: (id: number) => `/ProductCategory/${id}`,
  // Explicit update endpoint for a single product category
  PRODUCT_CATEGORY_UPDATE: (id: number) => `/ProductCategory/${id}/update`,
  PRODUCTS: '/product/grid',
  PROJECTS_GRID: '/Project/grid',
  PROJECT_CREATE: '/Project/create',
  PROJECT_CATEGORIES: '/project-categories',
  PROJECT_CATEGORY_DELETE: (id: number) => `/project-categories/${id}`,
  PROJECT_BY_ID: (id: number) => `/Project/${id}`,
  PROJECT_UPDATE: (id: number) => `/Project/${id}/update`,
  PRODUCT_BY_ID: (id: number) => `/Product/${id}`,
  PRODUCT_CREATE: '/Product',
  PRODUCT_UPDATE: (id: number) => `/Product/${id}`,
  PRODUCT_DELETE_MULTI: '/Product/delete-multiple',

  // Order endpoints
  ORDER_SOURCES: '/Orders/order-sources',
  ORDER_GRID_EXTERNAL: '/Orders/grid',
  ORDER_CREATE_POS: '/Orders/create-pos-order',
  ORDER_BY_ID: (id: number | string) => `/Orders/${id}`,
  ORDER_HISTORY: (id: number | string) => `/Orders/${id}/history`,
  // Order calculate prices based on pricebook
  ORDER_CALCULATE_PRICES: '/Orders/calculate-prices',
  // Order payments
  ORDER_PAY: (orderCode: string) => `/orders/${orderCode}/pay`,
  // Order cancellation
  ORDER_CANCEL: (orderCode: string) => `/orders/${orderCode}/cancel`,
  // Order print preview
  ORDER_PRINT_HTML_PREVIEW: (orderCode: string) => `/Orders/print/${encodeURIComponent(orderCode)}/html-preview`,
  ORDER_PRINT_DOWNLOAD_PDF: (orderCode: string) => `/Orders/print/${encodeURIComponent(orderCode)}/download-pdf`,
  // Order staff assignment
  ORDER_UPDATE_STAFF: (orderCode: string) => `/orders/${encodeURIComponent(orderCode)}/staff`,
  // Order note update
  ORDER_UPDATE_NOTE: (orderCode: string) => `/orders/${encodeURIComponent(orderCode)}/note`,

  // Sales returns
  SALES_RETURNS: '/sales-returns',
  // Single sales return detail by code (backend pattern: /api/v1/sales-returns/by-code/{code})
  SALES_RETURN_BY_CODE: (code: string) => `/sales-returns/by-code/${encodeURIComponent(code)}`,
  SALES_RETURNS_CALCULATE_REFUND: (orderCode: string) => `/sales-returns/${encodeURIComponent(orderCode)}/calculate-refund`,
  // receive a sales return: POST /sales-returns/{code}/receive
  SALES_RETURN_PROCESS: (code: string) => `/sales-returns/${encodeURIComponent(code)}/receive`,
  // refund a sales return: POST /sales-returns/{code}/refund
  SALES_RETURN_REFUND: (code: string) => `/sales-returns/${encodeURIComponent(code)}/refund`,

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
  SUPPLIER_IMPORT_EXCEL: '/Supplier/import-excel',
  // Customer endpoints
  CUSTOMERS_GRID: '/customers/grid',
  // External customer endpoints
  CUSTOMER_CREATE_EXTERNAL: '/customer',
  CUSTOMER_BY_ID_EXTERNAL: (id: string) => `/customer/${id}`,
  CUSTOMER_GROUPS_EXTERNAL: '/customergroups',
  CUSTOMER_ORDERS_EXTERNAL: (id: string) => `/customer/${id}/orders`,
  CUSTOMER_RECEIVABLES: (id: string | number) => `/ar/customers/${id}/receivables`,
  CUSTOMER_PAYMENTS: (id: string | number) => `/ar/customers/${id}/payments`,
  CUSTOMER_ADJUST_DEBT: (id: string | number) => `/ar/customers/${id}/adjust-debt`,
  CUSTOMER_ADD_ADDRESS: (customerId: string | number) => `/customers/${customerId}/addresses`,
  CUSTOMER_UPDATE_ADDRESS: (customerId: string | number, addressId: string | number) => `/customers/${customerId}/addresses/${addressId}`,
  ORDER_COUNT_BY_STATUS_EXTERNAL: '/Orders/count-by-status',
  // Employees
  EMPLOYEES: '/employees',

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
  MENU_UPDATE: (id: number) => `/Menus/${id}`,
  MENU_DELETE: (id: number) => `/Menus/${id}`,
  MENU_CREATE: '/Menus',
  
  // Menu Category endpoints
  MENU_CATEGORY_BY_SLUG: (slug: string) => `/MenuCategories/${slug}`,

  // Menu type endpoints
  MENU_TYPES: '/MenuTypes',

  // Brand endpoints
  BRANDS: '/brands', // list & get by id remain plural (backend convention)
  BRAND_CREATE: '/brand', // singular endpoint used only for creation (backend allows lowercase)
  BRAND_BY_ID: (id: number) => `/brands/${id}`,
  BRAND_UPDATE: (id: number) => `/Brand/${id}/update`, // explicit update endpoint per backend spec

  // Collection endpoints
  COLLECTION_UPDATE: (id: number | string) => `/Collection/${id}/update`,
  // Cash Book endpoints
  CASHBOOK_FILTER: '/cashbook/filter',
  CASHBOOK_DETAIL: (code: string) => `/cashbook/${code}`,
  CASHBOOK_CREATE: '/cashbook',

  // AR/AP Summary endpoints
  AR_SUMMARY: '/ar/summary',
  AR_PAYMENTS: '/ar/payments',

  // Location endpoints
  LOCATIONS_PROVINCES: '/locations/provinces',
  LOCATIONS_DISTRICTS_BY_PROVINCE: (provinceCode: number | string) => `/locations/provinces/${provinceCode}/districts`,
  LOCATIONS_WARDS_BY_PROVINCE: (provinceCode: number | string) => `/locations/provinces/${provinceCode}/wards`,
  LOCATIONS_WARDS_BY_DISTRICT: (districtCode: number | string) => `/locations/districts/${districtCode}/wards`,

  // Pricing / Pricebooks endpoints
  PRICING_PRICEBOOKS: '/pricing/pricebooks',
  PRICING_PRICEBOOKS_BY_TYPE: '/pricing/pricebooks/by-type',
  PRICING_PRICEBOOK_BY_ID: (id: number | string) => `/pricing/pricebooks/${id}`,
  PRICING_PRICEBOOK_BY_CODE: (code: string) => `/pricing/pricebooks/${encodeURIComponent(code)}/code`,
  PRICING_PRICEBOOK_ITEMS_BY_CODE: (code: string) => `/pricing/pricebooks/${encodeURIComponent(code)}/items`,
  PRICING_PRICEBOOK_ITEM_BY_CODE_AND_ID: (code: string, itemId: number | string) => `/pricing/pricebooks/${encodeURIComponent(code)}/items/${encodeURIComponent(String(itemId))}`,
  PRICING_PRICEBOOK_MISSING_PRODUCTS_BY_CODE: (code: string) => `/pricing/pricebooks/${encodeURIComponent(code)}/missing-products`,

  // Legacy duplicates (migrating away from getApiEndpoints())
  DASHBOARD_MENU_LEGACY: '/Identity/system-menu/auto',
  LOGIN_LEGACY: '/Identity/login',
  REFRESH_TOKEN_LEGACY: '/Identity/refresh',
  NEWS_CATEGORIES_LEGACY: '/NewsCategories',
  NEWS_LEGACY: '/News',
  PRODUCT_CATEGORIES_LEGACY: '/product-categories',
  PRODUCTS_LEGACY: '/Products',
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
