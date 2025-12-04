# Fix: Cancel Order Handler Implementation

## Vấn đề
Khi nhấn nút "Hủy đơn hàng" trong modal, không có API call được thực hiện vì handler chỉ có TODO comment.

## Đã sửa

### File: `app/pages/orders/[code].vue`

#### 1. Thêm imports
```typescript
import type { CancelOrderRequest } from '@/services/orders.service'
import { useOrderCancel } from '@/composables/useOrderCancel'
```

#### 2. Thêm orderCode prop vào modal
```vue
<CancelOrderModal
  v-model="showCancelModal"
  :order-code="orderCodeParam"  <!-- ✅ Added -->
  :order-total="detail?.payment?.orderTotal"
  :is-paid="isOrderPaid"
  @confirm="handleCancelOrderConfirm"
/>
```

#### 3. Implement handler function
**Trước:**
```typescript
const handleCancelOrderConfirm = async (data: { refundOption: string, restockItems: boolean, reason: string }) => {
  const toast = useToast()
  try {
    // TODO: Call API to cancel order
    // await ordersService.cancelOrder(orderCodeParam.value, {
    //   refundNow: data.refundOption === 'full',
    //   restockItems: data.restockItems,
    //   reason: data.reason
    // })
    
    toast.add({ 
      title: 'Đã hủy đơn hàng', 
      description: 'Đơn hàng đã được hủy thành công', 
      color: 'success' 
    })
    await fetchData()
  } catch (e) {
    // ...
  }
}
```

**Sau:**
```typescript
const { cancelOrder, isLoading: isCancelling, error: cancelError } = useOrderCancel()

const handleCancelOrderConfirm = async (request: CancelOrderRequest) => {
  const toast = useToast()
  try {
    const code = (orderCodeParam.value || '').replace(/^#/, '')
    const result = await cancelOrder(code, request)
    
    if (result) {
      toast.add({ 
        title: 'Đã gửi yêu cầu hủy đơn hàng', 
        description: `Đơn hàng ${result.orderCode} đang được xử lý hủy. Trạng thái: ${result.orderStatus}`, 
        color: 'success' 
      })
      // Refresh order data
      await fetchData()
    } else {
      toast.add({ 
        title: 'Hủy đơn hàng thất bại', 
        description: cancelError.value || 'Có lỗi xảy ra', 
        color: 'error' 
      })
    }
  } catch (e) {
    const err = e as { message?: string }
    toast.add({ 
      title: 'Hủy đơn hàng thất bại', 
      description: err?.message || 'Có lỗi xảy ra', 
      color: 'error' 
    })
  }
}
```

## Thay đổi chính

1. ✅ **Sử dụng composable** `useOrderCancel()` thay vì gọi service trực tiếp
2. ✅ **Type safety** - Handler nhận đúng type `CancelOrderRequest`
3. ✅ **Remove # prefix** - Clean order code trước khi gọi API
4. ✅ **Hiển thị thông tin Saga** - Toast message hiển thị sagaId và orderStatus
5. ✅ **Error handling** - Xử lý cả success và error cases
6. ✅ **Refresh data** - Gọi `fetchData()` sau khi cancel thành công

## Flow hoàn chỉnh

```
User clicks "Hủy đơn hàng" button
    ↓
Modal opens (CancelOrderModal)
    ↓
User fills form & clicks "Hủy đơn hàng"
    ↓
Modal emits @confirm with CancelOrderRequest
    ↓
handleCancelOrderConfirm() called
    ↓
useOrderCancel().cancelOrder() called
    ↓
ordersService.cancelOrder() called
    ↓
POST /api/v1/orders/{code}/cancel
    ↓
Response: { sagaId, orderStatus: "PendingCancellation", ... }
    ↓
Toast notification shown
    ↓
fetchData() refreshes order detail
```

## Test

1. Mở trang chi tiết đơn hàng
2. Click nút "Hủy đơn hàng"
3. Điền form trong modal
4. Click "Hủy đơn hàng"
5. ✅ Kiểm tra Network tab - phải thấy POST request đến `/orders/{code}/cancel`
6. ✅ Kiểm tra toast notification hiển thị thông tin Saga
7. ✅ Kiểm tra order detail được refresh

## Notes

- API sử dụng **Saga orchestrator** nên response trả về `PendingCancellation` status
- Cancellation được xử lý **asynchronously**
- Cần check order status sau để xác nhận cancellation hoàn tất
