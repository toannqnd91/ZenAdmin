# Cancel Order - Implementation Summary

## ✅ Đã hoàn thành

### 1. API Endpoint Configuration
**File:** `app/utils/api.ts`
```typescript
ORDER_CANCEL: (orderCode: string) => `/orders/${orderCode}/cancel`
```

### 2. Service Layer
**File:** `app/services/orders.service.ts`

#### Enums
```typescript
export enum CancellationReasonEnum {
  CustomerRequested = 1,      // Khách hàng yêu cầu
  CreatedByMistake = 2,       // Tạo nhầm
  OutOfStock = 3,             // Hết hàng
  PriceChanged = 4,           // Thay đổi giá
  PaymentIssue = 5,           // Vấn đề thanh toán
  Other = 99                  // Lý do khác
}

export enum RefundOptionEnum {
  RefundNow = 1,              // Hoàn tiền ngay
  RefundLater = 2             // Hoàn trả sau
}
```

#### Types
```typescript
export interface CancelOrderRequest {
  reason: CancellationReasonEnum
  note: string
  refundOption: RefundOptionEnum
  restockAllItems: boolean
  idempotencyKey: string | null
  createdById: string | null
}

export interface CancelOrderResponseData {
  message: string
  orderCode: string
  sagaId: string
  correlationId: string
  orderStatus: string
  note: string
}
```

#### Method
```typescript
async cancelOrder(orderCode: string, body: CancelOrderRequest) {
  return this.post<CancelOrderResponseData | null>(
    API_ENDPOINTS.ORDER_CANCEL(orderCode), 
    body
  )
}
```

### 3. Composable
**File:** `app/composables/useOrderCancel.ts`
```typescript
export function useOrderCancel() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function cancelOrder(
    orderCode: string, 
    request: CancelOrderRequest
  ): Promise<CancelOrderResponseData | null> {
    // ... implementation using ordersService
  }

  return { isLoading, error, cancelOrder }
}
```

### 4. Modal Component
**File:** `app/components/orders/CancelOrderModal.vue`

**Features:**
- ✅ Refund options (conditional - only if paid)
- ✅ Restock checkbox
- ✅ Cancellation reason dropdown
- ✅ Optional note textarea
- ✅ Form validation
- ✅ Proper TypeScript types

## 🎯 Cách sử dụng

### Import
```typescript
import CancelOrderModal from '@/components/orders/CancelOrderModal.vue'
import { useOrderCancel } from '@/composables/useOrderCancel'
import type { CancelOrderRequest } from '@/services/orders.service'
```

### Template
```vue
<CancelOrderModal
  v-model="showCancelModal"
  :order-code="orderCode"
  :order-total="orderTotal"
  :is-paid="isPaid"
  @confirm="handleCancelConfirm"
/>
```

### Handler
```typescript
const { isLoading, error, cancelOrder } = useOrderCancel()

async function handleCancelConfirm(request: CancelOrderRequest) {
  const result = await cancelOrder(orderCode.value, request)
  
  if (result) {
    // Success
    console.log('Saga ID:', result.sagaId)
    console.log('Status:', result.orderStatus)
  } else {
    // Error
    console.error(error.value)
  }
}
```

## 📋 Request Example
```json
{
  "reason": 1,
  "note": "Khách hàng yêu cầu hủy",
  "refundOption": 1,
  "restockAllItems": true,
  "idempotencyKey": null,
  "createdById": null
}
```

## 📋 Response Example
```json
{
  "code": "202",
  "success": true,
  "message": "Success",
  "data": {
    "message": "Order cancellation request submitted to Saga orchestrator",
    "orderCode": "HD000086",
    "sagaId": "54b60e88-98f5-4342-9e72-f069e8633c0e",
    "correlationId": "order-cancel-1611-20251203235350",
    "orderStatus": "PendingCancellation",
    "note": "The cancellation will be processed asynchronously..."
  }
}
```

## 🏗️ Architecture Pattern

Dự án tuân thủ **Service Layer Pattern**:

1. **API Configuration** (`api.ts`) - Centralized endpoint definitions
2. **Service Layer** (`orders.service.ts`) - Business logic & API calls
3. **Composable** (`useOrderCancel.ts`) - Reactive state management
4. **Component** (`CancelOrderModal.vue`) - UI presentation

### Benefits:
- ✅ Separation of concerns
- ✅ Reusable service methods
- ✅ Type safety throughout
- ✅ Easy to test
- ✅ Follows microservices principles (no cross-service logic)

## 🔍 Files Modified/Created

### Modified:
1. `app/utils/api.ts` - Added `ORDER_CANCEL` endpoint
2. `app/services/orders.service.ts` - Added `cancelOrder()` method + types
3. `app/components/orders/CancelOrderModal.vue` - Updated to use service types
4. `app/composables/useOrderCancel.ts` - Updated to use ordersService

### Created:
1. `CANCEL_ORDER_MODAL_README.md` - Full documentation
2. `CANCEL_ORDER_IMPLEMENTATION_SUMMARY.md` - This file
3. `EXAMPLE_CancelOrderModal_Usage.vue` - Usage example

## ✨ Next Steps

Để sử dụng modal này trong trang chi tiết đơn hàng:

1. Import modal và composable
2. Thêm button "Hủy đơn hàng" 
3. Bind modal với state
4. Handle confirm event
5. Show toast notification khi thành công/thất bại
6. Refresh order data sau khi cancel

**Example integration in order detail page:**
```vue
<template>
  <div>
    <!-- Order detail content -->
    
    <UButton 
      color="error" 
      @click="showCancelModal = true"
    >
      Hủy đơn hàng
    </UButton>

    <CancelOrderModal
      v-model="showCancelModal"
      :order-code="order.orderCode"
      :order-total="order.orderTotal"
      :is-paid="order.paymentStatus === 'Paid'"
      @confirm="handleCancelOrder"
    />
  </div>
</template>
```
