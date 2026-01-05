# CartSidebar Component - Hướng dẫn sử dụng

## Tổng quan
Component `CartSidebar.vue` là phiên bản tối ưu của giỏ hàng POS với:
- ✅ Layout gọn gàng, nhiều không gian cho danh sách sản phẩm
- ✅ Customer section compact
- ✅ Promotions collapsible
- ✅ Smooth scrolling với custom scrollbar
- ✅ Responsive và dễ bảo trì

## Cách sử dụng trong index.vue

### 1. Import đã thêm (✅ Done)
```typescript
import CartSidebar from '~/components/pos/CartSidebar.vue'
```

### 2. Thay thế phần `<aside>` cũ bằng:

Tìm dòng có `<aside v-if="viewMode === 'sales'...` (khoảng dòng 1150-1500)

Thay thế toàn bộ phần `<aside>...</aside>` bằng:

```vue
<CartSidebar
  :cart="cart"
  :selected-customer="selectedCustomer"
  :customer-search-query="customerSearchQuery"
  :is-customer-dropdown-open="isCustomerDropdownOpen"
  :filtered-customers="filteredCustomers"
  :applied-promotions="appliedPromotions"
  :applied-voucher="appliedVoucher"
  :sub-total="subTotal"
  :discount="discount"
  :total-amount="totalAmount"
  :total-quantity="totalQuantity"
  @update:customerSearchQuery="customerSearchQuery = $event"
  @update:isCustomerDropdownOpen="isCustomerDropdownOpen = $event"
  @select-customer="selectCustomer"
  @remove-customer="removeCustomer"
  @open-add-customer-modal="openAddCustomerModal"
  @update-quantity="updateQuantity"
  @remove-from-cart="removeFromCart"
  @open-product-note-modal="openProductNoteModal"
  @open-voucher-modal="openVoucherModal"
  @remove-voucher="removeVoucher"
  @remove-promotion="removePromotion"
  @open-discount-modal="openDiscountModal"
  @open-payment-modal="openPaymentModal"
/>
```

### 3. Điều kiện hiển thị

Component sẽ tự động hiển thị khi:
- `viewMode === 'sales'` HOẶC
- `viewMode === 'return' && isReturnOrderSelected`

Điều kiện này đã được xử lý trong component.

## Tính năng

### Customer Section
- Compact design (padding giảm từ 4 → 3)
- Avatar nhỏ hơn (10 → 8)
- Dropdown height giảm (max-h-64 → max-h-48)

### Promotions
- Collapsible với max-height
- Scroll riêng nếu quá nhiều

### Cart Items
- Flex-1 để chiếm toàn bộ không gian còn lại
- Custom scrollbar đẹp mắt
- Compact spacing (p-3 → p-2.5)
- Image size tối ưu (w-12 h-12)

### Summary
- Fixed ở bottom
- Số tiền lớn, dễ đọc
- Button thanh toán nổi bật

## Lợi ích

1. **Nhiều không gian hơn**: Danh sách sản phẩm có thể hiển thị 8-10 items cùng lúc
2. **Dễ bảo trì**: Tách riêng component, code sạch hơn
3. **Performance**: Chỉ re-render khi cần thiết
4. **Scalable**: Dễ dàng thêm tính năng mới

## Notes

- Component sử dụng `v-model` pattern cho 2-way binding
- Tất cả events đều được emit ra ngoài
- Không có logic business bên trong, chỉ UI
- Compatible với toàn bộ features hiện tại (promotions, vouchers, gifts, etc.)
