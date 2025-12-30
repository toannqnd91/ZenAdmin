// Promotion Types and Interfaces
export interface Promotion {
  id: string
  name: string
  type: 'buy_x_get_y' | 'bundle' | 'quantity_discount' | 'total_discount'
  active: boolean
  startDate?: string
  endDate?: string
  priority: number // Higher priority promotions are applied first
  conditions: PromotionCondition
  rewards: PromotionReward
}

export interface PromotionCondition {
  // For buy_x_get_y
  buyQuantity?: number
  buyProductIds?: number[] // Specific products, empty = all products
  buyCategories?: string[] // Specific categories

  // For total_discount
  minTotalAmount?: number

  // For bundle
  requiredProducts?: { productId: number; quantity: number }[]
}

export interface PromotionReward {
  // For buy_x_get_y
  giftQuantity?: number
  giftProductIds?: number[] // Specific gift products, empty = same as bought
  giftCategories?: string[]

  // For discounts
  discountType?: 'percent' | 'amount'
  discountValue?: number
  maxDiscount?: number

  // For bundle
  bundlePrice?: number
}

export interface AppliedPromotion {
  promotionId: string
  promotionName: string
  type: string
  giftItems?: GiftItem[]
  discountAmount?: number
  description: string
}

export interface GiftItem {
  productId: number
  productName: string
  quantity: number
  originalPrice: number
  promotionId: string
}

// Mock Promotions Data
export const mockPromotions: Promotion[] = [
  {
    id: 'PROMO001',
    name: 'Mua 10 tặng 1',
    type: 'buy_x_get_y',
    active: true,
    priority: 10,
    conditions: {
      buyQuantity: 10,
      buyProductIds: [], // Apply to all products
      buyCategories: []
    },
    rewards: {
      giftQuantity: 1,
      giftProductIds: [] // Gift same product
    }
  },
  {
    id: 'PROMO002',
    name: 'Mua 5 cà phê tặng 1 bánh',
    type: 'buy_x_get_y',
    active: true,
    priority: 20,
    conditions: {
      buyQuantity: 5,
      buyCategories: ['Cà phê']
    },
    rewards: {
      giftQuantity: 1,
      giftProductIds: [60, 61, 62] // Croissant, Tiramisu, Mousse
    }
  },
  {
    id: 'PROMO003',
    name: 'Mua 3 trà sữa tặng 1 trà sữa',
    type: 'buy_x_get_y',
    active: true,
    priority: 15,
    conditions: {
      buyQuantity: 3,
      buyCategories: ['Trà sữa']
    },
    rewards: {
      giftQuantity: 1,
      giftProductIds: [] // Same category
    }
  },
  {
    id: 'PROMO004',
    name: 'Combo sinh tố 2 ly giá ưu đãi',
    type: 'bundle',
    active: true,
    priority: 25,
    conditions: {
      requiredProducts: [
        { productId: 43, quantity: 1 }, // Sinh tố bơ
        { productId: 44, quantity: 1 }  // Sinh tố xoài
      ]
    },
    rewards: {
      bundlePrice: 90000 // Instead of 105000
    }
  },
  {
    id: 'PROMO005',
    name: 'Giảm 10% cho đơn trên 500k',
    type: 'total_discount',
    active: true,
    priority: 5,
    conditions: {
      minTotalAmount: 500000
    },
    rewards: {
      discountType: 'percent',
      discountValue: 10,
      maxDiscount: 100000
    }
  }
]

// Promotion Engine
export class PromotionEngine {
  private promotions: Promotion[]

  constructor(promotions: Promotion[]) {
    this.promotions = promotions
      .filter(p => p.active)
      .filter(p => this.isPromotionValid(p))
      .sort((a, b) => b.priority - a.priority) // Higher priority first
  }

  private isPromotionValid(promotion: Promotion): boolean {
    const now = new Date()
    if (promotion.startDate && new Date(promotion.startDate) > now) return false
    if (promotion.endDate && new Date(promotion.endDate) < now) return false
    return true
  }

  // Calculate all applicable promotions for cart
  calculatePromotions(cart: any[], products: any[]): AppliedPromotion[] {
    const applied: AppliedPromotion[] = []

    for (const promotion of this.promotions) {
      switch (promotion.type) {
        case 'buy_x_get_y':
          const buyXGetY = this.applyBuyXGetY(cart, products, promotion)
          if (buyXGetY) applied.push(buyXGetY)
          break

        case 'total_discount':
          const totalDiscount = this.applyTotalDiscount(cart, promotion)
          if (totalDiscount) applied.push(totalDiscount)
          break

        case 'bundle':
          const bundle = this.applyBundle(cart, promotion)
          if (bundle) applied.push(bundle)
          break
      }
    }

    return applied
  }

  private applyBuyXGetY(cart: any[], products: any[], promotion: Promotion): AppliedPromotion | null {
    const { buyQuantity, buyProductIds, buyCategories } = promotion.conditions
    const { giftQuantity, giftProductIds } = promotion.rewards

    if (!buyQuantity || !giftQuantity) return null

    // Filter eligible items (not returns, not already gifts)
    let eligibleItems = cart.filter(item => !item.isReturn && !item.isGift)

    // Filter by product IDs if specified
    if (buyProductIds && buyProductIds.length > 0) {
      eligibleItems = eligibleItems.filter(item => buyProductIds.includes(item.id))
    }

    // Filter by categories if specified
    if (buyCategories && buyCategories.length > 0) {
      eligibleItems = eligibleItems.filter(item => buyCategories.includes(item.category))
    }

    // Calculate total eligible quantity
    const totalEligibleQty = eligibleItems.reduce((sum, item) => sum + item.quantity, 0)

    // Calculate how many gifts can be given
    const giftSets = Math.floor(totalEligibleQty / buyQuantity)

    if (giftSets === 0) return null

    const totalGiftQty = giftSets * giftQuantity

    // Determine gift products
    let giftProducts: any[] = []

    if (giftProductIds && giftProductIds.length > 0) {
      // Specific gift products
      giftProducts = products.filter(p => giftProductIds.includes(p.id))
    } else if (buyCategories && buyCategories.length > 0) {
      // Same category as bought items
      giftProducts = products.filter(p => buyCategories.includes(p.category))
    } else {
      // Same as bought items (most common item)
      const mostCommonItem = eligibleItems.reduce((max, item) =>
        item.quantity > max.quantity ? item : max
      , eligibleItems[0])
      giftProducts = mostCommonItem ? [products.find(p => p.id === mostCommonItem.id)] : []
    }

    if (giftProducts.length === 0) return null

    // For simplicity, give the first gift product
    const giftProduct = giftProducts[0]

    const giftItems: GiftItem[] = [{
      productId: giftProduct.id,
      productName: giftProduct.name,
      quantity: totalGiftQty,
      originalPrice: giftProduct.price,
      promotionId: promotion.id
    }]

    return {
      promotionId: promotion.id,
      promotionName: promotion.name,
      type: promotion.type,
      giftItems,
      description: `Mua ${buyQuantity} tặng ${giftQuantity} - Tặng ${totalGiftQty} ${giftProduct.name}`
    }
  }

  private applyTotalDiscount(cart: any[], promotion: Promotion): AppliedPromotion | null {
    const { minTotalAmount } = promotion.conditions
    const { discountType, discountValue, maxDiscount } = promotion.rewards

    if (!minTotalAmount || !discountType || !discountValue) return null

    // Calculate cart total (excluding gifts and returns)
    const cartTotal = cart
      .filter(item => !item.isReturn && !item.isGift)
      .reduce((sum, item) => sum + (item.price * item.quantity), 0)

    if (cartTotal < minTotalAmount) return null

    let discountAmount = 0
    if (discountType === 'percent') {
      discountAmount = Math.round(cartTotal * discountValue / 100)
      if (maxDiscount && discountAmount > maxDiscount) {
        discountAmount = maxDiscount
      }
    } else {
      discountAmount = discountValue
    }

    return {
      promotionId: promotion.id,
      promotionName: promotion.name,
      type: promotion.type,
      discountAmount,
      description: `Giảm ${discountType === 'percent' ? discountValue + '%' : this.formatPrice(discountValue)} cho đơn từ ${this.formatPrice(minTotalAmount)}₫`
    }
  }

  private applyBundle(cart: any[], promotion: Promotion): AppliedPromotion | null {
    const { requiredProducts } = promotion.conditions
    const { bundlePrice } = promotion.rewards

    if (!requiredProducts || !bundlePrice) return null

    // Check if all required products are in cart
    const hasAllProducts = requiredProducts.every(req => {
      const cartItem = cart.find(item => item.id === req.productId && !item.isReturn && !item.isGift)
      return cartItem && cartItem.quantity >= req.quantity
    })

    if (!hasAllProducts) return null

    // Calculate original price
    const originalPrice = requiredProducts.reduce((sum, req) => {
      const cartItem = cart.find(item => item.id === req.productId)
      return sum + (cartItem ? cartItem.price * req.quantity : 0)
    }, 0)

    const discountAmount = originalPrice - bundlePrice

    return {
      promotionId: promotion.id,
      promotionName: promotion.name,
      type: promotion.type,
      discountAmount,
      description: `Combo ưu đãi - Giảm ${this.formatPrice(discountAmount)}₫`
    }
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price)
  }
}
