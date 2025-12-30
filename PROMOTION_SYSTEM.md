# Hệ Thống Khuyến Mãi & Voucher - POS

## Tổng Quan

Hệ thống khuyến mãi thông minh được tích hợp vào màn hình POS với các tính năng:

### ✨ Tính Năng Chính

1. **Khuyến mãi tự động (Buy X Get Y)**
   - Mua 10 sản phẩm tặng 1
   - Mua 5 cà phê tặng 1 bánh
   - Mua 3 trà sữa tặng 1 trà sữa
   - Tự động tính toán và thêm sản phẩm tặng kèm vào giỏ hàng

2. **Mã giảm giá/Voucher**
   - Nhập mã voucher để giảm giá
   - Hiển thị danh sách voucher khả dụng
   - Kiểm tra điều kiện tối thiểu
   - Kiểm tra hạn sử dụng

3. **Combo/Bundle Deals**
   - Mua combo sản phẩm với giá ưu đãi
   - Tự động áp dụng khi đủ điều kiện

4. **Giảm giá theo tổng đơn**
   - Giảm % hoặc số tiền cố định
   - Áp dụng khi đơn hàng đạt giá trị tối thiểu

## 🎯 Cách Sử Dụng

### Khuyến Mãi Tự Động

Khuyến mãi được tự động áp dụng khi:
- Thêm sản phẩm vào giỏ hàng
- Thay đổi số lượng sản phẩm
- Xóa sản phẩm khỏi giỏ hàng

**Sản phẩm tặng kèm:**
- Được đánh dấu với badge "TẶNG KÈM" màu hồng-tím
- Có viền hồng xung quanh hình ảnh
- Hiển thị "x[số lượng] (Tự động)"
- Không thể chỉnh sửa số lượng thủ công
- Tự động cập nhật khi thay đổi sản phẩm mua

### Mã Giảm Giá

1. Click nút **"Nhập mã giảm giá"** (màu tím) trong giỏ hàng
2. Chọn voucher từ danh sách hoặc nhập mã thủ công
3. Hệ thống kiểm tra:
   - Mã có hợp lệ không
   - Đơn hàng có đạt giá trị tối thiểu không
   - Mã có hết hạn không
4. Click "Áp dụng" để sử dụng voucher

**Voucher mẫu:**
- `SUMMER2024`: Giảm 15% (tối đa 100k) cho đơn từ 200k
- `NEWCUSTOMER`: Giảm 50k cho đơn từ 100k
- `VIP100K`: Giảm 100k cho đơn từ 500k
- `FLASH20`: Giảm 20% (tối đa 150k) cho đơn từ 300k

### Xem Khuyến Mãi Đang Áp Dụng

Trong giỏ hàng, bạn sẽ thấy:

1. **Khuyến mãi đang áp dụng** - Card màu hồng hiển thị:
   - Tên chương trình
   - Mô tả chi tiết
   - Danh sách quà tặng (nếu có)
   - Số tiền giảm (nếu có)

2. **Khuyến mãi sắp đạt được** - Card màu xanh hiển thị:
   - Các chương trình chưa đủ điều kiện
   - Gợi ý cần mua thêm bao nhiêu để đạt được

## 🔧 Cấu Hình Khuyến Mãi

### File: `app/utils/promotionEngine.ts`

```typescript
export const mockPromotions: Promotion[] = [
  {
    id: 'PROMO001',
    name: 'Mua 10 tặng 1',
    type: 'buy_x_get_y',
    active: true,
    priority: 10,
    conditions: {
      buyQuantity: 10,
      buyProductIds: [], // Rỗng = áp dụng cho tất cả
      buyCategories: []
    },
    rewards: {
      giftQuantity: 1,
      giftProductIds: [] // Rỗng = tặng cùng sản phẩm
    }
  }
]
```

### Các Loại Khuyến Mãi

#### 1. Buy X Get Y
```typescript
{
  type: 'buy_x_get_y',
  conditions: {
    buyQuantity: 5,           // Mua 5
    buyCategories: ['Cà phê'] // Trong danh mục Cà phê
  },
  rewards: {
    giftQuantity: 1,          // Tặng 1
    giftProductIds: [60, 61]  // Sản phẩm ID 60 hoặc 61
  }
}
```

#### 2. Total Discount
```typescript
{
  type: 'total_discount',
  conditions: {
    minTotalAmount: 500000    // Đơn tối thiểu 500k
  },
  rewards: {
    discountType: 'percent',  // Hoặc 'amount'
    discountValue: 10,        // 10%
    maxDiscount: 100000       // Tối đa 100k
  }
}
```

#### 3. Bundle
```typescript
{
  type: 'bundle',
  conditions: {
    requiredProducts: [
      { productId: 43, quantity: 1 },
      { productId: 44, quantity: 1 }
    ]
  },
  rewards: {
    bundlePrice: 90000        // Giá combo (thay vì 105k)
  }
}
```

## 💡 Ưu Tiên Khuyến Mãi

Khuyến mãi được áp dụng theo thứ tự ưu tiên (priority):
- Số càng cao = ưu tiên càng cao
- Nhiều khuyến mãi có thể áp dụng cùng lúc
- Giảm giá được cộng dồn

## 🎨 Giao Diện

### Màu Sắc
- **Voucher**: Tím-Hồng gradient
- **Khuyến mãi**: Hồng-Tím gradient
- **Sản phẩm tặng**: Hồng pastel background
- **Badge tặng kèm**: Gradient hồng-tím

### Icons
- 🎁 Gift icon cho sản phẩm tặng
- 🎟️ Ticket icon cho voucher
- ✓ Checkmark cho đã áp dụng

## 📊 Tính Toán Giảm Giá

Tổng giảm giá = Giảm giá thủ công + Giảm giá khuyến mãi + Giảm giá voucher

1. **Giảm giá thủ công**: Từ modal giảm giá (F6)
2. **Giảm giá khuyến mãi**: Tự động từ các chương trình
3. **Giảm giá voucher**: Từ mã voucher đã nhập

## 🔄 Cập Nhật Tự Động

Hệ thống tự động:
- Tính toán lại khuyến mãi khi giỏ hàng thay đổi
- Thêm/xóa sản phẩm tặng kèm
- Cập nhật số lượng quà tặng
- Kiểm tra điều kiện voucher

## 🚀 Tích Hợp API (Production)

Trong production, thay thế mock data bằng API calls:

```typescript
// Fetch promotions from API
const { data: promotions } = await $fetch('/api/promotions/active')

// Validate voucher
const { data: voucher } = await $fetch('/api/vouchers/validate', {
  method: 'POST',
  body: { code: voucherCode, total: cartTotal }
})
```

## 📝 Ghi Chú

- Sản phẩm tặng kèm có giá = 0
- Không thể chỉnh sửa số lượng sản phẩm tặng
- Xóa sản phẩm mua sẽ tự động xóa quà tặng
- Voucher và khuyến mãi có thể dùng cùng lúc
- Ưu tiên cao hơn được áp dụng trước

## 🎯 Keyboard Shortcuts

- `F6`: Mở modal giảm giá thủ công
- Click vào voucher button: Mở modal voucher

## 🔐 Quyền Hạn

Trong production, có thể giới hạn:
- Chỉ manager mới được tạo/sửa khuyến mãi
- Giới hạn số lần sử dụng voucher
- Giới hạn voucher theo khách hàng
- Log lại lịch sử sử dụng voucher
