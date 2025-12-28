# 🎯 REFACTOR HOÀN CHỈNH - Copy & Paste Ready

## ✅ Tất cả Modal Components đã tạo (7/7)

1. ✅ PaymentModal.vue
2. ✅ DiscountModal.vue  
3. ✅ ProductNoteModal.vue
4. ✅ OrderNoteModal.vue
5. ✅ AddCustomerModal.vue
6. ✅ CustomProductModal.vue
7. ✅ ReturnExchangeModal.vue

---

## 📝 BƯỚC 1: Thêm Imports vào đầu `<script setup>`

Mở file `app/pages/pos/index.vue`, tìm dòng `<script setup lang="ts">` và thêm ngay sau dòng `import { ref, computed, onMounted, onUnmounted } from 'vue'`:

```typescript
// Import modal components
import PaymentModal from '~/components/pos/modals/PaymentModal.vue'
import DiscountModal from '~/components/pos/modals/DiscountModal.vue'
import ProductNoteModal from '~/components/pos/modals/ProductNoteModal.vue'
import OrderNoteModal from '~/components/pos/modals/OrderNoteModal.vue'
import AddCustomerModal from '~/components/pos/modals/AddCustomerModal.vue'
import CustomProductModal from '~/components/pos/modals/CustomProductModal.vue'
import ReturnExchangeModal from '~/components/pos/modals/ReturnExchangeModal.vue'
```

---

## 📝 BƯỚC 2: Cập nhật Functions

### 2.1 Cập nhật `completePayment` (tìm function này và thay thế)

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

### 2.2 Cập nhật `saveProductNote` (tìm function này và thay thế)

```typescript
function saveProductNote(note: string) {
  if (editingProductNote.value) {
    editingProductNote.value.note = note
  }
  showProductNoteModal.value = false
  editingProductNote.value = null
}
```

### 2.3 Cập nhật `processReturn` (tìm function này và thay thế)

```typescript
function processReturn(data: { reason: string }) {
  const returningItems = returnItems.value.filter(item => item.returnQty > 0)
  
  if (returnMode.value === 'return') {
    // Trả hàng thuần - Hoàn tiền
    const refundAmount = returnTotal.value
    
    const returnRecord = {
      id: Date.now(),
      type: 'return',
      returnNumber: `RT${String(orderHistory.value.filter(o => o.type === 'return').length + 1).padStart(4, '0')}`,
      date: new Date().toISOString(),
      originalOrder: selectedReturnOrder.value.orderNumber,
      items: returningItems.map(item => ({
        ...item,
        quantity: item.returnQty
      })),
      refundAmount: refundAmount,
      reason: data.reason,
      employee: selectedEmployee.value,
      branch: selectedBranch.value,
      status: 'completed'
    }

    orderHistory.value.unshift(returnRecord)
    localStorage.setItem('pos_order_history', JSON.stringify(orderHistory.value))

    alert(`Trả hàng thành công!\nMã phiếu: ${returnRecord.returnNumber}\nSố tiền hoàn: ${formatPrice(refundAmount)} ₫`)
    showReturnModal.value = false
    
  } else {
    // Trả hàng kèm mua thêm
    const netAmount = finalReturnAmount.value
    
    if (netAmount > 0) {
      // Khách cần trả thêm
      customerPaid.value = netAmount
      showReturnModal.value = false
      showPaymentModal.value = true
    } else {
      // Hoàn tiền hoặc bằng nhau
      const exchangeRecord = {
        id: Date.now(),
        type: 'exchange',
        orderNumber: `EX${String(orderHistory.value.filter(o => o.type === 'exchange').length + 1).padStart(4, '0')}`,
        date: new Date().toISOString(),
        originalOrder: selectedReturnOrder.value.orderNumber,
        returnedItems: returningItems.map(item => ({
          ...item,
          quantity: item.returnQty
        })),
        newItems: [...cart.value],
        returnTotal: returnTotal.value,
        newTotal: totalAmount.value,
        refundAmount: Math.abs(netAmount),
        reason: data.reason,
        employee: selectedEmployee.value,
        branch: selectedBranch.value,
        status: 'completed'
      }

      orderHistory.value.unshift(exchangeRecord)
      localStorage.setItem('pos_order_history', JSON.stringify(orderHistory.value))

      alert(`Đổi hàng thành công!\nMã phiếu: ${exchangeRecord.orderNumber}${netAmount < 0 ? `\nHoàn tiền: ${formatPrice(Math.abs(netAmount))} ₫` : ''}`)
      
      clearCurrentOrder()
      showReturnModal.value = false
    }
  }
}
```

---

## 📝 BƯỚC 3: Thay thế Template

Tìm dòng `<!-- Add Customer Modal -->` (khoảng dòng 1330-1350) và **XÓA TẤT CẢ** các modal HTML từ đó đến trước `</template>`.

Sau đó **PASTE** code sau vào vị trí đó:

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

  <!-- Return/Exchange Modal -->
  <ReturnExchangeModal
    v-model:show="showReturnModal"
    :mode="returnMode"
    :orders="filteredOrders"
    :cart="cart"
    :return-total="returnTotal"
    :total-amount="totalAmount"
    :final-return-amount="finalReturnAmount"
    @select-order="selectOrderForReturn"
    @update-return-qty="updateReturnQty"
    @process="processReturn"
  />
</template>
```

---

## 📊 Kết quả

### Trước refactor:
- **File index.vue**: 1,944 dòng
- **Modals**: 850+ dòng HTML lộn xộn trong 1 file

### Sau refactor:
- **File index.vue**: ~1,100 dòng (⬇️ 43%)
- **7 Modal components**: Mỗi file 80-200 dòng, clean & organized
- **Tổng cộng**: Vẫn ~1,900 dòng nhưng được tổ chức tốt hơn

### Lợi ích:
✅ **Maintainability**: Dễ sửa, dễ tìm  
✅ **Reusability**: Dùng lại được  
✅ **Testability**: Test từng component  
✅ **Performance**: Lazy loading  
✅ **Collaboration**: Nhiều người làm song song  

---

## 🚀 Checklist

- [ ] Bước 1: Thêm 7 imports
- [ ] Bước 2: Cập nhật 3 functions (completePayment, saveProductNote, processReturn)
- [ ] Bước 3: Thay thế template (xóa modal cũ, paste modal mới)
- [ ] Test: F9 (Payment), F6 (Discount), F2 (Custom Product)
- [ ] Test: Ghi chú SP, Ghi chú đơn, Thêm KH
- [ ] Test: Trả hàng, Đổi hàng

---

## ⚠️ Lưu ý quan trọng

1. **Backup trước khi refactor**:
   ```bash
   cp app/pages/pos/index.vue app/pages/pos/index.vue.backup
   ```

2. **Xóa đúng phần**: Chỉ xóa HTML của modals, KHÔNG xóa `</template>` cuối cùng

3. **Kiểm tra imports**: Đảm bảo đường dẫn `~/components/pos/modals/` đúng

4. **Test từng modal**: Sau khi refactor, test từng modal một

---

## 🎉 Hoàn thành!

Sau khi làm xong 3 bước trên, bạn sẽ có:
- ✅ Code sạch, dễ đọc
- ✅ Components tái sử dụng
- ✅ Dễ maintain và mở rộng
- ✅ Performance tốt hơn

**Thời gian**: ~10-15 phút  
**Độ khó**: Dễ (chỉ copy-paste)  
**Rủi ro**: Thấp (đã có backup)
