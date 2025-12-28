# 🚀 HƯỚNG DẪN REFACTOR NHANH - 5 PHÚT

## ✅ Đã hoàn thành:
- ✅ Imports đã được thêm vào file index.vue (dòng 4-11)
- ✅ Tất cả 7 modal components đã sẵn sàng

## 📝 CÒN LẠI: Thay thế Template

### Bước 1: Tìm và xóa các Modal HTML cũ

Mở file `app/pages/pos/index.vue` và tìm kiếm (Ctrl+F) các đoạn sau để XÓA:

1. **Tìm**: `<!-- Note Modal -->`
   - Xóa từ đây đến hết modal đó (khoảng 30 dòng)

2. **Tìm**: `<!-- Custom Product Modal -->`
   - Xóa từ đây đến hết modal đó (khoảng 40 dòng)

3. **Tìm**: `<!-- Payment Modal -->`
   - Xóa từ đây đến hết modal đó (khoảng 120 dòng)

4. **Tìm**: `<!-- Discount Modal -->`
   - Xóa từ đây đến hết modal đó (khoảng 100 dòng)

5. **Tìm**: `<!-- Product Note Modal -->`
   - Xóa từ đây đến hết modal đó (khoảng 50 dòng)

6. **Tìm**: `<!-- Return/Exchange Modal -->`
   - Xóa từ đây đến hết modal đó (khoảng 180 dòng)

7. **Tìm**: `<!-- Add Customer Modal -->`
   - Xóa từ đây đến hết modal đó (khoảng 60 dòng)

**LƯU Ý**: KHÔNG xóa thẻ `</template>` cuối cùng!

### Bước 2: Thêm Component Tags

Sau khi xóa xong tất cả modal HTML, thêm đoạn code sau TRƯỚC thẻ `</template>`:

```vue
  <!-- Payment Modal -->
  <PaymentModal
    v-model:show="showPaymentModal"
    v-model:auto-print="autoPrint"
    :sub-total="subTotal"
    :discount="discount"
    :total-amount="totalAmount"
    @complete="handlePaymentComplete"
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
    @save="handleSaveProductNote"
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
    @process="handleProcessReturn"
  />
```

### Bước 3: Thêm Handler Functions

Tìm phần functions trong `<script setup>` và thêm 3 functions sau (hoặc cập nhật nếu đã có):

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

## ✅ Checklist

- [x] Imports đã thêm
- [ ] Xóa modal HTML cũ (7 modals)
- [ ] Thêm component tags mới
- [ ] Thêm 3 handler functions
- [ ] Test tất cả modals

## 🎯 Kết quả

Sau khi hoàn thành:
- File index.vue giảm từ ~1,950 dòng xuống ~1,100 dòng
- Code sạch, dễ đọc, dễ maintain
- Tất cả modals hoạt động bình thường

## ⚡ Lưu ý

- Nếu gặp lỗi TypeScript, kiểm tra lại tên biến
- Nếu modal không hiện, kiểm tra v-model bindings
- Backup file trước khi refactor!

---

**Thời gian ước tính**: 5-10 phút  
**Độ khó**: Dễ (chỉ copy-paste)
