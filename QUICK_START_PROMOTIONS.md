# 🚀 Quick Start Guide - Hệ Thống Khuyến Mãi POS

## Bắt Đầu Nhanh

### 1. Khuyến Mãi Tự Động "Mua 10 Tặng 1"

**Cách test:**
```
1. Mở màn hình POS (http://localhost:3000/pos)
2. Thêm 10 sản phẩm bất kỳ vào giỏ hàng
3. ✨ Sản phẩm tặng kèm sẽ tự động xuất hiện!
```

**Nhận biết sản phẩm tặng:**
- Badge "TẶNG KÈM" màu hồng-tím ở góc phải trên
- Background gradient hồng-tím pastel
- Viền hồng xung quanh hình ảnh
- Text "x1 (Tự động)" màu hồng
- Giá = 0₫ (Miễn phí)

---

### 2. Mã Giảm Giá/Voucher

**Cách sử dụng:**
```
1. Thêm sản phẩm vào giỏ (tổng > 100k)
2. Click nút "Nhập mã giảm giá" (màu tím)
3. Chọn voucher "NEWCUSTOMER" hoặc nhập mã
4. Click "Áp dụng"
5. ✨ Giảm 50k ngay lập tức!
```

**Voucher để test:**

| Mã | Giảm | Đơn tối thiểu | Mô tả |
|---|---|---|---|
| `NEWCUSTOMER` | 50,000₫ | 100,000₫ | Khách hàng mới |
| `SUMMER2024` | 15% (max 100k) | 200,000₫ | Khuyến mãi hè |
| `VIP100K` | 100,000₫ | 500,000₫ | Voucher VIP |
| `FLASH20` | 20% (max 150k) | 300,000₫ | Flash sale |

---

### 3. Khuyến Mãi Theo Danh Mục

#### Mua 5 Cà Phê Tặng 1 Bánh
```
1. Thêm 5 sản phẩm từ danh mục "Cà phê"
2. ✨ Nhận 1 bánh miễn phí (Croissant/Tiramisu/Mousse)
```

#### Mua 3 Trà Sữa Tặng 1 Trà Sữa
```
1. Thêm 3 sản phẩm từ danh mục "Trà sữa"
2. ✨ Nhận thêm 1 trà sữa miễn phí
```

---

### 4. Combo Deal

**Combo Sinh Tố:**
```
1. Thêm 1x Sinh tố bơ (55k)
2. Thêm 1x Sinh tố xoài (50k)
3. ✨ Giá combo chỉ 90k (tiết kiệm 15k!)
```

---

### 5. Giảm Giá Theo Tổng Đơn

```
1. Thêm sản phẩm cho đến khi tổng ≥ 500k
2. ✨ Tự động giảm 10% (tối đa 100k)
```

---

## 🎯 Scenarios Test

### Scenario 1: Khách Hàng Mua Nhiều
```
Giỏ hàng:
- 12x Cà phê đen đá (25k) = 300k

Kết quả:
✅ Tặng 1x Cà phê đen đá (mua 10 tặng 1)
✅ Tặng 2x Bánh (mua 5 cà phê tặng 1 bánh, x2 lần)
💰 Tổng: 300k (tiết kiệm ~75k)
```

### Scenario 2: Combo + Voucher
```
Giỏ hàng:
- 1x Sinh tố bơ (55k)
- 1x Sinh tố xoài (50k)
- 5x Trà đào cam sả (45k) = 225k

Áp dụng voucher: SUMMER2024

Kết quả:
✅ Combo sinh tố: 90k (giảm 15k)
✅ Voucher: giảm 15% = -47k
💰 Tổng: ~268k (thay vì 330k)
```

### Scenario 3: VIP Shopping
```
Giỏ hàng:
- 10x Latte (45k) = 450k
- 5x Bánh Tiramisu (45k) = 225k

Áp dụng voucher: VIP100K

Kết quả:
✅ Tặng 1x Latte (mua 10 tặng 1)
✅ Giảm 10% tổng đơn = -67.5k
✅ Voucher VIP: -100k
💰 Tổng: ~507.5k (thay vì 675k + 1 Latte)
```

---

## 🎨 Visual Guide

### Màu Sắc
- **Tím-Hồng Gradient**: Voucher, Khuyến mãi, Badge tặng kèm
- **Hồng Pastel**: Background sản phẩm tặng
- **Xanh Nhạt**: Gợi ý khuyến mãi chưa đạt
- **Trắng**: Background chính

### Icons
- 🎟️ Ticket: Voucher
- 🎁 Gift: Sản phẩm tặng, Khuyến mãi
- ✓ Check: Đã áp dụng
- ℹ️ Info: Gợi ý

---

## ⌨️ Keyboard Shortcuts

| Phím | Chức năng |
|---|---|
| `F6` | Mở modal giảm giá thủ công |
| Click voucher button | Mở modal voucher |

---

## 📱 Mobile/Tablet

Giao diện responsive, hoạt động tốt trên:
- ✅ Desktop (1920x1080)
- ✅ Laptop (1366x768)
- ✅ Tablet (768x1024)
- ⚠️ Mobile (375x667) - Sidebar có thể scroll

---

## 🔧 Troubleshooting

### Khuyến mãi không xuất hiện?
1. Kiểm tra số lượng sản phẩm trong giỏ
2. Kiểm tra danh mục sản phẩm
3. Xem console log để debug

### Voucher không áp dụng được?
1. Kiểm tra tổng đơn hàng
2. Kiểm tra hạn sử dụng voucher
3. Xem thông báo lỗi trong modal

### Sản phẩm tặng không tự động cập nhật?
1. Thử xóa và thêm lại sản phẩm
2. Refresh trang
3. Kiểm tra console errors

---

## 💡 Tips & Tricks

### Tối Ưu Hóa Giảm Giá
```
1. Áp dụng khuyến mãi tự động trước
2. Sau đó áp dụng voucher
3. Cuối cùng áp dụng giảm giá thủ công (nếu cần)
→ Tất cả giảm giá được cộng dồn!
```

### Gợi Ý Cho Khách
```
Khi khách hàng gần đạt khuyến mãi:
- Xem section "Khuyến mãi sắp đạt được"
- Gợi ý thêm sản phẩm để đủ điều kiện
- Tăng giá trị đơn hàng
```

### Quản Lý Voucher
```
- Tạo voucher theo sự kiện (Tết, Black Friday...)
- Set hạn sử dụng rõ ràng
- Giới hạn số lần sử dụng
- Track hiệu quả qua analytics
```

---

## 🎓 Training Staff

### Checklist Đào Tạo
- [ ] Hiểu cách khuyến mãi tự động hoạt động
- [ ] Biết cách nhập voucher
- [ ] Nhận biết sản phẩm tặng kèm
- [ ] Giải thích cho khách hàng
- [ ] Xử lý lỗi cơ bản

### Demo Script
```
"Chào anh/chị! 

Hôm nay shop có chương trình:
- Mua 10 sản phẩm tặng 1
- Mua 5 cà phê tặng 1 bánh
- Nhập mã NEWCUSTOMER giảm 50k

Anh/chị đang có [X] sản phẩm, 
mua thêm [Y] sản phẩm nữa sẽ được tặng kèm!"
```

---

## 📊 Monitoring

### Metrics Quan Trọng
- Số lượng khuyến mãi được áp dụng
- Tỷ lệ sử dụng voucher
- Giá trị đơn hàng trung bình
- Số lượng sản phẩm tặng kèm
- ROI của từng chương trình

### Reports
- Daily: Voucher usage
- Weekly: Promotion effectiveness
- Monthly: Revenue impact

---

## ✅ Checklist Go-Live

- [x] Promotion engine tested
- [x] Voucher system tested
- [x] UI/UX polished
- [x] Documentation complete
- [ ] Backend API integrated
- [ ] Analytics setup
- [ ] Staff trained
- [ ] Customer communication ready

---

**Hệ thống sẵn sàng sử dụng! Chúc bạn bán hàng thành công! 🎉**
