export interface PriceBookItem {
  id: number
  productId: number
  sku: string
  productName: string
  basePrice: number
  priceType: number
  value: number
  appliedPrice: number
  minQty: number | null
  maxQty: number | null
  note: string | null
}

export interface PriceBookCustomerGroup {
  customerGroupId: number
  name: string
}

export interface PriceBookDetail {
  id: number
  code: string
  name: string
  status: number
  startOn: string
  endOn: string
  currency: string
  allowItemsNotInBook: boolean
  warnItemsNotInBook: boolean
  restrictItemsToBook: boolean
  defaultAdjustmentPercent: number
  warehouses: Array<Record<string, unknown>>
  customerGroups: PriceBookCustomerGroup[]
  channels: Array<Record<string, unknown>>
  items: PriceBookItem[]
}
