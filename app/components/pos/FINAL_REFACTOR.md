# 🎯 FINAL REFACTOR GUIDE - EXACT CODE TO REPLACE

## ✅ Status
- ✅ Imports đã thêm (dòng 4-11)
- ⏳ Cần thay thế 7 modals HTML → Components

## 📝 HƯỚNG DẪN CHÍNH XÁC

### Bước 1: Xóa Modal HTML (Dòng 1358-1907)

Mở file `app/pages/pos/index.vue` và **XÓA TOÀN BỘ** từ dòng **1358** đến dòng **1907** (550 dòng).

**Tìm dòng bắt đầu** (dòng 1358):
```vue
    <!-- Add Customer Modal -->
```

**Tìm dòng kết thúc** (dòng 1907):
```vue
  </div>
```

**XÓA TẤT CẢ** từ dòng 1358 đến 1907 (bao gồm cả 2 dòng trên).

---

### Bước 2: Thêm Component Tags

Sau khi xóa xong, tại vị trí dòng 1358 (nơi bạn vừa xóa), **PASTE** đoạn code sau:

```vue
    <!-- Modal Components -->
    <AddCustomerModal
      v-model:show="showAddCustomerModal"
      v-model:form="newCustomerForm"
      @save="saveNewCustomer"
    />

    <OrderNoteModal
      v-model:show="showNoteModal"
      v-model:note="orderNote"
      @save="saveNote"
    />

    <CustomProductModal
      v-model:show="showCustomProductModal"
      v-model:form="customProductForm"
      @add="addCustomProduct"
    />

    <PaymentModal
      v-model:show="showPaymentModal"
      v-model:auto-print="autoPrint"
      :sub-total="subTotal"
      :discount="discount"
      :total-amount="totalAmount"
      @complete="handlePaymentComplete"
    />

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

    <ProductNoteModal
      v-model:show="showProductNoteModal"
      :item="editingProductNote"
      @save="handleSaveProductNote"
    />

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
      @process="handleProcessReturn"
    />
  </div>
</template>
```

---

### Bước 3: Thêm Handler Functions

Tìm phần functions trong `<script setup>` (sau các computed properties), thêm 3 functions sau:

**Tìm vị trí**: Sau function `processReturn` hoặc cuối phần functions, thêm:

```typescript
// Handler for Payment Modal
function handlePaymentComplete(data: { method: string; paid: number; change: number }) {
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

  orderHistory.value.unshift(order)
  
  try {
    localStorage.setItem('pos_order_history', JSON.stringify(orderHistory.value))
  } catch (e) {
    console.error('Failed to save order history:', e)
  }

  if (autoPrint.value) {
    printInvoice(order)
  }

  alert(`Thanh toán thành công!\nMã đơn: ${order.orderNumber}\nTiền thừa: ${formatPrice(data.change)} ₫`)

  clearCurrentOrder()
  showPaymentModal.value = false
}

// Handler for Product Note Modal
function handleSaveProductNote(note: string) {
  if (editingProductNote.value) {
    editingProductNote.value.note = note
  }
  showProductNoteModal.value = false
  editingProductNote.value = null
}

// Handler for Return/Exchange Modal
function handleProcessReturn(data: { reason: string }) {
  const returningItems = returnItems.value.filter(item => item.returnQty > 0)
  
  if (returnMode.value === 'return') {
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
    const netAmount = finalReturnAmount.value
    
    if (netAmount > 0) {
      customerPaid.value = netAmount
      showReturnModal.value = false
      showPaymentModal.value = true
    } else {
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

### Bước 4: Xóa các function cũ (nếu có)

Tìm và **XÓA** các functions sau nếu chúng tồn tại:
- `completePayment()` (không có data parameter)
- `saveProductNote()` (không có note parameter)
- `processReturn()` (không có data parameter)

---

## ✅ Kết quả

Sau khi hoàn thành:
- ✅ File giảm từ **1,955 dòng** → **~1,350 dòng** (⬇️ 31%)
- ✅ 7 modals HTML → 7 component tags (sạch hơn 90%)
- ✅ Code dễ đọc, dễ maintain
- ✅ Tất cả tính năng hoạt động bình thường

---

## 🎯 Quick Summary

1. **Xóa**: Dòng 1358-1907 (550 dòng modal HTML)
2. **Paste**: 7 component tags (60 dòng)
3. **Thêm**: 3 handler functions (120 dòng)

**Tổng**: Giảm 370 dòng code! 🎉

---

## 🚀 Test

Sau khi refactor, test các tính năng:
- [ ] F9 → Payment modal
- [ ] F6 → Discount modal
- [ ] F2 → Custom product modal
- [ ] Click icon bút → Product note modal
- [ ] Click "Ghi chú" → Order note modal
- [ ] Click "+" → Add customer modal
- [ ] Click "Trả hàng" → Return modal
- [ ] Click "Đổi hàng" → Exchange modal

Tất cả phải hoạt động bình thường!
