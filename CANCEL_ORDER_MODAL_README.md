# Cancel Order Modal - Implementation Guide

## Overview
Modal component for canceling orders with support for refund options, inventory restocking, and cancellation reasons.

## API Integration

### Endpoint
```
POST /api/v1/orders/{orderCode}/cancel
```

### Request Body
```typescript
{
  reason: CancellationReasonEnum,      // 1-99
  note: string,                        // Optional note
  refundOption: RefundOptionEnum,      // 1 or 2
  restockAllItems: boolean,            // true/false
  idempotencyKey: string | null,       // Optional
  createdById: string | null           // Optional
}
```

### Enums

#### CancellationReasonEnum
| Value | Label | Description |
|-------|-------|-------------|
| 1 | Khách hàng yêu cầu | Customer Requested |
| 2 | Tạo nhầm | Created By Mistake |
| 3 | Hết hàng | Out Of Stock |
| 4 | Thay đổi giá | Price Changed |
| 5 | Vấn đề thanh toán | Payment Issue |
| 99 | Lý do khác | Other |

#### RefundOptionEnum
| Value | Label | Description |
|-------|-------|-------------|
| 1 | Hoàn tiền ngay | Refund Now |
| 2 | Hoàn trả sau | Refund Later |

### Response
```typescript
{
  code: "202",
  success: true,
  message: "Success",
  data: {
    message: "Order cancellation request submitted to Saga orchestrator",
    orderCode: "HD000086",
    sagaId: "54b60e88-98f5-4342-9e72-f069e8633c0e",
    correlationId: "order-cancel-1611-20251203235350",
    orderStatus: "PendingCancellation",
    note: "The cancellation will be processed asynchronously..."
  }
}
```

## Component Usage

### Basic Example
```vue
<script setup lang="ts">
import { ref } from 'vue'
import CancelOrderModal from '@/components/orders/CancelOrderModal.vue'
import { useOrderCancel } from '@/composables/useOrderCancel'

const showCancelModal = ref(false)
const orderCode = ref('HD000086')
const orderTotal = ref(500000)
const isPaid = ref(true)

const { cancelOrder } = useOrderCancel()

async function handleCancelConfirm(request: any) {
  const result = await cancelOrder(orderCode.value, request)
  if (result) {
    // Show success notification
    console.log('Success:', result.data)
  }
}
</script>

<template>
  <UButton @click="showCancelModal = true">
    Hủy đơn hàng
  </UButton>

  <CancelOrderModal
    v-model="showCancelModal"
    :order-code="orderCode"
    :order-total="orderTotal"
    :is-paid="isPaid"
    @confirm="handleCancelConfirm"
  />
</template>
```

### Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| modelValue | boolean | No | false | Controls modal visibility |
| orderCode | string | Yes | - | Order code to cancel |
| orderTotal | number | No | 0 | Total order amount (for refund display) |
| isPaid | boolean | No | false | Whether order has been paid (shows refund options) |

### Events
| Event | Payload | Description |
|-------|---------|-------------|
| update:modelValue | boolean | Emitted when modal is opened/closed |
| confirm | CancelOrderRequest | Emitted when user confirms cancellation |

## Features

### 1. Refund Options (Conditional)
- Only shown if `isPaid` is `true`
- **Hoàn tiền ngay**: Refund immediately with amount display
- **Hoàn trả sau**: Refund later

### 2. Inventory Restocking
- Checkbox to restore all items back to inventory
- Default: checked (true)

### 3. Cancellation Reason
- Dropdown select with predefined reasons
- Maps to API enum values
- Default: "Lý do khác" (Other)

### 4. Optional Note
- Textarea for additional notes/comments
- Optional field

## Files

### Component
- `app/components/orders/CancelOrderModal.vue` - Main modal component

### Service Layer
- `app/services/orders.service.ts` - OrdersService with `cancelOrder()` method
- `app/utils/api.ts` - API endpoint configuration (`ORDER_CANCEL`)

### Composable
- `app/composables/useOrderCancel.ts` - Composable wrapper for service

### Example
- `EXAMPLE_CancelOrderModal_Usage.vue` - Usage example

## Architecture

```
┌─────────────────────┐
│  CancelOrderModal   │ (UI Component)
└──────────┬──────────┘
           │ emits confirm event
           ▼
┌─────────────────────┐
│  useOrderCancel()   │ (Composable)
└──────────┬──────────┘
           │ calls
           ▼
┌─────────────────────┐
│  ordersService      │ (Service Layer)
│  .cancelOrder()     │
└──────────┬──────────┘
           │ uses
           ▼
┌─────────────────────┐
│  API_ENDPOINTS      │ (Configuration)
│  .ORDER_CANCEL()    │
└─────────────────────┘
```

## Architecture Notes

✅ **Follows Microservices Principles:**
- Component only handles UI and user interaction
- API call is delegated to composable
- No direct database access
- Uses well-defined API contract
- Async processing via Saga pattern (response indicates "PendingCancellation")

## Testing

### Manual Test Checklist
- [ ] Modal opens/closes correctly
- [ ] Refund options only show when `isPaid` is true
- [ ] All cancellation reasons are selectable
- [ ] Restock checkbox works
- [ ] Note field accepts text input
- [ ] Confirm button sends correct request format
- [ ] Loading state displays during API call
- [ ] Error messages display on failure
- [ ] Success notification on completion

### API Test
```bash
curl -X POST http://localhost:5000/api/v1/orders/HD000086/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "reason": 1,
    "note": "Testing",
    "refundOption": 1,
    "restockAllItems": true,
    "idempotencyKey": null,
    "createdById": null
  }'
```

## Notes
- The API uses **Saga orchestrator** for async processing
- Order status becomes "PendingCancellation" immediately
- Actual cancellation completes asynchronously
- Check order status separately for completion
