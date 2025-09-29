<script setup lang="ts">
// Image URL logic like ProductsTable
import { useRuntimeConfig } from '#imports'
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import AddCustomerModal from '@/components/AddCustomerModal.vue'
import { useRouter } from 'vue-router'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import BaseCardHeader from '~/components/BaseCardHeader.vue'
import CustomCheckbox from '@/components/CustomCheckbox.vue'
import CustomRadio from '@/components/CustomRadio.vue'
import { productService } from '@/services/product.service'
import { warehouseService } from '@/services/warehouse.service'
import type { WarehouseItem } from '@/services/warehouse.service'
import { orderSourceService } from '@/services/order-source.service'
import type { OrderSourceItem } from '@/services/order-source.service'
import { customersService, ordersService } from '@/services'
import { useToast } from '#imports'
import { useAuthService } from '@/composables/useAuthService'

// Runtime config & helpers (restored)
const config = useRuntimeConfig()
const imageBaseUrl = config?.public?.imageBaseUrl || ''
function getProductImageUrl(item: { thumbnailImageUrl?: string | null }) {
  const url = item.thumbnailImageUrl
  if (!url) return '/no-image.svg'
  if (!url.includes('/') && imageBaseUrl) return `${imageBaseUrl}/image/${url}`
  return url
}
function getCustomerAvatarUrl(avatar: unknown) {
  const src = typeof avatar === 'string' ? avatar : ''
  return src || '/no-avatar.jpg'
}

// Types (restored)
type CustomerOption = {
  id: number | string
  name: string
  phone?: string
  code?: string
  avatarUrl?: string | null
}
interface CustomerRecord {
  id: number | string
  fullName?: string
  name?: string
  customerName?: string
  phoneNumber?: string
  customerCode?: string
  avatarUrl?: string | null
}
interface ProductSearchItem {
  id: number | string
  sku?: string
  name: string
  normalizedName?: string
  thumbnailImageUrl?: string | null
  price?: number
  stockQuantity?: number
}
interface OrderProduct extends ProductSearchItem {
  quantity: number
  unitPrice: number
  total: number
  baseUnitPrice?: number
  appliedDiscountType?: 'amount' | 'percent'
  appliedDiscountInput?: number | null
  usedNewPrice?: boolean
  discountReason?: string
}
type GenericItem = Record<string, unknown>
interface WarehouseLike {
  id?: number | string
  name?: string
  warehouseName?: string
  title?: string
  Id?: number | string
  warehouseId?: number | string
}

// Primary reactive state (restored)
// (router removed - not used currently)
const splitLine = ref(false)
const showProductSearch = ref(false)
const productList = ref<ProductSearchItem[]>([])
const loadingProducts = ref(false)
const loadingMoreProducts = ref(false)
const perPage = 15
const productPage = ref(0)
const totalProductPages = ref<number | null>(null)
const productSearchPopupRef = ref<HTMLElement | null>(null)
const mainProductInputRef = ref<HTMLInputElement | null>(null)
const orderProducts = ref<OrderProduct[]>([])

const selectedCustomer = ref<GenericItem | null>(null)
const selectedSource = ref<GenericItem | null>(null)
const selectedBranch = ref<GenericItem | null>(null)

// Staff in charge (current logged-in user)
const { user: authUser, getProfile } = useAuthService()
const staffInCharge = ref<string>('')
type AuthUserLike = { display_name?: string; fullName?: string }
function extractDisplayName(u: unknown): string {
  if (u && typeof u === 'object') {
    const o = u as AuthUserLike
    if (o.display_name) return o.display_name
    if (o.fullName) return o.fullName
  }
  return ''
}

// Add customer modal state (new component based)
const showAddCustomerModal = ref(false)
function onCustomerAdded(c: { id: string | number; name: string; phone: string; code: string }) {
  if (customersCache.value) {
    customersCache.value = [{ id: c.id, fullName: c.name, phoneNumber: c.phone, customerCode: c.code } as CustomerRecord, ...customersCache.value]
  } else {
    customersCache.value = [{ id: c.id, fullName: c.name, phoneNumber: c.phone, customerCode: c.code } as CustomerRecord]
  }
  selectedCustomer.value = { id: c.id, name: c.name, phone: c.phone, code: c.code }
}

// Ngày đặt hàng: default to today in dd/MM/yyyy
function formatDateDDMMYYYY(date: Date) {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}
const orderDate = ref(formatDateDDMMYYYY(new Date()))
// Keep both dates as dd/MM/yyyy strings and normalize on blur
const scheduledDate = ref<string>('') // dd/MM/yyyy (optional)
function normalizeDDMMYYYY(s: string): string {
  if (!s) return ''
  const sep = s.includes('-') ? '-' : s.includes('.') ? '.' : '/'
  const parts = s.split(sep)
  if (parts.length !== 3) return s
  const [dd, mm, yyyy] = parts.map(p => p.trim())
  if (!dd || !mm || !yyyy) return s
  // convert 1 or 2 digit day/month
  const d = Number(dd)
  const m = Number(mm)
  let y = Number(yyyy)
  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return s
  if (y < 100) y += 2000
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1000) return s
  return `${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${y.toString().padStart(4, '0')}`
}

// Payments & Shipping controls
const paymentStatus = ref<'paid' | 'later'>('later')
const paymentMethods = ['Tiền mặt', 'Chuyển khoản', 'Thẻ'] as const
type PaymentMethod = typeof paymentMethods[number]
const paymentMethod = ref<PaymentMethod>(paymentMethods[0])
// Bridge object for RemoteSearchSelect
const paymentMethodOption = ref<{ label: string, value: PaymentMethod } | null>({ label: paymentMethod.value, value: paymentMethod.value })
// Amount paid when paymentStatus === 'paid'
const paymentAmount = ref<number | null>(null)
const paymentAmountDirty = ref(false)

// RemoteSearchSelect fetcher for payment methods (local filter)
async function fetchPaymentMethods(search: string) {
  const q = (search || '').toLowerCase()
  const items = paymentMethods.map(m => ({ label: m, value: m }))
  return q ? items.filter(i => i.label.toLowerCase().includes(q)) : items
}

// Keep string state in sync with object selection
watch(paymentMethodOption, (opt) => {
  if (opt && typeof opt.value === 'string') {
    paymentMethod.value = opt.value as PaymentMethod
  }
})
watch(paymentMethod, (m) => {
  if (!paymentMethodOption.value || paymentMethodOption.value.value !== m) {
    paymentMethodOption.value = { label: m, value: m }
  }
})

// (moved watchers near totals where grandTotal is defined)

type ShippingOption = 'carrier' | 'self' | 'delivered' | 'later'
const shippingOption = ref<ShippingOption>('delivered')
const shippingMethod = ref<string | null>(null)
const shippingMethodOptions = ['Giao nhanh', 'Giao tiết kiệm', 'Nhận tại cửa hàng']

// Bridge object for RemoteSearchSelect (shipping)
const shippingMethodOption = ref<{ label: string, value: string } | null>(
  shippingMethod.value ? { label: shippingMethod.value, value: shippingMethod.value } : null
)

// RemoteSearchSelect fetcher for shipping methods (local filter)
async function fetchShippingMethods(search: string) {
  const q = (search || '').toLowerCase()
  const items = shippingMethodOptions.map(m => ({ label: m, value: m }))
  return q ? items.filter(i => i.label.toLowerCase().includes(q)) : items
}

// Keep string state in sync with object selection (shipping)
watch(shippingMethodOption, (opt) => {
  shippingMethod.value = opt ? String(opt.value) : null
})
watch(shippingMethod, (m) => {
  if (!m) {
    shippingMethodOption.value = null
  } else if (!shippingMethodOption.value || shippingMethodOption.value.value !== m) {
    shippingMethodOption.value = { label: m, value: m }
  }
})

// Remote fetchers
// Simple in-memory caches so that after first load, opening the dropdown again
// does not re-hit the API (user requirement: load once, reuse).
// - Sources & Branches: full list cached (they're typically small lists)
// - Customers: cache only the initial (empty search) page; still allow remote
//   search calls when user types a query.
const sourcesCache = ref<OrderSourceItem[] | null>(null)
const branchesRawCache = ref<WarehouseLike[] | null>(null)
const customersCache = ref<CustomerRecord[] | null>(null)

// Order note & coupon
const orderNote = ref('')
const couponCode = ref('')

// Shipping fee & discount (reuse existing discount/shippingFee refs later in file for order-level values)
// Temporary holders for early total preview before discount modal usage
const shippingFeeAmount = ref<number>(0) // will mirror shippingFee when applied
const orderDiscountAmount = ref<number>(0) // will mirror discount when applied

// Derived totals (basic: sum of item totals - order discount + shipping)
const posSubTotal = computed(() => orderProducts.value.reduce((s, p) => s + p.total, 0))
// Keep existing grandTotal later in file; for create API use this alias
// Keep a POS grand total (synchronized later just before submission)
const posGrandTotal = computed(() => Math.max(0, posSubTotal.value - (orderDiscountAmount.value) + shippingFeeAmount.value))

// Map UI payment method string to API numeric (placeholder mapping)
function mapPaymentMethodToApi(value: string): number {
  // Example mapping: adjust to backend enum
  switch (value) {
    case 'Tiền mặt': return 1
    case 'Chuyển khoản': return 2
    case 'Thẻ': return 3
    default: return 0
  }
}

// Delivery option mapping based on shippingOption
function mapDeliveryOptionToApi(opt: string): number {
  switch (opt) {
    case 'carrier': return 1
    case 'self': return 2
    case 'delivered': return 3
    case 'later': return 4
    default: return 0
  }
}

const creatingOrder = ref(false)
const createError = ref<string | null>(null)
const toast = useToast()
interface SimpleSelectable {
  id?: number | string
  name?: string
  phone?: string
}
function parseDDMMYYYYToISO(s: string): string | null {
  if (!s) return null
  const parts = s.split(/[./-]/)
  if (parts.length !== 3) return null
  const [dd, mm, yyyy] = parts.map(p => Number(p))
  if (!dd || !mm || !yyyy) return null
  const d = new Date(yyyy, mm - 1, dd, 0, 0, 0)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

async function handleCreateOrder() {
  if (!selectedBranch.value) {
    createError.value = 'Chưa chọn chi nhánh/kho'
    return
  }
  if (!selectedCustomer.value) {
    createError.value = 'Chưa chọn khách hàng'
    return
  }
  if (orderProducts.value.length === 0) {
    createError.value = 'Chưa chọn sản phẩm'
    return
  }
  createError.value = null
  creatingOrder.value = true
  try {
    const itemsPayload = orderProducts.value.map(p => ({
      productId: p.id as number | string, 
      quantity: p.quantity,
      productPrice: p.baseUnitPrice ?? p.unitPrice,
      discountAmount: p.appliedDiscountType ? (p.appliedDiscountType === 'amount' ? (p.appliedDiscountInput || 0) : 0) : 0,
      unitPrice: p.unitPrice
    }))
    const paidAmount = paymentStatus.value === 'paid' ? (paymentAmount.value || posGrandTotal.value) : 0
    // Sync early placeholders with actual reactive discount/shipping values used in UI totals
    orderDiscountAmount.value = (discount?.value ?? 0)
    shippingFeeAmount.value = (shippingFee?.value ?? 0)

    const body: CreatePosOrderRequest = {
      items: itemsPayload,
      paymentMethod: mapPaymentMethodToApi(paymentMethod.value),
      warehouseId: (selectedBranch.value as SimpleSelectable)?.id ?? 0,
      customerId: (selectedCustomer.value as SimpleSelectable)?.id ?? '',
      deliveryAddress: {
        contactName: (selectedCustomer.value as SimpleSelectable)?.name || '',
        phoneNumber: (selectedCustomer.value as SimpleSelectable)?.phone || '',
        email: null,
        addressLine1: '',
        addressLine2: '',
        countryId: 'VN',
        stateOrProvinceId: null,
        districtId: null,
        city: '',
        zipCode: ''
      },
      payLater: paymentStatus.value === 'later',
      paidAmount,
      orderSourceId: (selectedSource.value as SimpleSelectable)?.id ?? null,
      shippingFeeAmount: (shippingFee?.value ?? shippingFeeAmount.value) || 0,
      discountAmount: (discount?.value ?? orderDiscountAmount.value) || 0,
      deliveryOption: mapDeliveryOptionToApi(shippingOption.value),
      shippingMethod: shippingMethod.value || null,
      expectedDeliveryDate: parseDDMMYYYYToISO(scheduledDate.value),
      orderNote: orderNote.value || null,
      couponCode: couponCode.value || null,
      applyCouponToEachItem: true
    }
    const res = await ordersService.createPosOrder(body)
    const envelope = res as unknown as { code?: string | number; success?: boolean; message?: string }
    if (envelope.code === '201' || envelope.code === 201 || envelope.success) {
      toast.add({ title: 'Tạo đơn thành công', description: envelope.message || '', color: 'green' })
      // Reset một số field chính
      orderProducts.value = []
      discount.value = 0
      shippingFee.value = 0
      paymentAmount.value = null
      paymentAmountDirty.value = false
      orderNote.value = ''
      couponCode.value = ''
    } else {
      throw new Error(envelope.message || 'Không rõ trạng thái phản hồi')
    }
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Tạo đơn thất bại'
    toast.add({ title: 'Tạo đơn thất bại', description: createError.value || '', color: 'red' })
  } finally {
    creatingOrder.value = false
  }
}

// (removed legacy inline Add Customer modal logic; using standalone component)

async function fetchCustomers(search: string): Promise<CustomerOption[]> {
  try {
    let items: CustomerRecord[] = []
    const trimmed = (search || '').trim()
    if (!trimmed) {
      // Empty search: use cache if available
      if (customersCache.value) {
        items = customersCache.value
      } else {
        const res = await customersService.getCustomers({
          pagination: { start: 0, number: 15 },
          search: { name: null, excludeGuests: true },
          sort: { field: 'Id', reverse: false }
        })
        items = (Array.isArray(res?.data?.items) ? res.data.items : []) as CustomerRecord[]
        customersCache.value = items
      }
    } else {
      // When user searches, still perform remote request (do not cache per query for now)
      const res = await customersService.getCustomers({
        pagination: { start: 0, number: 15 },
        search: { name: trimmed, excludeGuests: true },
        sort: { field: 'Id', reverse: false }
      })
      items = (Array.isArray(res?.data?.items) ? res.data.items : []) as CustomerRecord[]
    }
    return items.map(cc => ({
      id: cc.id,
      name: cc.fullName ?? cc.name ?? cc.customerName ?? '',
      phone: cc.phoneNumber,
      code: cc.customerCode,
      avatarUrl: typeof cc.avatarUrl === 'string' ? cc.avatarUrl : null
    }))
  } catch {
    return []
  }
}
// Paginated fetchMore for infinite scroll (continues pages when user scrolls)
async function fetchMoreCustomers(search: string, page: number): Promise<CustomerOption[] | { items: CustomerOption[]; hasMore: boolean }> {
  try {
    const trimmed = (search || '').trim()
    const pageSize = 15
    const res = await customersService.getCustomers({
      pagination: { start: page * pageSize, number: pageSize },
      search: { name: trimmed || null, excludeGuests: true },
      sort: { field: 'Id', reverse: false }
    })
    const itemsRaw = Array.isArray(res?.data?.items) ? res.data.items : []
    const mapped: CustomerOption[] = itemsRaw.map((cc: any) => ({
      id: cc.id,
      name: cc.fullName ?? cc.name ?? cc.customerName ?? '',
      phone: cc.phoneNumber,
      code: cc.customerCode,
      avatarUrl: typeof cc.avatarUrl === 'string' ? cc.avatarUrl : null
    }))
    const totalPages = typeof res?.data?.numberOfPages === 'number' ? res.data.numberOfPages : null
    const hasMore = totalPages == null ? mapped.length === pageSize : page + 1 < totalPages
    return { items: mapped, hasMore }
  } catch {
    return { items: [], hasMore: false }
  }
}
async function fetchSources(search: string): Promise<GenericItem[]> {
  try {
    if (!sourcesCache.value) {
      const res = await orderSourceService.getOrderSources()
      sourcesCache.value = Array.isArray(res?.data) ? res.data : []
    }
    const list: OrderSourceItem[] = sourcesCache.value || []
    const lower = search?.toLowerCase?.() || ''
    return lower
      ? list.filter(s => s.name.toLowerCase().includes(lower) || s.code.toLowerCase().includes(lower))
      : list
  } catch {
    return []
  }
}
async function fetchBranches(search: string): Promise<GenericItem[]> {
  try {
    if (!branchesRawCache.value) {
      const res = await warehouseService.getWarehouses()
      branchesRawCache.value = Array.isArray(res?.data) ? (res.data as WarehouseLike[]) : []
    }
    const norm = (branchesRawCache.value as WarehouseLike[]).map((w) => {
      const id = (w.id ?? w.warehouseId ?? w.Id) as string | number
      const name = String(w.name ?? w.warehouseName ?? w.title ?? '')
      return { id, name }
    })
    const q = (search || '').toLowerCase()
    return q ? norm.filter(x => x.name.toLowerCase().includes(q)) : norm
  } catch {
    return []
  }
}

// Products
async function fetchProducts(reset = false) {
  if (reset) {
    productList.value = []
    productPage.value = 0
    totalProductPages.value = null
  }
  const isInitial = reset || productList.value.length === 0
  if (isInitial) loadingProducts.value = true
  else loadingMoreProducts.value = true
  try {
    const res = await productService.getProducts({
      search: undefined,
      hasOptions: false,
      pagination: { start: productPage.value * perPage, number: perPage },
      sort: { field: 'Id', reverse: true }
    })
    const items = res?.data?.items || []
    const pages = typeof res?.data?.numberOfPages === 'number' ? res.data.numberOfPages : null
    if (pages !== null) totalProductPages.value = pages
    if (reset || isInitial) productList.value = items
    else productList.value.push(...items)
    if (items.length > 0) productPage.value += 1
  } catch {
    if (reset || isInitial) productList.value = []
  } finally {
    loadingProducts.value = false
    loadingMoreProducts.value = false
  }
}

// Product operations (restored)
function addProduct(item: ProductSearchItem) {
  const key = String(item.sku || item.id)
  const found = orderProducts.value.find(p => String(p.sku || p.id) === key)
  if (found) {
    found.quantity += 1
    found.total = found.quantity * found.unitPrice
    closeProductSearch()
    return
  }
  orderProducts.value.unshift({
    ...item,
    quantity: 1,
    unitPrice: item.price || 0,
    baseUnitPrice: item.price || 0,
    total: item.price || 0,
    discountReason: undefined
  })
  closeProductSearch()
}
function removeProduct(idx: number) {
  orderProducts.value.splice(idx, 1)
}
function updateProductTotal(idx: number) {
  const prod = orderProducts.value[idx]
  if (!prod) return
  if (!Number.isFinite(prod.quantity) || prod.quantity < 1) prod.quantity = 1
  prod.total = prod.quantity * prod.unitPrice
}
function getBaseUnitPrice(prod: OrderProduct) {
  return typeof prod.baseUnitPrice === 'number' ? prod.baseUnitPrice : prod.unitPrice
}
function calcDiscountAmount(prod: OrderProduct) {
  const base = getBaseUnitPrice(prod)
  return Math.max(0, base - prod.unitPrice)
}
function calcDiscountPercent(prod: OrderProduct) {
  const base = getBaseUnitPrice(prod)
  if (base <= 0) return 0
  const amt = calcDiscountAmount(prod)
  return Math.round((amt * 100) / base)
}

// Pricing modal logic (restored)
const showPriceModal = ref(false)
const priceModalIdx = ref<number | null>(null)
const priceUseNew = ref(false)
const priceNewValue = ref<number | null>(null)
const priceDiscountType = ref<'amount' | 'percent'>('amount')
const priceDiscountInput = ref<number | null>(null)
const priceReason = ref('')
const priceError = ref('')
function openPriceModal(idx: number) {
  priceModalIdx.value = idx
  const prod = orderProducts.value[idx]
  if (!prod) return
  const base = typeof prod.baseUnitPrice === 'number' ? prod.baseUnitPrice : prod.unitPrice
  if (prod.usedNewPrice) {
    priceUseNew.value = true
    priceNewValue.value = prod.unitPrice
    priceDiscountType.value = 'amount'
    priceDiscountInput.value = null
  } else if (prod.appliedDiscountType && (prod.appliedDiscountInput ?? null) !== null) {
    priceUseNew.value = false
    priceDiscountType.value = prod.appliedDiscountType
    priceDiscountInput.value = Number(prod.appliedDiscountInput || 0)
  } else if (typeof base === 'number' && base > 0 && prod.unitPrice !== base) {
    const diff = base - prod.unitPrice
    if (diff > 0) {
      // Inferred discount by amount
      priceUseNew.value = false
      priceDiscountType.value = 'amount'
      priceDiscountInput.value = diff
    } else {
      // Price increased above base (surcharge) -> treat as custom new price
      priceUseNew.value = true
      priceDiscountType.value = 'amount'
      priceDiscountInput.value = null
    }
  } else {
    // Default empty state
    priceUseNew.value = false
    priceDiscountType.value = 'amount'
    priceDiscountInput.value = null
  }
  showPriceModal.value = true
}

function closePriceModal() {
  showPriceModal.value = false
}

const pricePreview = computed(() => {
  const idx = priceModalIdx.value
  if (idx === null) return null
  const prod = orderProducts.value[idx]
  if (!prod) return null
  const base = typeof prod.baseUnitPrice === 'number' ? prod.baseUnitPrice : prod.unitPrice
  if (priceUseNew.value) {
    const v = Number(priceNewValue.value ?? 0)
    return v >= 0 ? v : 0
  }
  const di = Number(priceDiscountInput.value ?? 0)
  if (!di || di <= 0) return base
  if (priceDiscountType.value === 'percent') {
    const pct = Math.max(0, Math.min(100, di))
    const off = Math.round((base * pct) / 100)
    return Math.max(0, base - off)
  }
  // amount
  return Math.max(0, base - di)
})

function validatePriceModal(): boolean {
  priceError.value = ''
  if (priceUseNew.value) {
    const v = Number(priceNewValue.value)
    if (!Number.isFinite(v) || v < 0) {
      priceError.value = 'Giá mới không hợp lệ'
      return false
    }
    return true
  }
  if (priceDiscountInput.value != null && priceDiscountType.value === 'percent') {
    const p = Number(priceDiscountInput.value)
    if (p < 0 || p > 100) {
      priceError.value = 'Phần trăm giảm phải trong 0-100'
      return false
    }
  }
  return true
}
function applyPriceAdjust() {
  if (!validatePriceModal()) return
  const idx = priceModalIdx.value
  if (idx === null) return
  const prod = orderProducts.value[idx]
  if (!prod) return
  const base = typeof prod.baseUnitPrice === 'number' ? prod.baseUnitPrice : (prod.baseUnitPrice = prod.unitPrice)
  let finalPrice: number
  if (priceUseNew.value) {
    finalPrice = Math.max(0, Number(priceNewValue.value ?? 0))
    prod.usedNewPrice = true
    prod.appliedDiscountType = undefined
    prod.appliedDiscountInput = null
  } else if (priceDiscountInput.value && Number(priceDiscountInput.value) > 0) {
    if (priceDiscountType.value === 'percent') {
      const pct = Math.max(0, Math.min(100, Number(priceDiscountInput.value)))
      const off = Math.round((base * pct) / 100)
      finalPrice = Math.max(0, base - off)
      prod.usedNewPrice = false
      prod.appliedDiscountType = 'percent'
      prod.appliedDiscountInput = pct
    } else {
      finalPrice = Math.max(0, base - Number(priceDiscountInput.value))
      prod.usedNewPrice = false
      prod.appliedDiscountType = 'amount'
      prod.appliedDiscountInput = Number(priceDiscountInput.value)
    }
  } else {
    finalPrice = base
    prod.usedNewPrice = false
    prod.appliedDiscountType = undefined
    prod.appliedDiscountInput = null
  }
  prod.unitPrice = finalPrice
  prod.total = prod.quantity * prod.unitPrice
  const r = (priceReason.value || '').trim()
  prod.discountReason = r.length ? r : undefined
  closePriceModal()
}
function removePriceAdjust() {
  const idx = priceModalIdx.value
  if (idx === null) return
  const prod = orderProducts.value[idx]
  if (!prod) return
  const base = typeof prod.baseUnitPrice === 'number' ? prod.baseUnitPrice : prod.unitPrice
  prod.unitPrice = base
  prod.total = prod.quantity * prod.unitPrice
  priceUseNew.value = false
  priceNewValue.value = base
  priceDiscountInput.value = null
  priceDiscountType.value = 'amount'
  priceReason.value = ''
  priceError.value = ''
  prod.usedNewPrice = false
  prod.appliedDiscountType = undefined
  prod.appliedDiscountInput = null
  prod.discountReason = undefined
}
function openProductSearch() {
  if (showProductSearch.value) return
  showProductSearch.value = true
  fetchProducts(true)
  nextTick(() => {
    document.addEventListener('mousedown', handleClickOutside)
    mainProductInputRef.value?.focus()
  })
}
function closeProductSearch() {
  showProductSearch.value = false
  document.removeEventListener('mousedown', handleClickOutside)
}
function handleClickOutside(e: MouseEvent) {
  if (!productSearchPopupRef.value) return
  if (!productSearchPopupRef.value.contains(e.target as Node)) closeProductSearch()
}
function canLoadMoreProducts() {
  if (loadingProducts.value || loadingMoreProducts.value) return false
  if (totalProductPages.value === null) return true
  return productPage.value < totalProductPages.value
}
function onProductListScroll() {
  const el = productSearchPopupRef.value
  if (!el) return
  const threshold = 120 // px from bottom
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
    if (canLoadMoreProducts()) fetchProducts(false)
  }
}
function handleF3(e: KeyboardEvent) {
  // Keyboard shortcuts: F3 toggle product search, F6 discount modal, F7 shipping fee modal
  if (e.key === 'F3') {
    e.preventDefault()
    if (showProductSearch.value) {
      closeProductSearch()
    } else {
      openProductSearch()
    }
  } else if (e.key === 'F6') {
    e.preventDefault()
    if (orderProducts.value.length) openDiscountModal()
  } else if (e.key === 'F7') {
    e.preventDefault()
    if (orderProducts.value.length) openShippingFeeModal()
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleF3)
  // Fetch sources and set POS as default if available
  try {
    const res = await orderSourceService.getOrderSources()
    const list: OrderSourceItem[] = Array.isArray(res?.data) ? res.data : []
    if (list.length && !selectedSource.value) {
      const pos = list.find(s => s.code?.toLowerCase() === 'pos' || s.name?.toLowerCase() === 'pos')
      if (pos) selectedSource.value = { ...pos }
    }
  } catch {
    // noop
  }

  // Defaults requested:
  // - Shipping method: Nhận tại cửa hàng
  if (!shippingMethod.value) {
    shippingMethod.value = 'Nhận tại cửa hàng'
  }
  // - Payment status: Đã thanh toán
  if (paymentStatus.value !== 'paid') {
    paymentStatus.value = 'paid'
  }
  // - Default branch: fetch default warehouse id via service and select it
  try {
    const def = await warehouseService.getDefaultWarehouse()
    const defId = def?.data?.id
    if (typeof defId === 'number' || typeof defId === 'string') {
      // Try resolve branch name from warehouses list
      try {
        const all = await warehouseService.getWarehouses()
        const list: WarehouseItem[] = Array.isArray(all?.data) ? all.data : []
        const found = list.find((w: WarehouseItem) => String(w.id) === String(defId))
        selectedBranch.value = { id: defId, name: (found && found.name) ? found.name : 'Chi nhánh mặc định' }
      } catch {
        selectedBranch.value = { id: defId, name: 'Chi nhánh mặc định' }
      }
    }
  } catch {
    // ignore if API not available
  }

  // Nhân viên phụ trách: lấy display_name của tài khoản đang đăng nhập
  try {
    // Prefill from decoded token if available immediately
    const prefill = extractDisplayName(authUser.value)
    if (prefill) staffInCharge.value = prefill
    // Fetch fresh profile to ensure correct display_name
    const profile = await getProfile()
    const dn = extractDisplayName(profile)
    if (dn) staffInCharge.value = dn
  } catch {
    // silently ignore profile errors; field will stay blank
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleF3)
  document.removeEventListener('mousedown', handleClickOutside)
})

// Totals
const totalAmount = computed(() => orderProducts.value.reduce((sum, p) => sum + p.total, 0))
const discount = ref(0)
const shippingFee = ref(0)
const orderGrandTotal = computed(() => totalAmount.value - discount.value + shippingFee.value)

function currency(n: number) {
  return n.toLocaleString() + '₫'
}

// Keep payment amount in sync with totals when 'Đã thanh toán'
watch(paymentStatus, (s) => {
  if (s === 'paid') {
    if (!paymentAmountDirty.value) {
      paymentAmount.value = orderGrandTotal.value
    }
  } else {
    paymentAmount.value = null
    paymentAmountDirty.value = false
  }
})
watch(orderGrandTotal, (gt) => {
  if (paymentStatus.value === 'paid' && !paymentAmountDirty.value) {
    paymentAmount.value = gt
  }
})

function syncPaymentAmount() {
  paymentAmount.value = orderGrandTotal.value
  paymentAmountDirty.value = false
}

// Discount & Shipping Fee Modals (like purchase-order)
const showDiscountModal = ref(false)
const showShippingFeeModal = ref(false)
const discountType = ref<'amount' | 'percent'>('amount')
const discountInput = ref(0)
const discountError = ref('')
const shippingFeeInput = ref(0)
const shippingFeeError = ref('')

function openDiscountModal() {
  showDiscountModal.value = true
}
function closeDiscountModal() {
  showDiscountModal.value = false
}
function openShippingFeeModal() {
  showShippingFeeModal.value = true
}
function closeShippingFeeModal() {
  showShippingFeeModal.value = false
}

function validateDiscount() {
  let value = Number(discountInput.value) || 0
  if (discountType.value === 'percent') {
    value = Math.round(totalAmount.value * value / 100)
  }
  if (value > totalAmount.value) {
    discountError.value = `Chiết khấu đơn không vượt quá tổng tiền ${totalAmount.value.toLocaleString()}₫`
    return false
  }
  discountError.value = ''
  return true
}
function applyDiscount() {
  if (!validateDiscount()) return
  let value = Number(discountInput.value) || 0
  if (discountType.value === 'percent') {
    value = Math.round(totalAmount.value * value / 100)
  }
  discount.value = value
  closeDiscountModal()
}

function validateShippingFee() {
  const value = Number(shippingFeeInput.value) || 0
  if (value < 0) {
    shippingFeeError.value = 'Phí giao hàng không được âm'
    return false
  }
  shippingFeeError.value = ''
  return true
}
function applyShippingFee() {
  if (!validateShippingFee()) return
  shippingFee.value = Number(shippingFeeInput.value) || 0
  closeShippingFeeModal()
}

watch([discountInput, discountType, totalAmount], () => {
  validateDiscount()
})
watch([shippingFeeInput], () => {
  validateShippingFee()
})

// Actions
// Removed unused goBack()
const triedSubmit = ref(false)
const hasProducts = computed(() => orderProducts.value.length > 0)
const hasSource = computed(() => !!selectedSource.value)
const hasCustomer = computed(() => !!selectedCustomer.value)
const hasBranch = computed(() => !!selectedBranch.value)

function saveDraft() { /* TODO */ }
async function createAndConfirm() {
  triedSubmit.value = true
  const missingProducts = !hasProducts.value
  const missingCustomer = !hasCustomer.value
  const missingSource = !hasSource.value
  const missingBranch = !hasBranch.value

  if (missingProducts || missingCustomer || missingSource || missingBranch) {
    nextTick(() => {
      const target = missingProducts
        ? (document.querySelector('#products-card') as HTMLElement | null)
        : missingCustomer
          ? (document.querySelector('#customer-card') as HTMLElement | null)
          : missingSource
            ? (document.querySelector('#source-card') as HTMLElement | null)
            : (document.querySelector('#branch-card') as HTMLElement | null)
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      if (missingProducts) openProductSearch()
    })
    return
  }
  if (!creatingOrder.value) await handleCreateOrder()
}

function onAddCustomer() {
  showAddCustomerModal.value = true
}
</script>

<template>
  <UDashboardPanel id="orders-create" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <UDashboardSidebarCollapse />
            <div class="text-lg font-semibold">
              Tạo đơn hàng
            </div>
          </div>
        </template>
        <template #right>
          <!-- Có thể thêm nút/phím tắt ở đây nếu cần -->
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="w-full max-w-screen-xl mx-auto px-6 py-6">
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Left side -->
          <div class="flex-1 flex flex-col gap-6">
            <UPageCard id="products-card" variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Sản phẩm
                <template #actions>
                  <CustomCheckbox v-model="splitLine" class="text-sm font-normal">
                    Tách dòng
                  </CustomCheckbox>
                </template>
              </BaseCardHeader>
              <div class="flex items-center gap-2 mb-4 relative">
                <div class="flex-1">
                  <input
                    ref="mainProductInputRef"
                    type="text"
                    :class="[
                      'w-full h-9 px-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                      triedSubmit && !hasProducts ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    ]"
                    placeholder="Tìm theo tên, mã SKU, quét mã Barcode... (F3)"
                    autocomplete="off"
                    autocorrect="off"
                    autofill="off"
                    inputmode="search"
                    name="ignore_product_search"
                    autocapitalize="off"
                    spellcheck="false"
                    aria-autocomplete="none"
                    data-lpignore="true"
                    data-form-type="other"
                    @focus="openProductSearch"
                  >
                  <div
                    v-if="showProductSearch"
                    ref="productSearchPopupRef"
                    class="absolute left-0 top-full z-50 w-full bg-white rounded-lg shadow-lg mt-2 max-h-[420px] overflow-auto border border-gray-200"
                    @scroll="onProductListScroll"
                  >
                    <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-600" @click="closeProductSearch">
                      &times;
                    </button>
                    <div class="flex items-center gap-2 mb-2 p-4 pb-0">
                      <button class="flex items-center text-primary-600 text-sm font-medium hover:underline" style="padding:0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-5 h-5 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        ><path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4v16m8-8H4"
                        /></svg>
                        Thêm mới sản phẩm
                      </button>
                    </div>
                    <div v-if="loadingProducts" class="text-center py-8">
                      Đang tải...
                    </div>
                    <div v-else>
                      <div v-if="productList.length === 0" class="text-center py-8 text-gray-500">
                        Không có sản phẩm
                      </div>
                      <div v-else class="p-4 pt-2">
                        <div
                          v-for="item in productList"
                          :key="item.id"
                          class="flex items-center py-3 gap-4 cursor-pointer"
                          :style="'border-bottom: 1px solid rgb(232,234,235);' + (item === productList[productList.length-1] ? 'border-bottom: none;' : '')"
                          @click="addProduct(item)"
                        >
                          <img
                            :src="getProductImageUrl(item)"
                            class="w-12 h-12 rounded bg-gray-100 object-cover"
                            @error="e => { const t = e.target as HTMLImageElement; if (t) t.src = '/no-image.svg' }"
                          >
                          <div class="flex-1">
                            <div class="font-medium">
                              {{ item.name }}
                            </div>
                            <div v-if="item.normalizedName" class="text-xs text-gray-500">
                              {{ item.normalizedName }}
                            </div>
                            <div class="text-xs text-gray-500">
                              SKU: {{ item.sku || '---' }}
                            </div>
                          </div>
                          <div class="text-right min-w-[100px]">
                            <div class="font-semibold">
                              {{ item.price ? item.price.toLocaleString() + '₫' : '---' }}
                            </div>
                            <div class="text-xs text-gray-500">
                              Có thể bán: <span class="text-primary-600 font-medium">{{ item.stockQuantity }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div v-if="loadingMoreProducts" class="px-4 pb-3 text-center text-gray-500 text-sm">
                        Đang tải thêm...
                      </div>
                    </div>
                  </div>
                </div>
                <button class="h-9 px-4 rounded-md border border-gray-300 bg-gray-50 text-sm font-medium hover:bg-gray-100" @click="openProductSearch">
                  Chọn nhiều
                </button>
              </div>
              <div v-if="orderProducts.length" class="-mx-4 lg:-mx-6">
                <table class="min-w-full w-full text-sm border-separate border-spacing-0">
                  <thead>
                    <tr class="bg-gray-50">
                      <th class="px-6 py-2 text-left font-semibold">
                        Sản phẩm
                      </th>
                      <th class="px-6 py-2 text-left font-semibold">
                        Số lượng
                      </th>
                      <th class="px-6 py-2 text-left font-semibold">
                        Đơn giá
                      </th>
                      <th class="px-6 py-2 text-left font-semibold">
                        Thành tiền
                      </th>
                      <th class="px-6 py-2 text-left font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(prod, idx) in orderProducts" :key="prod.sku || prod.id">
                      <td class="px-6 py-2">
                        <div class="flex items-center gap-2">
                          <img
                            :src="getProductImageUrl(prod)"
                            class="w-10 h-10 rounded bg-gray-100 object-cover"
                            @error="e => { const t = e.target as HTMLImageElement; if (t) t.src = '/no-image.svg' }"
                          >
                          <div>
                            <div class="font-medium">
                              {{ prod.name }}
                            </div>
                            <div class="text-xs text-gray-500">
                              {{ prod.normalizedName }}
                            </div>
                            <div class="text-xs text-gray-500">
                              SKU: {{ prod.sku }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-2">
                        <input
                          v-model.number="prod.quantity"
                          type="number"
                          min="1"
                          class="w-16 h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          @input="updateProductTotal(idx)"
                        >
                      </td>
                      <td class="px-6 py-2">
                        <div class="flex flex-col">
                          <span
                            class="text-primary-600 font-semibold cursor-pointer hover:underline"
                            @click="openPriceModal(idx)"
                          >
                            {{ currency(prod.unitPrice) }}
                          </span>
                          <div v-if="calcDiscountAmount(prod) > 0" class="text-xs text-gray-500">
                            <span class="line-through mr-2">{{ currency(getBaseUnitPrice(prod)) }}</span>
                            <span class="text-red-600 mr-1">-{{ currency(calcDiscountAmount(prod)).replace('₫', '') }}₫</span>
                            <span class="text-red-600">(-{{ calcDiscountPercent(prod) }}%)</span>
                            <div v-if="prod.discountReason" class="text-[11px] text-gray-400 mt-0.5 truncate max-w-[240px]">
                              Lý do: {{ prod.discountReason }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-2">
                        <span class="font-semibold">{{ (prod.quantity * prod.unitPrice).toLocaleString() }}₫</span>
                      </td>
                      <td class="px-6 py-2">
                        <button class="text-error hover:underline" @click="removeProduct(idx)">
                          ×
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="flex flex-col items-center justify-center py-10">
                <img src="/no-image.svg" class="w-20 h-20 mb-3 opacity-60" alt="empty">
                <div class="text-gray-500 mb-3">
                  Bạn chưa thêm sản phẩm nào
                </div>
                <button class="px-4 h-9 rounded-md bg-primary-600 text-white font-medium hover:bg-primary-700 transition" @click="openProductSearch">
                  Thêm sản phẩm
                </button>
              </div>
              <p v-if="triedSubmit && !hasProducts" class="mt-2 text-sm text-red-600">
                Vui lòng thêm ít nhất 1 sản phẩm
              </p>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Thanh toán</BaseCardHeader>
              <div class="space-y-2 text-sm">
                <div class="flex items-center justify-between min-h-[28px]">
                  <span class="text-gray-600 font-medium flex items-center gap-2">
                    Tổng tiền hàng
                    <span v-if="orderProducts.length" class="text-xs text-gray-500">{{ orderProducts.length }} sản phẩm</span>
                  </span>
                  <span class="text-gray-600">{{ orderProducts.length ? currency(totalAmount) : '---' }}</span>
                </div>
                <div class="flex items-center justify-between min-h-[28px]">
                  <button type="button" class="text-primary-600 text-left text-sm hover:underline p-0 bg-transparent" @click="openDiscountModal">
                    Thêm giảm giá (F6)
                  </button>
                  <span class="text-gray-600">{{ discount ? '-' + currency(discount) : '---' }}</span>
                </div>
                <div class="flex items-center justify-between min-h-[28px]">
                  <button type="button" class="text-primary-600 text-left text-sm hover:underline p-0 bg-transparent" @click="openShippingFeeModal">
                    Thêm phí giao hàng (F7)
                  </button>
                  <span class="text-gray-600">{{ shippingFee ? currency(shippingFee) : '---' }}</span>
                </div>
                <div class="flex items-center justify-between min-h-[32px] font-semibold border-t border-gray-100 pt-2">
                  <span>Thành tiền</span>
                  <span>{{ orderProducts.length ? currency(orderGrandTotal) : '0₫' }}</span>
                </div>
                <!-- Payment panel -->
                <div v-if="orderProducts.length" class="mt-3 p-4 rounded-lg bg-primary-50">
                  <div class="flex flex-col gap-2">
                    <CustomRadio v-model="paymentStatus" value="paid" label="Đã thanh toán" />
                    <div v-if="paymentStatus === 'paid'" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <div class="text-xs text-gray-600 mb-1">
                          Hình thức thanh toán
                        </div>
                        <RemoteSearchSelect
                          v-model="paymentMethodOption"
                          :fetch-fn="fetchPaymentMethods"
                          placeholder="Chọn hình thức thanh toán"
                          :clearable="false"
                          label-field="label"
                          :searchable="false"
                          :full-width="true"
                        />
                      </div>
                      <div>
                        <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Số tiền (Khách hàng trả)</span>
                          <button
                            v-if="paymentAmountDirty"
                            type="button"
                            class="text-primary-600 hover:underline p-0 bg-transparent whitespace-nowrap"
                            @click="syncPaymentAmount()"
                          >
                            Đồng bộ với thành tiền
                          </button>
                        </div>
                        <div class="relative">
                          <input
                            v-model.number="paymentAmount"
                            type="number"
                            min="0"
                            class="w-full h-9 px-3 pr-6 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                            @input="paymentAmountDirty = true"
                          >
                          <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">đ</span>
                        </div>
                      </div>
                    </div>
                    <CustomRadio
                      v-model="paymentStatus"
                      class="mt-2"
                      value="later"
                      label="Thanh toán sau"
                    />
                    <div v-if="paymentStatus === 'later'" class="mt-2">
                      <div class="text-xs text-gray-600 mb-1">
                        Hình thức thanh toán
                      </div>
                      <RemoteSearchSelect
                        v-model="paymentMethodOption"
                        :fetch-fn="fetchPaymentMethods"
                        placeholder="Chọn hình thức thanh toán"
                        :clearable="false"
                        label-field="label"
                        :searchable="false"
                        class="w-full"
                      />
                    </div>
                  </div>
                </div>
                <!-- Modal giảm giá -->
                <div v-if="showDiscountModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click="closeDiscountModal">
                  <div class="bg-white rounded-lg w-full max-w-lg p-6 relative shadow-none border-none no-shadow-modal" style="box-shadow:none!important; border:none!important; outline:none!important;" @click.stop>
                    <div class="text-lg font-semibold mb-4">
                      Thêm giảm giá
                    </div>
                    <div class="mb-6 flex items-center gap-4">
                      <label class="text-sm font-medium min-w-[100px]">Loại giảm giá:</label>
                      <div class="flex rounded-lg overflow-hidden border border-gray-200">
                        <button :class="['px-4 py-2 text-sm font-semibold', discountType === 'amount' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700']" @click="discountType = 'amount'">
                          Giá trị
                        </button>
                        <button :class="['px-4 py-2 text-sm font-semibold', discountType === 'percent' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700']" @click="discountType = 'percent'">
                          %
                        </button>
                      </div>
                      <div class="flex items-center gap-1 flex-1">
                        <div class="relative w-full">
                          <input v-model.number="discountInput" type="number" :class="['w-full h-10 px-2 pr-6 rounded border text-right focus:outline-none focus:ring-2 focus:ring-primary-500', discountError ? 'border-red-400 bg-red-50' : 'border-gray-300']">
                          <span v-if="discountType === 'amount'" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₫</span>
                          <span v-else class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">%</span>
                        </div>
                      </div>
                    </div>
                    <div v-if="discountError" class="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-600 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-5 h-5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                      /></svg>
                      <span>{{ discountError }}</span>
                    </div>
                    <div class="flex justify-end gap-3 mt-6">
                      <UButton
                        label="Hủy"
                        color="primary"
                        variant="soft"
                        class="px-6 h-9 font-medium"
                        @click="closeDiscountModal"
                      />
                      <UButton
                        label="Áp dụng"
                        color="primary"
                        class="px-6 h-9 font-semibold"
                        :disabled="!!discountError"
                        @click="applyDiscount"
                      />
                    </div>
                    <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" @click="closeDiscountModal">
                      &times;
                    </button>
                  </div>
                </div>
                <!-- Modal phí giao hàng -->
                <div v-if="showShippingFeeModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click="closeShippingFeeModal">
                  <div class="bg-white rounded-lg w-full max-w-lg p-6 relative shadow-none border-none no-shadow-modal" style="box-shadow:none!important; border:none!important; outline:none!important;" @click.stop>
                    <div class="text-lg font-semibold mb-4">
                      Thêm phí giao hàng
                    </div>
                    <div class="mb-6 flex items-center gap-4">
                      <label class="text-sm font-medium min-w-[100px]">Giá trị:</label>
                      <div class="flex items-center gap-1 flex-1">
                        <div class="relative w-full">
                          <input v-model.number="shippingFeeInput" type="number" :class="['w-full h-10 px-2 pr-6 rounded border text-right focus:outline-none focus:ring-2 focus:ring-primary-500', shippingFeeError ? 'border-red-400 bg-red-50' : 'border-gray-300']">
                          <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₫</span>
                        </div>
                      </div>
                    </div>
                    <div v-if="shippingFeeError" class="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-600 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-5 h-5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                      /></svg>
                      <span>{{ shippingFeeError }}</span>
                    </div>
                    <div class="flex justify-end gap-3 mt-6">
                      <UButton
                        label="Hủy"
                        color="primary"
                        variant="soft"
                        class="px-6 h-9 font-medium"
                        @click="closeShippingFeeModal"
                      />
                      <UButton
                        label="Áp dụng"
                        color="primary"
                        class="px-6 h-9 font-semibold"
                        :disabled="!!shippingFeeError"
                        @click="applyShippingFee"
                      />
                    </div>
                    <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" @click="closeShippingFeeModal">
                      &times;
                    </button>
                  </div>
                </div>

                <!-- Modal điều chỉnh giá sản phẩm -->
                <div v-if="showPriceModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click="closePriceModal">
                  <div
                    class="bg-white rounded-lg w-full max-w-lg p-6 relative shadow-none border-none no-shadow-modal"
                    style="box-shadow:none!important; border:none!important; outline:none!important;"
                    @click.stop
                  >
                    <div class="text-lg font-semibold mb-4">
                      Điều chỉnh giá
                    </div>

                    <div class="mb-4 flex items-center justify-between">
                      <div class="text-sm text-gray-700 font-medium">
                        Đặt giá mới cho sản phẩm
                      </div>
                      <CustomCheckbox v-model="priceUseNew" />
                    </div>

                    <div v-if="priceUseNew" class="mb-6">
                      <label class="text-sm font-medium text-gray-700 mb-1 block">Giá mới</label>
                      <div class="relative">
                        <input
                          v-model.number="priceNewValue"
                          type="number"
                          min="0"
                          class="w-full h-10 px-2 pr-6 rounded border text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                          :class="priceError ? 'border-red-400 bg-red-50' : 'border-gray-300'"
                        >
                        <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₫</span>
                      </div>
                    </div>

                    <div v-else class="mb-6">
                      <div class="mb-2 flex items-center gap-4">
                        <label class="text-sm font-medium min-w-[100px]">Thêm giảm giá:</label>
                        <div class="flex rounded-lg overflow-hidden border border-gray-200">
                          <button
                            :class="['px-4 py-2 text-sm font-semibold', priceDiscountType === 'amount' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700']"
                            @click="priceDiscountType = 'amount'"
                          >
                            Giá trị
                          </button>
                          <button
                            :class="['px-4 py-2 text-sm font-semibold', priceDiscountType === 'percent' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700']"
                            @click="priceDiscountType = 'percent'"
                          >
                            %
                          </button>
                        </div>
                        <div class="flex-1 relative">
                          <input
                            v-model.number="priceDiscountInput"
                            type="number"
                            class="w-full h-10 px-2 pr-6 rounded border text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                            :class="priceError ? 'border-red-400 bg-red-50' : 'border-gray-300'"
                          >
                          <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">{{ priceDiscountType === 'amount' ? '₫' : '%' }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="mb-4">
                      <label class="text-sm font-medium text-gray-700 mb-1 block">Lý do giảm giá</label>
                      <input
                        v-model="priceReason"
                        type="text"
                        class="w-full h-9 px-2 rounded border focus:outline-none focus:ring-2 focus:ring-primary-500 border-gray-300"
                        placeholder="Ghi chú (không bắt buộc)"
                      >
                    </div>

                    <div class="mb-4 text-sm text-gray-700">
                      <div class="flex items-center justify-between">
                        <span>Giá gốc</span>
                        <span>
                          {{ (() => { const idx = priceModalIdx; if (idx === null) return '---'; const p = orderProducts[idx]; const base = (p && typeof p.baseUnitPrice === 'number') ? p.baseUnitPrice : (p ? p.unitPrice : 0); return currency(base) })() }}
                        </span>
                      </div>
                      <div class="flex items-center justify-between mt-1">
                        <span>Giá áp dụng</span>
                        <span>{{ typeof pricePreview === 'number' ? currency(pricePreview) : '---' }}</span>
                      </div>
                    </div>

                    <div v-if="priceError" class="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-600 text-sm">
                      {{ priceError }}
                    </div>

                    <div class="flex justify-between gap-3 mt-6">
                      <UButton
                        label="Xóa giảm giá"
                        color="error"
                        variant="soft"
                        class="px-4 h-9 font-medium"
                        @click="removePriceAdjust"
                      />
                      <div class="flex gap-3">
                        <UButton
                          label="Hủy"
                          color="primary"
                          variant="soft"
                          class="px-6 h-9 font-medium"
                          @click="closePriceModal"
                        />
                        <UButton
                          label="Xác nhận"
                          color="primary"
                          class="px-6 h-9 font-semibold"
                          :disabled="!!priceError"
                          @click="applyPriceAdjust"
                        />
                      </div>
                    </div>

                    <button
                      class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
                      @click="closePriceModal"
                    >
                      &times;
                    </button>
                  </div>
                </div>
            </div>
            </UPageCard>

            <!-- E-invoice card (moved to left) -->
            <UPageCard v-if="orderProducts.length" variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Hóa đơn điện tử
                <template #actions>
                  <button type="button" class="text-primary-600 text-sm hover:underline p-0 bg-transparent">
                    Thêm thông tin xuất hóa đơn
                  </button>
                </template>
              </BaseCardHeader>
              <div class="-mx-6 px-6 pb-2 text-sm text-gray-600">
                Cung cấp thông tin để xuất hóa đơn điện tử
              </div>
            </UPageCard>

            <!-- Shipping card (moved to left) -->
            <UPageCard v-if="orderProducts.length" variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Giao hàng</BaseCardHeader>
              <div class="-mx-6 px-6 pb-2">
                <div class="flex flex-wrap items-center gap-2 mb-4">
                  <button type="button" :class="['px-3 py-1.5 rounded border text-sm', shippingOption === 'carrier' ? 'border-primary-300 text-primary-700 bg-primary-50' : 'border-gray-200 text-gray-700 bg-white']" @click="shippingOption = 'carrier'">
                    Cổng vận chuyển
                  </button>
                  <button type="button" :class="['px-3 py-1.5 rounded border text-sm', shippingOption === 'self' ? 'border-primary-300 text-primary-700 bg-primary-50' : 'border-gray-200 text-gray-700 bg-white']" @click="shippingOption = 'self'">
                    Tự giao hàng
                  </button>
                  <button type="button" :class="['px-3 py-1.5 rounded border text-sm', shippingOption === 'delivered' ? 'border-primary-300 text-primary-700 bg-primary-50' : 'border-gray-200 text-gray-700 bg-white']" @click="shippingOption = 'delivered'">
                    Đã giao hàng
                  </button>
                  <button type="button" :class="['px-3 py-1.5 rounded border text-sm', shippingOption === 'later' ? 'border-primary-300 text-primary-700 bg-primary-50' : 'border-gray-200 text-gray-700 bg-white']" @click="shippingOption = 'later'">
                    Giao hàng sau
                  </button>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Hình thức giao hàng</label>
                  <RemoteSearchSelect
                    v-model="shippingMethodOption"
                    :fetch-fn="fetchShippingMethods"
                    placeholder="Chọn hình thức giao hàng"
                    :clearable="true"
                    label-field="label"
                    :searchable="false"
                  />
                </div>
              </div>
            </UPageCard>
          </div>
          <!-- Right side -->
          <div class="w-full lg:w-80 space-y-6 flex-shrink-0">
            <UPageCard id="source-card" variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Nguồn đơn</BaseCardHeader>
              <div class="-mx-6 px-6">
                <RemoteSearchSelect
                  v-model="selectedSource"
                  :fetch-fn="fetchSources"
                  placeholder="Chọn nguồn đơn"
                  :clearable="true"
                  :debounce="300"
                  label-field="name"
                  :class="[{ 'border border-red-400 rounded-md': triedSubmit && !hasSource }, 'w-full']"
                  :full-width="true"
                  :aria-invalid="(triedSubmit && !hasSource) ? 'true' : 'false'"
                >
                  <template #trigger-left="{ value }">
                    <img
                      v-if="value && typeof (value as any).iconUrl === 'string'"
                      :src="String((value as any).iconUrl)"
                      class="w-4 h-4 object-contain mr-2"
                      alt="icon"
                    >
                  </template>
                  <template #item="{ item }">
                    <div class="flex items-center gap-2 w-full">
                      <img
                        v-if="typeof item.iconUrl === 'string'"
                        :src="String(item.iconUrl)"
                        class="w-5 h-5 object-contain"
                        alt="icon"
                      >
                      <span class="text-sm text-gray-900 font-medium">{{ item.name }}</span>
                      <span v-if="item.code" class="ml-auto text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{{ item.code }}</span>
                    </div>
                  </template>
                </RemoteSearchSelect>
                <p v-if="triedSubmit && !hasSource" class="mt-2 text-xs text-red-600">
                  Vui lòng chọn nguồn đơn
                </p>
                <p class="mt-3 text-[11px] leading-4 text-gray-500">
                  Nguồn đơn sẽ giúp xác định nguồn bán hàng và giúp phân loại đơn hàng hiệu quả
                </p>
              </div>
            </UPageCard>
            <UPageCard id="customer-card" variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Khách hàng</BaseCardHeader>
              <div class="-mx-6 px-6">
                <RemoteSearchSelect
                  v-model="selectedCustomer"
                  :fetch-fn="fetchCustomers"
                  :fetch-more-fn="fetchMoreCustomers"
                  placeholder="Tìm theo tên, SDT...(F4)"
                  :clearable="true"
                  :debounce="300"
                  label-field="name"
                  open-key="F4"
                  :full-width="true"
                  :dropdown-max-height="420"
                  :searchable="true"
                  :search-in-trigger="true"
                  infinite-scroll
                  :class="[{ 'border border-red-400 rounded-md': triedSubmit && !hasCustomer }]"
                  :aria-invalid="(triedSubmit && !hasCustomer) ? 'true' : 'false'"
                >
                  <template #add-action>
                    <button
                      type="button"
                      class="flex items-center w-full px-3 py-3.5 text-primary-600 font-medium text-sm hover:bg-gray-50 border-b border-gray-200 rounded-t-md"
                      style="border-bottom: 1px solid #e8eaeb;"
                      @click.stop="onAddCustomer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-4 h-4 mr-2"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M10 4v12m6-6H4"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      Thêm mới khách hàng
                    </button>
                  </template>
                  <template #trigger-left="{ value }">
                    <img
                      v-if="value"
                      :src="getCustomerAvatarUrl((value as any).avatarUrl)"
                      class="w-4 h-4 object-cover rounded-full mr-2"
                      alt="avatar"
                      @error="e => { const t = e.target as HTMLImageElement; if (t) t.src = '/no-avatar.jpg' }"
                    >
                  </template>
                  <template #item="{ item }">
                    <div class="flex items-center gap-2 w-full">
                      <img
                        :src="getCustomerAvatarUrl(item.avatarUrl)"
                        class="w-6 h-6 rounded-full object-cover"
                        alt="avatar"
                        @error="e => { const t = e.target as HTMLImageElement; if (t) t.src = '/no-avatar.jpg' }"
                      >
                      <div class="flex-1 min-w-0">
                        <div class="text-sm text-gray-900 font-medium truncate">
                          {{ item.name }}
                        </div>
                        <div v-if="item.phone" class="text-xs text-gray-500 truncate">
                          {{ item.phone }}
                        </div>
                      </div>
                      <span v-if="item.code" class="ml-auto text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{{ item.code }}</span>
                    </div>
                  </template>
                </RemoteSearchSelect>
                <p v-if="triedSubmit && !hasCustomer" class="mt-2 text-xs text-red-600">
                  Vui lòng chọn khách hàng
                </p>
              </div>
            </UPageCard>
            <UPageCard id="branch-card" variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Ghi chú</BaseCardHeader>
              <div class="-mx-6 px-6">
                <textarea
                  rows="3"
                  class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="VD: Nhận hàng ghi công nợ"
                />
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Thông tin bổ sung</BaseCardHeader>
              <div class="-mx-6 px-6 space-y-4">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Bán tại chi nhánh</label>
                  <RemoteSearchSelect
                    v-model="selectedBranch"
                    :fetch-fn="fetchBranches"
                    placeholder="Cửa hàng chính"
                    :clearable="true"
                    :debounce="300"
                    :full-width="true"
                    label-field="name"
                    :class="[{ 'border border-red-400 rounded-md': triedSubmit && !hasBranch }]"
                    :aria-invalid="(triedSubmit && !hasBranch) ? 'true' : 'false'"
                  />
                  <p v-if="triedSubmit && !hasBranch" class="mt-2 text-xs text-red-600">
                    Vui lòng chọn chi nhánh bán hàng
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Nhân viên phụ trách</label>
                  <input
                    v-model="staffInCharge"
                    type="text"
                    readonly
                    class="w-full h-9 px-3 rounded-md border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Tên nhân viên"
                  >
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">Ngày đặt hàng <svg
                    class="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  ><circle cx="12" cy="12" r="10" /><path d="M12 8v4l2 2" /></svg></label>
                  <div class="relative">
                    <input
                      v-model="orderDate"
                      type="text"
                      placeholder="dd/MM/yyyy"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      @blur="orderDate = normalizeDDMMYYYY(orderDate)"
                    >
                    <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <p class="text-[11px] text-gray-500 mt-1">
                    Giá trị chỉ ghi nhận khi tạo đơn hàng
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Ngày hẹn giao</label>
                  <div class="relative">
                    <input
                      v-model="scheduledDate"
                      type="text"
                      placeholder="dd/MM/yyyy"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      @blur="scheduledDate = normalizeDDMMYYYY(scheduledDate)"
                    >
                    <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Tag</label>
                  <input
                    type="text"
                    placeholder="Tìm kiếm hoặc thêm mới tag"
                    class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                  <div class="text-right mt-1">
                    <a href="#" class="text-primary-600 text-xs font-medium hover:underline">Danh sách tag</a>
                  </div>
                </div>
              </div>
            </UPageCard>
          </div>
        </div>
        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-4 mt-10 border-t border-transparent pt-4">
          <button class="h-9 px-5 rounded-md bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50" @click="saveDraft">
            Lưu nháp
          </button>
          <div class="relative inline-flex items-center">
            <button class="h-9 px-5 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700" @click="createAndConfirm">
              Tạo đơn và xác nhận
            </button>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
  <AddCustomerModal v-model="showAddCustomerModal" @saved="onCustomerAdded" />
</template>

<style scoped>
/* Remove inner gray border of child controls when wrapper is marked invalid */
[aria-invalid="true"] :deep(.border-gray-300),
[aria-invalid="true"] :deep(.border-gray-200) {
  border-color: transparent !important;
}
[aria-invalid="true"] :deep(.border) {
  border-width: 0 !important;
}
/* Neutralize gray ring styles (Tailwind) inside invalid controls */
[aria-invalid="true"] :deep(.ring-gray-200),
[aria-invalid="true"] :deep(.ring-gray-300) {
  --tw-ring-color: transparent !important;
  box-shadow: none !important;
}
</style>
