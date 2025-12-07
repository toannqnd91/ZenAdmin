# Debug Guide: Top 10 Charts không hiện dữ liệu

## Vấn đề
- Top 10 sản phẩm bán chạy
- Top 10 khách mua nhiều nhất
- UI không hiện gì hoặc chập chờn

## Đã sửa
1. ✅ Gộp duplicate watch triggers
2. ✅ Thêm debounce 300ms để tránh race condition
3. ✅ Thêm logging chi tiết

## Cách kiểm tra

### 1. Mở Browser Console
Khi vào trang Dashboard, check console logs:

```
[Top Products] Loading with params: { range: 'today', metric: 'revenue', limit: 10 }
[StatisticsService] getTopProducts params: { range: 'today', metric: 'revenue', limit: 10 }
[StatisticsService] getTopProducts raw response: { success: true, data: [...] }
[Top Products] Response: { success: true, data: [...] }
[Top Products] Items count: 10
```

### 2. Kiểm tra API Response

**Nếu thấy lỗi 404/500:**
- Backend chưa implement endpoint `/api/v1/Statistics/top-products` hoặc `/api/v1/Statistics/top-customers`
- Cần kiểm tra backend logs

**Nếu thấy empty array:**
- Database chưa có dữ liệu
- Filter params không match với dữ liệu (sourceId, warehouseId, range)

**Nếu thấy data nhưng UI không hiện:**
- Check response format có đúng không
- Có thể backend trả về format khác với expected

### 3. Expected API Response Format

Backend có thể trả về 2 format:

**Format 1: Direct array**
```json
{
  "success": true,
  "data": [
    {
      "productId": 1,
      "name": "Product A",
      "revenue": 1000000,
      "quantity": 50,
      "orders": 10
    }
  ]
}
```

**Format 2: Envelope with items**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": 1,
        "productName": "Product A",
        "revenue": 1000000,
        "quantity": 50,
        "orders": 10
      }
    ]
  }
}
```

Code đã handle cả 2 format.

### 4. Test với Postman/curl

```bash
# Test top products
curl -X GET "http://localhost:5000/api/v1/Statistics/top-products?range=today&metric=revenue&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test top customers
curl -X GET "http://localhost:5000/api/v1/Statistics/top-customers?range=today&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Các trường hợp thường gặp

### Case 1: Backend chưa có data
- Tạo test data trong database
- Hoặc đổi filter sang "Toàn thời gian" (range=all)

### Case 2: API trả về format khác
- Check console logs để xem exact response
- Update mapping logic trong `statistics.service.ts`

### Case 3: CORS hoặc Auth issues
- Check Network tab trong DevTools
- Verify token còn valid

### Case 4: Loading state bị stuck
- Check xem có exception trong catch block không
- Verify `finally` block có chạy không

## Next Steps

1. **Chạy dev server**: `pnpm dev`
2. **Mở browser console**: F12 → Console tab
3. **Navigate to Dashboard**: http://localhost:3000
4. **Check logs** như mô tả ở trên
5. **Report findings**: Copy console logs và gửi để debug tiếp
