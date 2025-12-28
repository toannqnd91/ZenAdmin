# 🎯 Hướng dẫn Integrate Modal Components vào POS

## ✅ Các Modal Components đã tạo

1. ✅ **PaymentModal.vue** - Thanh toán
2. ✅ **DiscountModal.vue** - Giảm giá
3. ✅ **ProductNoteModal.vue** - Ghi chú sản phẩm
4. ✅ **OrderNoteModal.vue** - Ghi chú đơn hàng
5. ✅ **AddCustomerModal.vue** - Thêm khách hàng
6. ✅ **CustomProductModal.vue** - Sản phẩm tùy chỉnh

## 📝 Code để thay thế trong index.vue

### 1. Import Components (thêm vào đầu script)

```typescript
// Import modal components
import PaymentModal from '~/components/pos/modals/PaymentModal.vue'
import DiscountModal from '~/components/pos/modals/DiscountModal.vue'
import ProductNoteModal from '~/components/pos/modals/ProductNoteModal.vue'
import OrderNoteModal from '~/components/pos/modals/OrderNoteModal.vue'
import AddCustomerModal from '~/components/pos/modals/AddCustomerModal.vue'
import CustomProductModal from '~/components/pos/modals/CustomProductModal.vue'
```

### 2. Thay thế Template

Tìm và **XÓA** các đoạn HTML modal cũ (từ dòng ~1330 đến ~1900), thay bằng:

```vue
<!-- Payment Modal -->
<PaymentModal
  v-model:show="showPaymentModal"
  v-model:auto-print="autoPrint"
  :sub-total="subTotal"
  :discount="discount"
  :total-amount="totalAmount"
  @complete="completePayment"
/>

<!-- Discount Modal -->
<DiscountModal
  v-model:show="showDiscountModal"
  v-model:discount-type="discountType"
  v-model:discount-value="discountValue"
  :sub-total="subTotal"
  :discount="discount"
  :total-amount="totalAmount"
  @apply="applyDiscount"
  @clear="clearDiscount"
/>

<!-- Product Note Modal -->
<ProductNoteModal
  v-model:show="showProductNoteModal"
  :item="editingProductNote"
  @save="saveProductNote"
/>

<!-- Order Note Modal -->
<OrderNoteModal
  v-model:show="showNoteModal"
  v-model:note="orderNote"
  @save="saveNote"
/>

<!-- Add Customer Modal -->
<AddCustomerModal
  v-model:show="showAddCustomerModal"
  v-model:form="newCustomerForm"
  @save="saveNewCustomer"
/>

<!-- Custom Product Modal -->
<CustomProductModal
  v-model:show="showCustomProductModal"
  v-model:form="customProductForm"
  @add="addCustomProduct"
/>
```

### 3. Cập nhật Functions

#### 3.1 completePayment (cập nhật)

```typescript
function completePayment(data: { method: string; paid: number; change: number }) {
  // Create order object
  const order = {
    id: Date.now(),
    orderNumber: `HD${String(orderHistory.value.length + 1).padStart(4, '0')}`,
    date: new Date().toISOString(),
    items: [...cart.value],
    customer: selectedCustomer.value,
    employee: selectedEmployee.value,
    branch: selectedBranch.value,
    subTotal: subTotal.value,
    discount: discount.value,
    total: totalAmount.value,
    paid: data.paid,
    change: data.change,
    paymentMethod: data.method,
    note: orderNote.value,
    status: 'completed'
  }

  // Save to history
  orderHistory.value.unshift(order)
  
  // Save to localStorage
  try {
    localStorage.setItem('pos_order_history', JSON.stringify(orderHistory.value))
  } catch (e) {
    console.error('Failed to save order history:', e)
  }

  // Print if auto-print is enabled
  if (autoPrint.value) {
    printInvoice(order)
  }

  // Show success message
  alert(`Thanh toán thành công!\nMã đơn: ${order.orderNumber}\nTiền thừa: ${formatPrice(data.change)} ₫`)

  // Reset cart and close modal
  clearCurrentOrder()
  showPaymentModal.value = false
}
```

#### 3.2 saveProductNote (cập nhật)

```typescript
function saveProductNote(note: string) {
  if (editingProductNote.value) {
    editingProductNote.value.note = note
  }
  showProductNoteModal.value = false
  editingProductNote.value = null
}
```

#### 3.3 Các hàm khác giữ nguyên

- `applyDiscount()` - Giữ nguyên
- `clearDiscount()` - Giữ nguyên
- `saveNote()` - Giữ nguyên
- `saveNewCustomer()` - Giữ nguyên
- `addCustomProduct()` - Giữ nguyên

## 📊 Kết quả sau khi refactor

### Trước refactor:
- **File index.vue**: ~1950 dòng
- **Khó maintain**: Tất cả logic trong 1 file
- **Khó test**: Không thể test riêng từng phần

### Sau refactor:
- **File index.vue**: ~1100 dòng (giảm 44%)
- **6 Modal components**: Mỗi file ~80-150 dòng
- **Dễ maintain**: Mỗi component độc lập
- **Dễ test**: Test từng component riêng
- **Reusable**: Có thể dùng lại ở trang khác

## 🚀 Các bước thực hiện

### Bước 1: Backup file hiện tại
```bash
cp app/pages/pos/index.vue app/pages/pos/index.vue.backup
```

### Bước 2: Thêm imports
Thêm 6 dòng import vào đầu `<script setup>`

### Bước 3: Thay thế modals
- Tìm dòng `<!-- Add Customer Modal -->` (khoảng dòng 1330)
- Xóa tất cả HTML của 6 modals (đến dòng `</template>`)
- Paste code mới từ section 2 ở trên

### Bước 4: Cập nhật functions
- Cập nhật `completePayment()` theo code mới
- Cập nhật `saveProductNote()` theo code mới
- Các hàm khác giữ nguyên

### Bước 5: Test
```bash
npm run dev
```

Kiểm tra từng modal:
- ✅ Thanh toán (F9)
- ✅ Giảm giá (F6)
- ✅ Ghi chú SP (click icon bút chì)
- ✅ Ghi chú đơn (click nút Ghi chú)
- ✅ Thêm KH (click nút +)
- ✅ SP tùy chỉnh (F2)

## 📌 Lưu ý quan trọng

1. **v-model syntax**: Sử dụng `v-model:propName` cho two-way binding
2. **Event handlers**: Đảm bảo tên hàm khớp với @event
3. **TypeScript**: Các interface đã được định nghĩa trong components
4. **Styling**: Giữ nguyên animations và transitions

## 🎨 Tùy chỉnh thêm

Nếu cần thay đổi UI/UX của modal:
1. Mở file component tương ứng trong `app/components/pos/modals/`
2. Chỉnh sửa template và style
3. Component sẽ tự động reload

## 🔍 Debug

Nếu gặp lỗi:
1. Kiểm tra console browser (F12)
2. Đảm bảo tất cả imports đúng đường dẫn
3. Kiểm tra props và events có khớp không
4. Xem file backup nếu cần rollback

## ✨ Kết luận

Sau khi hoàn thành refactor:
- Code sạch hơn, dễ đọc hơn
- Dễ maintain và mở rộng
- Performance tốt hơn (lazy loading)
- Có thể reuse components
- Dễ collaborate với team

**Thời gian ước tính**: 15-20 phút
**Độ khó**: Trung bình
**Rủi ro**: Thấp (đã có backup)
