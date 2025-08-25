// app.settings.ts
// Cấu hình cho phép giá biến thể khác nhau theo kho hay không
// If false: all warehouses share the same price for each variant (editing one updates all)
// If true: each warehouse can have a different price for the same variant
export default {
  variantPricePerWarehouse: false // false: đồng bộ giá giữa các kho, true: cho phép giá khác nhau
}
