export type DeliveryOption = 'vanchuyen' | 'tugiaohang' | 'giaongay' | 'giaosau'

export const DeliveryOptionLabels: Record<DeliveryOption, string> = {
  vanchuyen: 'Vận chuyển',
  tugiaohang: 'Tự giao hàng',
  giaongay: 'Giao ngay',
  giaosau: 'Giao sau'
}

export const DELIVERY_OPTION_OPTIONS: Array<{ label: string, value: DeliveryOption }> = [
  { label: 'Vận chuyển', value: 'vanchuyen' },
  { label: 'Tự giao hàng', value: 'tugiaohang' },
  { label: 'Giao ngay', value: 'giaongay' },
  { label: 'Giao sau', value: 'giaosau' }
]
