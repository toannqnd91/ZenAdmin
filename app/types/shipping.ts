export type ShippingMethod = 'Unknown' | 'GiaoNhanh' | 'GiaoTietKiem' | 'NhanTaiCuaHang' | 'NoiBo'

export const ShippingMethodLabels: Record<ShippingMethod, string> = {
  Unknown: 'Không xác định',
  GiaoNhanh: 'Giao nhanh',
  GiaoTietKiem: 'Giao tiết kiệm',
  NhanTaiCuaHang: 'Nhận tại cửa hàng',
  NoiBo: 'Nội bộ'
}

export const SHIPPING_METHOD_OPTIONS: Array<{ label: string, value: ShippingMethod }> = [
  { label: ShippingMethodLabels.GiaoNhanh, value: 'GiaoNhanh' },
  { label: ShippingMethodLabels.GiaoTietKiem, value: 'GiaoTietKiem' },
  { label: ShippingMethodLabels.NhanTaiCuaHang, value: 'NhanTaiCuaHang' },
  { label: ShippingMethodLabels.NoiBo, value: 'NoiBo' },
  { label: ShippingMethodLabels.Unknown, value: 'Unknown' }
]
