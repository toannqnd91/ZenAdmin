# Service Repository Pattern

Dự án này đã được tổ chức lại với Service Repository Pattern để:

## Cấu trúc Services

### 1. Base Service (`/app/services/base.service.ts`)
- Class trừu tượng chứa các phương thức HTTP cơ bản
- Xử lý authentication headers
- Error handling thống nhất
- Helper methods cho pagination, search, sort

### 2. Domain Services
- **AuthService**: Xử lý đăng nhập, đăng xuất, refresh token
- **DashboardService**: Lấy menu dashboard, thống kê
- **NewsService**: CRUD operations cho news và news categories  
- **ProductService**: CRUD operations cho products và product categories
- **FileService**: Upload, delete files
- **AdmissionService & ScholarshipService**: Xử lý tuyển sinh và học bổng

## Cách sử dụng

### 1. Import service
```typescript
import { productService, newsService } from '@/services'
```

### 2. Sử dụng trong composables
```typescript
// Thay vì useApiFetch trực tiếp
const { data, pending: loading } = useApiFetch('/api/products', { method: 'POST' })

// Sử dụng service
const products = await productService.getProducts({
  search: 'keyword',
  pagination: { start: 0, number: 20 }
})
```

### 3. Với composables mới
```typescript
// useProductsService.ts - Version mới với services
import { useProductsService } from '@/composables/useProductsService'

const {
  products,
  loading,
  createProduct,
  updateProduct,
  deleteProduct
} = useProductsService()
```

## Lợi ích

### 1. **Tái sử dụng code**
- Logic API được tập trung trong services
- Dễ dàng sử dụng lại ở nhiều nơi
- Giảm code duplicate

### 2. **Type Safety**
- TypeScript interfaces rõ ràng
- Auto-completion tốt hơn
- Bắt lỗi compile time

### 3. **Easier Testing**
- Services có thể mock dễ dàng
- Unit test từng method riêng biệt
- Integration test đơn giản hơn

### 4. **Maintenance**
- Tập trung logic business
- Dễ refactor và update
- Consistent error handling

## Migration từ useApiFetch

### Before (useApiFetch)
```typescript
const { data, pending } = useApiFetch<ProductApiResponse>('/api/products', {
  method: 'POST',
  body: {
    Pagination: { Start: 0, Number: 20 },
    Search: { QueryObject: { Name: null } }
  }
})
```

### After (Service)
```typescript
const products = await productService.getProducts({
  search: 'product name',
  pagination: { start: 0, number: 20 }
})
```

## Authentication

Services tự động xử lý authentication thông qua:
- Base service có access token handling
- Composable `useApiService` wrap service calls
- Integration với `useAuth` composable

## Error Handling

- Consistent error messages
- Toast notifications tự động
- Error logging và debugging
- Retry mechanisms có thể thêm

## Next Steps

1. Migrate các composables hiện tại sang dùng services
2. Thêm caching layer nếu cần
3. Implement offline support
4. Add request/response interceptors
5. Performance monitoring
