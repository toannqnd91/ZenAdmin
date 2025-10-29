<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ordersService } from '@/services/orders.service'
import type { OrderDetail, OrderHistoryEvent, OrderDetailRawResponse, OrderHistoryListResponse } from '@/services/orders.service'
import BaseCardHeader from '@/components/BaseCardHeader.vue'
import IconEdit from '@/components/icons/IconEdit.vue'
import IconInvoicePending from '@/components/icons/IconInvoicePending.vue'
import IconChevronDown from '@/components/icons/IconChevronDown.vue'
import IconReturn from '@/components/icons/IconReturn.vue'
import IconPrintOrder from '@/components/icons/IconPrintOrder.vue'
import IconSuccess from '@/components/icons/IconSuccess.vue'
import ReceivePaymentModal from '@/components/orders/ReceivePaymentModal.vue'

// Raw payload supporting multiple backend shapes
interface RawOrderItem {
  id: number | string
  productId: number | string
  productName: string
  productImage?: string | null
  productPrice: number
  quantity: number
  total?: number
  rowTotal?: number
}
interface RawOrder {
  id: number | string
  createdOn: string
  orderStatusString?: string
  orderItems?: RawOrderItem[]
  subtotal?: number
  discountAmount?: number
  subTotalWithDiscount?: number
  shippingAmount?: number
  orderTotal?: number
  paymentMethod?: string | null
  shippingMethod?: string | null
  orderNote?: string | null
  paidAmount?: number
  paymentStatus?: string | null
  paymentStatusString?: string | null
}
interface RawCustomer {
  customerId?: string | number
  id?: string | number
  code?: string | null
  name: string
  phone?: string | null
  phoneNumber?: string | null
  email?: string | null
  totalSpent?: number
  lastOrderCode?: string | number
}
interface RawAddress {
  addressLine1?: string
  addressLine2?: string
  city?: string
  districtName?: string | null
  stateOrProvinceName?: string | null
  countryId?: string | null
  phone?: string | null
  phoneNumber?: string | null
  zipCode?: string | null
  contactName?: string | null
}
interface RawPayload {
  order: RawOrder
  customerInfo?: unknown
  customer?: RawCustomer
  shippingAddress?: RawAddress
}

const route = useRoute()
const router = useRouter()
const orderCodeParam = computed(() => route.params.code as string)
const loading = ref(false)

// Extend base OrderDetail with UI fields we augment (customer.code etc.)
interface UIOrderCustomer {
  id: string | number
  name: string
  phone?: string | null
  email?: string | null
  totalSpent?: number | null
  lastOrderCode?: string | null
  code?: string | null
}
interface UIOrderDetail extends OrderDetail {
  customer: UIOrderCustomer | null
}
const detail = ref<UIOrderDetail | null>(null)
const history = ref<OrderHistoryEvent[] | null>(null)

const statusSteps = ['Đặt hàng', 'Đã xác nhận', 'Đã xử lý', 'Giao hàng', 'Hoàn thành']
const stepTimes = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  if (!detail.value) return map
  const events = (history.value || []).slice().sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime())
  for (const step of statusSteps) {
    if (step === 'Đặt hàng' && detail.value.createdOn) map[step] = detail.value.createdOn
    if (map[step]) continue
    const simplifiedStep = step.toLowerCase().replace(/^đã\s+/, '').trim()
    for (const ev of events) {
      const metaVal = ev?.meta && typeof ev.meta === 'object' ? (ev.meta as Record<string, unknown>)['newStatus'] : undefined
      const candRawVal = (typeof metaVal === 'string' ? metaVal : ev?.message) || ''
      const candRaw = typeof candRawVal === 'string' ? candRawVal.toLowerCase() : ''
      const simplifiedCand = candRaw.replace(/^đã\s+/, '').trim()
      if (simplifiedCand.includes(simplifiedStep) || simplifiedStep.includes(simplifiedCand)) {
        map[step] = ev.createdOn
        break
      }
    }
  }
  if (map['Đặt hàng'] && !map['Đã xác nhận']) {
    map['Đã xác nhận'] = map['Đặt hàng']
  }
  return map
})

function connectorClass(idx: number) {
  const current = statusSteps[idx]
  if (current && stepTimes.value[current]) return 'bg-emerald-100'
  return 'bg-gray-200'
}

function formatCurrency(v?: number | null) {
  if (v == null || isNaN(v)) return '0đ'
  return new Intl.NumberFormat('vi-VN').format(v) + 'đ'
}
function formatDateTime(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy} ${hh}:${mi}`
}

function formatPaymentMethod(code?: string | null) {
  if (!code) return 'Tiền mặt'
  switch (code) {
    case 'TienMat':
    case 'TIENMAT':
      return 'Tiền mặt'
    case 'ChuyenKhoan':
    case 'BANK':
      return 'Chuyển khoản'
    case 'ViDienTu':
    case 'WALLET':
      return 'Ví điện tử'
    default:
      return 'Tiền mặt'
  }
}

const paymentStatusDisplay = computed(() => {
  const raw = (detail.value?.paymentStatus || detail.value?.payment?.paymentStatus || '').toString()
  return raw || 'Chưa thanh toán'
})
function isPartialPayment(s: string) {
  const v = s.toLowerCase()
  return v.includes('partial') || v.includes('một phần') || v.includes('mot phan')
}
function isPaid(s: string) {
  const v = s.toLowerCase()
  return v.includes('paid') || v.includes('đã thanh toán') || v.includes('da thanh toan')
}
function isUnpaid(s: string) {
  const v = s.toLowerCase()
  return v.includes('unpaid') || v.includes('chưa thanh toán') || v.includes('chua thanh toan')
}
function isOverPaid(s: string) {
  const v = s.toLowerCase()
  return v.includes('over') || v.includes('thừa') || v.includes('thua')
}
function isRefunded(s: string) {
  const v = s.toLowerCase()
  return v.includes('refund') || v.includes('hoàn') || v.includes('hoan')
}

// Action toolbar helpers
function startReturn() {
  console.debug('startReturn clicked', detail.value?.orderCode)
}
function printOrder() {
  window.print()
}
function prevOrder() {
  console.debug('prevOrder')
}
function nextOrder() {
  console.debug('nextOrder')
}

// --- Receive Payment Modal (external component) ---
const showReceivePayment = ref(false)
const remainingAmount = computed(() => {
  const paid = detail.value?.payment?.paidAmount || 0
  const total = detail.value?.payment?.orderTotal || 0
  return Math.max(0, total - paid)
})
interface ReceivePaymentPayload {
  method: 'TienMat' | 'ChuyenKhoan' | 'ViDienTu'
  amount: number
  reference: string
}
async function handleReceivePaymentSubmit(payload: ReceivePaymentPayload) {
  const code = (orderCodeParam.value || '').replace(/^#/, '')
  const methodMap: Record<ReceivePaymentPayload['method'], 1 | 2 | 3> = { TienMat: 1, ChuyenKhoan: 2, ViDienTu: 3 }
  try {
    await ordersService.payOrder(code, {
      amount: payload.amount,
      method: methodMap[payload.method],
      description: payload.reference,
      autoCompleteWhenFullyPaid: true
    })
    await fetchData()
    try {
      const toast = useToast()
      toast.add({ title: 'Đã nhận tiền', description: `Đã ghi nhận ${formatCurrency(payload.amount)}`, color: 'success' })
    } catch (_err) { void _err }
  } catch (err) {
    try {
      const toast = useToast()
      toast.add({ title: 'Nhận tiền thất bại', description: err instanceof Error ? err.message : 'Đã xảy ra lỗi', color: 'error' })
    } catch (_err) { void _err }
  }
}

// Helpers for discount display
interface PriceLike {
  originalUnitPrice?: number
  unitPrice?: number
}

type UIOrderItem = {
  id: number | string
  productId: number | string
  productName: string
  quantity: number
  unitPrice: number
  originalUnitPrice: number
  discountAmount: number
  discountPercent: number
  lineTotal: number
  thumbnailImageUrl: string | null
}
function getOriginalPrice(item: PriceLike) {
  return typeof item.originalUnitPrice === 'number' ? item.originalUnitPrice : (typeof item.unitPrice === 'number' ? item.unitPrice : 0)
}
function getDiscountAmount(item: PriceLike) {
  const orig = getOriginalPrice(item)
  const now = typeof item.unitPrice === 'number' ? item.unitPrice : orig
  return Math.max(0, orig - now)
}
function getDiscountPercent(item: PriceLike) {
  const orig = getOriginalPrice(item)
  const amt = getDiscountAmount(item)
  return orig > 0 ? Math.round((amt * 100) / orig) : 0
}

async function fetchData() {
  try {
    loading.value = true
    const rawCode = orderCodeParam.value || ''
    const codeForApi = rawCode.replace(/^#/, '')
    const [orderRes, historyRes] = await Promise.all([
      ordersService.getOrderById(codeForApi),
      ordersService.getOrderHistory(codeForApi)
    ])
    if (orderRes && 'success' in orderRes && (orderRes as OrderDetailRawResponse).success && orderRes.data) {
      const payload = orderRes.data as unknown as RawPayload
      const o = payload.order
      let rawCustomer: RawCustomer | undefined = payload.customer
      let rawAddress: RawAddress | undefined = payload.shippingAddress
      if (!rawCustomer || !rawAddress) {
        const ci = payload.customerInfo as unknown
        if (ci && typeof ci === 'object') {
          const obj = ci as Record<string, unknown>
          if (!rawCustomer && obj.customer && typeof obj.customer === 'object') rawCustomer = obj.customer as RawCustomer
          if (!rawAddress && obj.address && typeof obj.address === 'object') rawAddress = obj.address as RawAddress
        }
      }
      if (o) {
        let items: UIOrderItem[] = []
        if (Array.isArray(o.orderItems)) {
          items = o.orderItems.map((it) => {
            const qty = it.quantity || 1
            const originalPrice = it.productPrice
            const effectivePrice = (it.rowTotal && qty > 0) ? (it.rowTotal / qty) : it.productPrice
            const discountAmount = Math.max(0, originalPrice - effectivePrice)
            const discountPercent = originalPrice > 0 ? Math.round((discountAmount * 100) / originalPrice) : 0
            return {
              id: it.id,
              productId: it.productId,
              productName: it.productName,
              quantity: it.quantity,
              unitPrice: effectivePrice,
              originalUnitPrice: originalPrice,
              discountAmount,
              discountPercent,
              lineTotal: (it.rowTotal ?? it.total ?? (effectivePrice * it.quantity)) || 0,
              thumbnailImageUrl: it.productImage || null
            }
          })
        }
        const totalQty = items.reduce((a, i) => a + (i.quantity || 0), 0)
        const mappedCustomer: UIOrderCustomer | null = rawCustomer
          ? {
              id: (rawCustomer.customerId ?? rawCustomer.id) as string | number,
              name: rawCustomer.name,
              phone: rawCustomer.phoneNumber || rawCustomer.phone || null,
              email: rawCustomer.email || null,
              totalSpent: rawCustomer.totalSpent ?? null,
              lastOrderCode: rawCustomer.lastOrderCode != null ? String(rawCustomer.lastOrderCode) : null,
              code: rawCustomer.code || null
            }
          : null
        const mappedAddress = rawAddress
          ? {
              contactName: rawAddress.contactName || rawCustomer?.name || null,
              phoneNumber: rawAddress.phoneNumber || rawAddress.phone || rawCustomer?.phoneNumber || rawCustomer?.phone || null,
              email: rawCustomer?.email || null,
              addressLine1: rawAddress.addressLine1 || null,
              addressLine2: rawAddress.addressLine2 || null,
              country: rawAddress.countryId || null,
              stateOrProvince: rawAddress.stateOrProvinceName || null,
              district: rawAddress.districtName || null,
              city: rawAddress.city || null,
              zipCode: rawAddress.zipCode || null
            }
          : null
        detail.value = {
          id: o.id,
          orderCode: rawCode || `#${o.id}`,
          status: o.orderStatusString || '',
          processStatus: o.orderStatusString || '',
          paymentStatus: o.paymentStatus || o.paymentStatusString || o.orderStatusString || null,
          createdOn: o.createdOn,
          items,
          customer: mappedCustomer,
          address: mappedAddress,
          payment: {
            totalQuantity: totalQty,
            subTotal: o.subtotal || 0,
            discountAmount: o.discountAmount || 0,
            shippingFeeAmount: o.shippingAmount || 0,
            orderTotal: o.orderTotal || 0,
            paidAmount: o.paidAmount || o.orderTotal || 0,
            paymentMethod: o.paymentMethod || null,
            paymentStatus: o.paymentStatus || o.paymentStatusString || o.orderStatusString || null
          },
          note: o.orderNote || null,
          meta: {
            sourceName: null,
            branchName: null,
            staffInCharge: null,
            creatorName: null,
            orderDate: o.createdOn,
            scheduledDate: null,
            shippingMethod: o.shippingMethod || null,
            deliveryOption: null,
            expectedDeliveryDate: null,
            tags: null
          },
          history: []
        }
      }
    }
    if (historyRes && 'success' in historyRes) {
      const hr = historyRes as OrderHistoryListResponse
      history.value = hr.success && hr.data ? hr.data.items.map(h => ({ id: h.id, createdOn: h.createdOn, actorName: null, message: h.note || h.newStatusText || 'Cập nhật trạng thái', meta: { oldStatus: h.oldStatusText, newStatus: h.newStatusText } })) : []
    }
  } finally {
    loading.value = false
  }
}
onMounted(fetchData)

function goBack() {
  router.push('/orders')
}
</script>

<template>
  <UDashboardPanel :id="`order-${orderCodeParam}`">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <button
              class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              @click="goBack"
            >
              <svg
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div>
              <div class="text-lg font-semibold">
                Chi tiết đơn hàng
              </div>
              <div class="text-xs text-gray-500">
                Mã đơn hàng: <span class="font-medium">{{ (detail && detail.orderCode) ? detail.orderCode : (orderCodeParam || '') }}</span>
              </div>
            </div>
          </div>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div v-if="loading" class="p-6 text-center text-sm text-gray-500">
        Đang tải...
      </div>
      <div v-else-if="!detail" class="p-6 text-center text-sm text-gray-500">
        Không tìm thấy đơn hàng.
      </div>
      <div v-else>
        <div class="w-full max-w-screen-xl mx-auto px-6">
          <div class="space-y-6">
            <!-- Full-width toolbar (single line, horizontally scrollable if narrow) -->
            <div class="flex items-center justify-between gap-6 overflow-x-auto whitespace-nowrap pr-2">
              <div class="flex items-center gap-3 flex-shrink-0">
                <div class="text-xl font-semibold text-gray-900">
                  {{ detail.orderCode }}
                </div>
                <div class="flex items-center gap-2">
                  <span v-for="pill in ['Đã thanh toán', 'Đã xử lý', 'Lưu trữ']" :key="pill" class="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-600">
                    <span class="w-2 h-2 rounded-full bg-gray-400" />
                    {{ pill }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-4 flex-shrink-0">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  class="font-medium inline-flex items-center gap-2"
                  @click="startReturn"
                >
                  <IconReturn class="w-4 h-4" />
                  Trả hàng
                </UButton>
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  class="font-medium inline-flex items-center gap-2"
                  @click="printOrder"
                >
                  <IconPrintOrder class="w-4 h-4" />
                  In đơn hàng
                </UButton>
                <UDropdown
                  :items="[[
                    { label: 'Hủy đơn', click: () => console.debug('cancel order') }
                  ], [
                    { label: 'Sao chép', click: () => console.debug('copy order') }
                  ]]"
                  :popper="{ placement: 'bottom-end' }"
                >
                  <UButton
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    trailing-icon="i-heroicons-chevron-down"
                    class="font-medium"
                  >
                    Thao tác khác
                  </UButton>
                </UDropdown>
                <div class="flex border border-gray-200 rounded-md overflow-hidden">
                  <UButton
                    size="sm"
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-chevron-left"
                    class="rounded-none"
                    @click="prevOrder"
                  />
                  <div class="w-px bg-gray-200" />
                  <UButton
                    size="sm"
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-chevron-right"
                    class="rounded-none"
                    @click="nextOrder"
                  />
                </div>
              </div>
            </div>
            <!-- Full-width status card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader class="sr-only">
                Trạng thái
              </BaseCardHeader>
              <div class="flex items-stretch w-full text-sm">
                <template v-for="(s, idx) in statusSteps" :key="s">
                  <div class="flex items-center gap-2">
                    <span :class="['w-3 h-3 rounded-full', stepTimes[s] ? 'bg-green-500' : 'bg-gray-400']" />
                    <div class="flex flex-col">
                      <span :class="[stepTimes[s] ? 'text-gray-900 font-medium' : 'text-gray-500 font-medium']">{{ s }}</span>
                      <span v-if="stepTimes[s]" class="text-xs text-gray-500">{{ formatDateTime(stepTimes[s]) }}</span>
                    </div>
                  </div>
                  <div v-if="idx < statusSteps.length - 1" :class="['flex-1 h-px mx-8 self-center', connectorClass(idx)]" />
                </template>
              </div>
            </UPageCard>
            <div class="flex flex-col lg:flex-row gap-6">
              <!-- Left column -->
              <div class="flex-1 flex flex-col gap-6">
                <!-- Shipped items (styled like /orders/create product table) -->
                <UPageCard variant="soft" class="bg-white rounded-lg">
                  <BaseCardHeader>
                    <span class="inline-flex items-center gap-2">
                      <span class="inline-block w-5 h-5 align-middle" aria-hidden="true">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          focusable="false"
                          aria-hidden="true"
                          class="w-5 h-5"
                        >
                          <path
                            fill="#fff"
                            stroke="#CFF6E7"
                            stroke-width="4"
                            d="M12 22c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10Z"
                          />
                          <path
                            fill="#0DB473"
                            fill-rule="evenodd"
                            d="M4 12c0-4.416 3.584-8 8-8s8 3.584 8 8-3.584 8-8 8-8-3.584-8-8m6.4 1.736 5.272-5.272 1.128 1.136-6.4 6.4-3.2-3.2 1.128-1.128z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </span>
                      <span>Đã xử lý giao hàng</span>
                    </span>
                  </BaseCardHeader>
                  <div class="-mx-4 lg:-mx-6 overflow-x-auto">
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
                          <th class="px-6 py-2 font-semibold text-right">
                            Thành tiền
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="item in detail.items"
                          :key="item.id"
                        >
                          <td class="px-6 py-2 align-top">
                            <div class="flex items-center gap-2">
                              <img
                                :src="item.thumbnailImageUrl || '/no-image.svg'"
                                class="w-10 h-10 rounded bg-gray-100 object-cover flex-shrink-0"
                              >
                              <div>
                                <div class="font-medium text-gray-800">
                                  {{ item.productName }}
                                </div>
                                <!-- Placeholder for potential secondary name / normalizedName if available in future -->
                                <div class="text-xs text-gray-500">
                                  SKU: {{ item.productId }}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-2 align-top">
                            {{ item.quantity }}
                          </td>
                          <td class="px-6 py-2 align-top">
                            <div class="flex flex-col">
                              <span class="text-primary-600 font-semibold leading-snug">{{ formatCurrency(item.unitPrice) }}</span>
                              <div v-if="getDiscountAmount(item) > 0" class="text-xs text-gray-500 leading-snug">
                                <span class="line-through mr-2">{{ formatCurrency(getOriginalPrice(item)) }}</span>
                                <span class="text-red-600 mr-1">-{{ formatCurrency(getDiscountAmount(item)).replace('đ', '') }}</span>
                                <span class="text-red-600">(-{{ getDiscountPercent(item) }}%)</span>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-2 align-top text-right">
                            <span class="font-semibold">{{ formatCurrency(item.lineTotal) }}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </UPageCard>
                <!-- Quick Payment Summary (appears only if unpaid or partial) -->
                <UPageCard
                  v-if="paymentStatusDisplay && (isUnpaid(paymentStatusDisplay) || isPartialPayment(paymentStatusDisplay))"
                  variant="soft"
                  class="bg-white rounded-lg"
                >
                  <div class="text-sm">
                    <div class="flex items-center gap-2 mb-4">
                      <!-- Reuse icon logic but only show one icon here -->
                      <span class="inline-block w-5 h-5" aria-hidden="true">
                        <template v-if="isPartialPayment(paymentStatusDisplay)">
                          <svg
                            class="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="12"
                              fill="#FFDF9B"
                            />
                            <path
                              fill="#fff"
                              fill-rule="evenodd"
                              d="M19 12a7 7 0 1 0-14 0z"
                              clip-rule="evenodd"
                            />
                            <path
                              fill="#E49C06"
                              d="M19 12v.75h.75v-.75zm-14 0h-.75v.75h.75zm7-6.25a6.25 6.25 0 0 1 6.25 6.25h1.5a7.75 7.75 0 0 0-7.75-7.75zm-6.25 6.25a6.25 6.25 0 0 1 6.25-6.25v-1.5a7.75 7.75 0 0 0-7.75 7.75zm-.75.75h14v-1.5h-14z"
                            />
                            <path
                              fill="#E49C06"
                              d="M19 12v-.75h.75v.75zm-14 0h-.75v-.75h.75zm7 7.75a8 8 0 0 1-.759-.037l.145-1.493q.303.03.614.03zm-2.25-.332a7.7 7.7 0 0 1-1.404-.582l.708-1.322q.537.288 1.13.469zm-2.667-1.427a8 8 0 0 1-1.074-1.074l1.16-.952q.391.475.866.867zm-1.919-2.336a7.7 7.7 0 0 1-.582-1.405l1.435-.435q.181.594.47 1.131zm-.877-2.896a8 8 0 0 1-.037-.759h1.5q0 .31.03.614zm.713-1.509h.7v1.5h-.7zm2.1 0h1.4v1.5h-1.4zm2.8 0h1.4v1.5h-1.4zm2.8 0h1.4v1.5h-1.4zm2.8 0h1.4v1.5h-1.4zm2.8 0h.7v1.5h-.7zm1.45.75q0 .385-.037.759l-1.493-.145q.03-.303.03-.614zm-.332 2.25q-.224.736-.582 1.405l-1.322-.709q.288-.537.469-1.13zm-1.427 2.667a8 8 0 0 1-1.074 1.074l-.952-1.16a6.3 6.3 0 0 0 .867-.866zm-2.336 1.919a7.7 7.7 0 0 1-1.405.582l-.435-1.435q.594-.181 1.131-.47zm-2.896.877a8 8 0 0 1-.759.037v-1.5q.31 0 .614-.03z"
                            />
                          </svg>
                        </template>
                        <template v-else>
                          <svg
                            class="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <rect
                              width="24"
                              height="24"
                              fill="#FFDF9B"
                              rx="12"
                            />
                            <path
                              fill="#fff"
                              stroke="#E49C06"
                              stroke-dasharray="2 2"
                              stroke-width="1.5"
                              d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"
                            />
                          </svg>
                        </template>
                      </span>
                      <span class="text-base font-semibold text-gray-900">{{ paymentStatusDisplay }}</span>
                    </div>
                    <div class="space-y-2">
                      <div class="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4">
                        <span class="text-gray-600">Tổng tiền hàng</span>
                        <span v-if="detail.payment?.totalQuantity != null" class="text-gray-500 justify-self-center">{{ detail.payment.totalQuantity }} sản phẩm</span>
                        <span v-else class="text-gray-500 justify-self-center" />
                        <span class="font-medium justify-self-end">{{ formatCurrency(detail.items.reduce((a, i) => a + (i.lineTotal || 0), 0)) }}</span>
                      </div>
                      <div
                        v-if="detail.payment?.discountAmount && detail.payment.discountAmount > 0"
                        class="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4"
                      >
                        <span class="text-gray-600">Khuyến mãi</span>
                        <span />
                        <span class="text-red-600 justify-self-end">-{{ formatCurrency(detail.payment.discountAmount) }}</span>
                      </div>
                      <div class="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4">
                        <span class="text-gray-600">Thành tiền</span>
                        <span />
                        <span class="font-semibold justify-self-end">{{ formatCurrency(detail.payment?.orderTotal) }}</span>
                      </div>
                      <div
                        v-if="isPartialPayment(paymentStatusDisplay) && detail.payment?.paidAmount"
                        class="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4 pt-2 border-t border-gray-100"
                      >
                        <span class="text-gray-600">Khách đã trả</span>
                        <span class="text-gray-500 justify-self-center">{{ formatPaymentMethod(detail.payment?.paymentMethod) }}</span>
                        <span class="font-medium justify-self-end">{{ formatCurrency(detail.payment?.paidAmount) }}</span>
                      </div>
                      <div
                        v-if="isPartialPayment(paymentStatusDisplay) && detail.payment?.paidAmount != null && detail.payment?.orderTotal != null"
                        class="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4"
                      >
                        <span class="text-gray-900 font-semibold">Khách còn phải trả</span>
                        <span />
                        <span class="text-gray-900 font-semibold justify-self-end">{{ formatCurrency(Math.max(0, (detail.payment?.orderTotal || 0) - (detail.payment?.paidAmount || 0))) }}</span>
                      </div>
                    </div>
                    <div
                      class="flex justify-end gap-3 pt-4"
                      :class="isUnpaid(paymentStatusDisplay) ? 'mt-2 border-t border-gray-100 pt-4' : 'mt-2'"
                    >
                      <UButton
                        color="neutral"
                        variant="soft"
                        size="md"
                        class="font-medium inline-flex items-center gap-2"
                        icon="i-heroicons-qr-code"
                      >
                        <span class="flex items-center gap-1">
                          Lấy mã QR
                        </span>
                      </UButton>
                      <UButton
                        color="primary"
                        variant="solid"
                        size="md"
                        class="font-medium inline-flex items-center gap-2"
                        @click="showReceivePayment = true"
                      >
                        <svg
                          class="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.7"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <rect
                            x="2"
                            y="6"
                            width="20"
                            height="12"
                            rx="2"
                          />
                          <path d="M6 10h4" />
                          <path d="M6 14h8" />
                          <path d="M14 10h4" />
                        </svg>
                        Nhận tiền
                      </UButton>
                    </div>
                  </div>
                </UPageCard>
                <!-- Payment (hidden when quick summary shown) -->
                <UPageCard
                  v-if="!(paymentStatusDisplay && (isUnpaid(paymentStatusDisplay) || isPartialPayment(paymentStatusDisplay)))"
                  variant="soft"
                  class="bg-white rounded-lg"
                >
                  <BaseCardHeader>
                    <span class="inline-flex items-center gap-2 select-none">
                      <template v-if="paymentStatusDisplay">
                        <!-- Refunded -->
                        <span v-if="isRefunded(paymentStatusDisplay)" class="inline-block w-5 h-5" aria-hidden="true">
                          <svg
                            class="w-5 h-5 text-rose-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="M3 10v6h6" />
                            <path d="M21 14a9 9 0 0 1-15.3 6.3L3 16" />
                            <path d="M3 10a9 9 0 0 1 15.3-6.3L21 8" />
                          </svg>
                        </span>
                        <!-- Overpaid -->
                        <span v-else-if="isOverPaid(paymentStatusDisplay)" class="inline-block w-5 h-5" aria-hidden="true">
                          <svg
                            class="w-5 h-5 text-violet-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.6"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <ellipse
                              cx="12"
                              cy="6"
                              rx="7"
                              ry="3"
                            />
                            <path d="M5 6v4c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
                            <path d="M5 14v4c0 1.66 3.13 3 7 3s7-1.34 7-3v-4" />
                          </svg>
                        </span>
                        <!-- Partial payment (provided) -->
                        <span v-else-if="isPartialPayment(paymentStatusDisplay)" class="inline-block w-5 h-5" aria-hidden="true">
                          <svg
                            class="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="12"
                              fill="#FFDF9B"
                            />
                            <path
                              fill="#fff"
                              fill-rule="evenodd"
                              d="M19 12a7 7 0 1 0-14 0z"
                              clip-rule="evenodd"
                            />
                            <path
                              fill="#E49C06"
                              d="M19 12v.75h.75v-.75zm-14 0h-.75v.75h.75zm7-6.25a6.25 6.25 0 0 1 6.25 6.25h1.5a7.75 7.75 0 0 0-7.75-7.75zm-6.25 6.25a6.25 6.25 0 0 1 6.25-6.25v-1.5a7.75 7.75 0 0 0-7.75 7.75zm-.75.75h14v-1.5h-14z"
                            />
                            <path
                              fill="#E49C06"
                              d="M19 12v-.75h.75v.75zm-14 0h-.75v-.75h.75zm7 7.75a8 8 0 0 1-.759-.037l.145-1.493q.303.03.614.03zm-2.25-.332a7.7 7.7 0 0 1-1.404-.582l.708-1.322q.537.288 1.13.469zm-2.667-1.427a8 8 0 0 1-1.074-1.074l1.16-.952q.391.475.866.867zm-1.919-2.336a7.7 7.7 0 0 1-.582-1.405l1.435-.435q.181.594.47 1.131zm-.877-2.896a8 8 0 0 1-.037-.759h1.5q0 .31.03.614zm.713-1.509h.7v1.5h-.7zm2.1 0h1.4v1.5h-1.4zm2.8 0h1.4v1.5h-1.4zm2.8 0h1.4v1.5h-1.4zm2.8 0h1.4v1.5h-1.4zm2.8 0h.7v1.5h-.7zm1.45.75q0 .385-.037.759l-1.493-.145q.03-.303.03-.614zm-.332 2.25q-.224.736-.582 1.405l-1.322-.709q.288-.537.469-1.13zm-1.427 2.667a8 8 0 0 1-1.074 1.074l-.952-1.16a6.3 6.3 0 0 0 .867-.866zm-2.336 1.919a7.7 7.7 0 0 1-1.405.582l-.435-1.435q.594-.181 1.131-.47zm-2.896.877a8 8 0 0 1-.759.037v-1.5q.31 0 .614-.03z"
                            />
                          </svg>
                        </span>
                        <!-- Paid (provided) -->
                        <span v-else-if="isPaid(paymentStatusDisplay)" class="inline-block w-5 h-5" aria-hidden="true">
                          <IconSuccess />
                        </span>
                        <!-- Unpaid (provided) -->
                        <span v-else-if="isUnpaid(paymentStatusDisplay)" class="inline-block w-5 h-5" aria-hidden="true">
                          <svg
                            class="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <rect
                              width="24"
                              height="24"
                              fill="#FFDF9B"
                              rx="12"
                            />
                            <path
                              fill="#fff"
                              stroke="#E49C06"
                              stroke-dasharray="2 2"
                              stroke-width="1.5"
                              d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"
                            />
                          </svg>
                        </span>
                        <!-- Fallback dot -->
                        <span v-else class="inline-block w-5 h-5">
                          <span class="block w-5 h-5 rounded-full bg-gray-300" />
                        </span>
                        <span>{{ paymentStatusDisplay }}</span>
                      </template>
                      <template v-else>
                        <span>—</span>
                      </template>
                    </span>
                  </BaseCardHeader>
                  <div class="pb-3 text-sm space-y-2">
                    <div class="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4">
                      <span class="text-gray-600">Tổng tiền hàng</span>
                      <span v-if="detail.payment?.totalQuantity != null" class="text-gray-500 justify-self-center">{{ detail.payment.totalQuantity }} sản phẩm</span>
                      <span v-else class="text-gray-500 justify-self-center" />
                      <span class="font-medium justify-self-end">{{ formatCurrency(detail.items.reduce((a, i) => a + (i.lineTotal || 0), 0)) }}</span>
                    </div>
                    <div
                      v-if="detail.payment?.discountAmount && detail.payment.discountAmount > 0"
                      class="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4"
                    >
                      <span class="text-gray-600">Khuyến mãi</span>
                      <span />
                      <span class="text-red-600 justify-self-end">-{{ formatCurrency(detail.payment.discountAmount) }}</span>
                    </div>
                    <div class="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4">
                      <span class="text-gray-600">Thành tiền</span>
                      <span />
                      <span class="font-semibold justify-self-end">{{ formatCurrency(detail.payment?.orderTotal) }}</span>
                    </div>
                  </div>
                  <div class="border-t border-gray-100 py-3 text-sm">
                    <div class="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4">
                      <span class="text-gray-700 font-medium">Khách đã trả</span>
                      <span class="text-gray-500 justify-self-center">{{ formatPaymentMethod(detail.payment?.paymentMethod) }}</span>
                      <span class="font-medium justify-self-end">{{ formatCurrency(detail.payment?.paidAmount) }}</span>
                    </div>
                  </div>
                </UPageCard>
                <!-- E-invoice -->
                <UPageCard variant="soft" class="bg-white rounded-lg">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex items-start gap-3">
                      <span class="inline-flex items-center justify-center w-6 h-6" aria-hidden="true">
                        <IconInvoicePending class="w-6 h-6" />
                      </span>
                      <div>
                        <p class="font-medium text-gray-900 leading-6">
                          Chưa yêu cầu hóa đơn điện tử
                        </p>
                        <p class="mt-1 text-sm text-gray-600">
                          Đơn hàng chưa có yêu cầu hóa đơn điện tử. Vui lòng thêm thông tin để tạo hóa đơn điện tử
                        </p>
                      </div>
                    </div>
                    <div class="pt-1">
                      <button type="button" class="text-primary-600 text-sm font-medium whitespace-nowrap hover:underline">
                        Yêu cầu hóa đơn
                      </button>
                    </div>
                  </div>
                </UPageCard>
                <!-- History -->
                <UPageCard variant="soft" class="bg-white rounded-lg">
                  <BaseCardHeader>
                    Lịch sử đơn hàng
                  </BaseCardHeader>
                  <div class="text-sm">
                    <div v-if="!history || !history.length" class="text-gray-500">
                      Không có lịch sử.
                    </div>
                    <ul v-else class="space-y-3">
                      <li v-for="h in history" :key="h.id || h.createdOn" class="flex gap-3">
                        <div class="flex flex-col items-center">
                          <div class="w-2 h-2 rounded-full bg-primary-500 mt-1" />
                          <div class="flex-1 w-px bg-gray-200" />
                        </div>
                        <div>
                          <div class="text-xs text-gray-500">
                            {{ formatDateTime(h.createdOn) }}
                          </div>
                          <div class="text-gray-800">
                            {{ h.message }}
                          </div>
                          <div v-if="h.actorName" class="text-xs text-gray-400">
                            {{ h.actorName }}
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </UPageCard>
              </div>
              <!-- Right column -->
              <div class="w-full lg:w-80 space-y-6 flex-shrink-0">
                <UPageCard variant="soft" class="bg-white rounded-lg">
                  <BaseCardHeader>
                    Nguồn đơn
                  </BaseCardHeader>
                  <div class="text-sm">
                    {{ detail.meta?.sourceName || 'POS' }}
                  </div>
                </UPageCard>
                <UPageCard variant="soft" class="bg-white rounded-lg">
                  <BaseCardHeader>
                    Khách hàng
                  </BaseCardHeader>
                  <div class="text-sm">
                    <div class="space-y-4">
                      <!-- Header with avatar -->
                      <div class="flex items-start">
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-medium text-primary-600 hover:underline cursor-pointer truncate max-w-[160px]">
                              {{ detail.customer?.name || '---' }}
                            </span>
                            <span
                              v-if="detail.customer?.code"
                              class="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-[11px] font-medium text-gray-600"
                            >
                              {{ (detail.customer as any).code }}
                            </span>
                          </div>
                          <div class="mt-1 flex flex-col gap-0.5 text-xs text-gray-600">
                            <div v-if="detail.customer?.phone">
                              <span class="font-medium text-gray-700">ĐT:</span>
                              {{ detail.customer.phone }}
                            </div>
                            <div>
                              <span class="font-medium text-gray-700">Email:</span>
                              {{ detail.customer?.email || 'Không có' }}
                            </div>
                          </div>
                        </div>
                        <div class="flex flex-col gap-1">
                          <UButton
                            color="neutral"
                            variant="ghost"
                            size="xs"
                            aria-label="Sửa khách hàng"
                          >
                            <IconEdit />
                          </UButton>
                        </div>
                      </div>
                      <!-- Spend summary -->
                      <div class="pt-3 border-t border-gray-100">
                        <div class="flex items-start justify-between text-xs">
                          <div class="text-gray-600 leading-snug">
                            <div>Tổng chi tiêu</div>
                            <div v-if="detail.payment?.totalQuantity != null" class="text-gray-400">
                              ({{ detail.payment.totalQuantity }} đơn hàng)
                            </div>
                          </div>
                          <div class="text-gray-900 font-semibold text-sm">
                            {{ formatCurrency(detail.customer?.totalSpent || detail.payment?.subTotal || 0) }}
                          </div>
                        </div>
                      </div>
                      <!-- Address -->
                      <div class="pt-3 border-t border-gray-100">
                        <div class="flex items-center justify-between mb-1">
                          <div class="text-xs font-medium text-gray-700">
                            Địa chỉ giao hàng
                          </div>
                          <UButton
                            color="neutral"
                            variant="ghost"
                            size="xs"
                            aria-label="Sửa địa chỉ giao hàng"
                          >
                            <IconEdit />
                          </UButton>
                        </div>
                        <div class="text-xs text-gray-700 whitespace-pre-line">
                          <template v-if="detail.address">
                            <div>{{ detail.address.contactName || detail.customer?.name }}</div>
                            <div v-if="detail.address.phoneNumber">
                              {{ detail.address.phoneNumber }}
                            </div>
                            <div>
                              {{ [detail.address.addressLine1, detail.address.city, detail.address.country].filter(Boolean).join(', ') || 'Vietnam' }}
                            </div>
                          </template>
                          <template v-else>
                            Chưa có địa chỉ giao hàng
                          </template>
                        </div>
                      </div>
                      <!-- Extra actions -->
                      <div class="pt-3 border-t border-gray-100 flex justify-center">
                        <button type="button" class="text-primary-600 text-xs font-medium inline-flex items-center gap-1">
                          Xem thêm
                          <IconChevronDown class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </UPageCard>
                <UPageCard variant="soft" class="bg-white rounded-lg">
                  <BaseCardHeader>Ghi chú</BaseCardHeader>
                  <div v-if="!detail.note" class="text-sm text-gray-500">
                    Chưa có ghi chú
                  </div>
                  <div v-else class="text-sm whitespace-pre-line">
                    {{ detail.note }}
                  </div>
                </UPageCard>
                <UPageCard variant="soft" class="bg-white rounded-lg">
                  <BaseCardHeader>Thông tin bổ sung</BaseCardHeader>
                  <div class="text-sm">
                    <div class="space-y-6">
                      <!-- Branch -->
                      <div class="space-y-1">
                        <div class="font-medium text-gray-800">
                          Bán tại chi nhánh
                        </div>
                        <div class="text-gray-600">
                          {{ detail.meta?.branchName || 'Cửa hàng chính' }}
                        </div>
                      </div>

                      <!-- Staff in charge -->
                      <div class="space-y-1">
                        <div class="flex items-center justify-between">
                          <div class="font-medium text-gray-800">
                            Nhân viên phụ trách
                          </div>
                          <button type="button" class="text-gray-400 hover:text-gray-600" aria-label="Sửa nhân viên phụ trách">
                            <IconEdit class="w-4 h-4" />
                          </button>
                        </div>
                        <div class="text-gray-600">
                          {{ detail.meta?.staffInCharge || 'Phạm Văn Toàn' }}
                        </div>
                      </div>

                      <!-- Creator -->
                      <div class="space-y-1">
                        <div class="font-medium text-gray-800">
                          Nhân viên tạo đơn
                        </div>
                        <div class="text-gray-600">
                          {{ detail.meta?.creatorName || 'Phạm Văn Toàn' }}
                        </div>
                      </div>

                      <!-- Order date -->
                      <div class="space-y-1">
                        <div class="font-medium text-gray-800">
                          Ngày đặt hàng
                        </div>
                        <div class="text-gray-600">
                          {{ formatDateTime(detail.meta?.orderDate) }}
                        </div>
                      </div>

                      <!-- Scheduled date -->
                      <div class="space-y-1">
                        <div class="flex items-center justify-between">
                          <div class="font-medium text-gray-800">
                            Ngày hẹn giao
                          </div>
                          <button type="button" class="text-gray-400 hover:text-gray-600" aria-label="Sửa ngày hẹn giao">
                            <IconEdit class="w-4 h-4" />
                          </button>
                        </div>
                        <div class="text-gray-600">
                          {{ formatDateTime(detail.meta?.scheduledDate) || 'Chưa có ngày hẹn giao' }}
                        </div>
                      </div>

                      <!-- Tags -->
                      <div class="space-y-1">
                        <label class="block text-xs font-medium text-gray-600">Tag</label>
                        <input
                          type="text"
                          placeholder="Tìm kiếm hoặc thêm mới tag"
                          class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                        <div class="text-right mt-1">
                          <button type="button" class="text-primary-600 text-xs font-medium hover:underline">
                            Danh sách tag
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </UPageCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <ReceivePaymentModal
    v-model="showReceivePayment"
    :remaining-amount="remainingAmount"
    @submit="handleReceivePaymentSubmit"
  />
</template>
