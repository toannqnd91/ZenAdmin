<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ordersService } from '@/services/orders.service'
import type { OrderDetail, OrderHistoryEvent, OrderDetailRawResponse, OrderHistoryListResponse } from '@/services/orders.service'
import BaseCardHeader from '@/components/BaseCardHeader.vue'
import IconEdit from '@/components/icons/IconEdit.vue'
import IconInvoicePending from '@/components/icons/IconInvoicePending.vue'
import IconChevronDown from '@/components/icons/IconChevronDown.vue'
import IconReturn from '@/components/icons/IconReturn.vue'
import IconPrintOrder from '@/components/icons/IconPrintOrder.vue'

const route = useRoute()
const orderCodeParam = computed(() => route.params.code as string)
const loading = ref(false)
const detail = ref<OrderDetail | null>(null)
const history = ref<OrderHistoryEvent[] | null>(null)
const justCreated = computed(() => route.query.created === '1')
// Removed productTotalQuantity (replaced by monetary subtotal display)
const statusSteps = ['Đặt hàng', 'Đã xác nhận', 'Đã xử lý', 'Giao hàng', 'Hoàn thành']

// Map each status step to the first timestamp it appears in history (or createdOn for the first step)
const stepTimes = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  if (!detail.value) return map
  const events = (history.value || []).slice().sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime())
  for (const step of statusSteps) {
    // Created time for the very first step
    if (step === 'Đặt hàng' && detail.value.createdOn) map[step] = detail.value.createdOn
    if (map[step]) continue
    const simplifiedStep = step.toLowerCase().replace(/^đã\s+/, '').trim()
    for (const ev of events) {
      const candRawVal = (ev as any).meta?.newStatus || ev.message || ''
      const candRaw = typeof candRawVal === 'string' ? candRawVal.toLowerCase() : ''
      const simplifiedCand = candRaw.replace(/^đã\s+/, '').trim()
      if (simplifiedCand.includes(simplifiedStep) || simplifiedStep.includes(simplifiedCand)) {
        map[step] = ev.createdOn
        break
      }
    }
  }
  return map
})

function connectorClass(idx: number) {
  try {
    const current = statusSteps[idx]
    if (current && stepTimes.value[current]) return 'bg-emerald-100'
  } catch {}
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

// Map payment method backend codes to display labels
function formatPaymentMethod(code?: string | null) {
  if (!code) return 'Tiền mặt'
  switch (code) {
    case 'TienMat':
    case 'TIENMAT':
      return 'Tiền mặt'
    case 'ChuyenKhoan':
    case 'CHUYENKHOAN':
    case 'ChuyenKhoanNganHang':
      return 'Chuyển khoản'
    default:
      return code
  }
}

function startReturn() { console.debug('startReturn clicked', detail.value?.orderCode) }
function printOrder() { window.print() }
function prevOrder() { console.debug('prevOrder') }
function nextOrder() { console.debug('nextOrder') }

// Helpers for discount display (using 'any' because original OrderDetail type may not include extended fields)
function getOriginalPrice(item: any) {
  return typeof item.originalUnitPrice === 'number' ? item.originalUnitPrice : (typeof item.unitPrice === 'number' ? item.unitPrice : 0)
}
function getDiscountAmount(item: any) {
  const orig = getOriginalPrice(item)
  const now = typeof item.unitPrice === 'number' ? item.unitPrice : orig
  return Math.max(0, orig - now)
}
function getDiscountPercent(item: any) {
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
      interface RawOrderItem { id: number | string; productId: number | string; productName: string; productImage?: string | null; productPrice: number; quantity: number; total?: number; rowTotal?: number }
      interface RawOrder { id: number | string; createdOn: string; orderStatusString?: string; orderItems?: RawOrderItem[]; subtotal?: number; discountAmount?: number; shippingAmount?: number; orderTotal?: number; paymentMethod?: string | null; shippingMethod?: string | null; orderNote?: string | null }
      interface RawCustomer { customerId: string | number; name: string; phone?: string | null; email?: string | null }
      interface RawAddress { addressLine1?: string; addressLine2?: string; city?: string; districtName?: string | null; stateOrProvinceName?: string | null; countryId?: string | null; phone?: string | null; zipCode?: string | null }
      interface RawPayload { order: RawOrder; customerInfo?: { customer?: RawCustomer; address?: RawAddress } }
      const payload = orderRes.data as unknown as RawPayload
      const o = payload.order
      const c = payload.customerInfo?.customer
      const addr = payload.customerInfo?.address
      if (o) {
        let items: Array<{
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
        }> = []
        if (Array.isArray(o.orderItems)) {
          items = o.orderItems.map((it) => {
            // API meaning clarification:
            // productPrice: base/niêm yết
            // rowTotal (or total): tổng tiền dòng sau giảm => đơn giá thực tế = rowTotal / quantity
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
        const mappedCustomer = c ? { id: c.customerId, name: c.name, phone: c.phone || null, email: c.email || null } : null
        const mappedAddress = addr ? { contactName: c?.name || null, phoneNumber: addr.phone || null, email: c?.email || null, addressLine1: addr.addressLine1 || null, addressLine2: addr.addressLine2 || null, country: addr.countryId || null, stateOrProvince: addr.stateOrProvinceName || null, district: addr.districtName || null, city: addr.city || null, zipCode: addr.zipCode || null } : null
        detail.value = { id: o.id, orderCode: rawCode || `#${o.id}`, status: o.orderStatusString || '', processStatus: o.orderStatusString || '', paymentStatus: o.orderStatusString || null, createdOn: o.createdOn, items, customer: mappedCustomer, address: mappedAddress, payment: { totalQuantity: totalQty, subTotal: o.subtotal || 0, discountAmount: o.discountAmount || 0, shippingFeeAmount: o.shippingAmount || 0, orderTotal: o.orderTotal || 0, paidAmount: o.orderTotal || 0, paymentMethod: o.paymentMethod || null, paymentStatus: o.orderStatusString || null }, note: o.orderNote || null, meta: { sourceName: null, branchName: null, staffInCharge: null, creatorName: null, orderDate: o.createdOn, scheduledDate: null, shippingMethod: o.shippingMethod || null, deliveryOption: null, expectedDeliveryDate: null, tags: null }, history: [] }
      }
    }
    if (historyRes && 'success' in historyRes) {
      const hr = historyRes as OrderHistoryListResponse
      history.value = hr.success && hr.data ? hr.data.items.map(h => ({ id: h.id, createdOn: h.createdOn, actorName: null, message: h.note || h.newStatusText || 'Cập nhật trạng thái', meta: { oldStatus: h.oldStatusText, newStatus: h.newStatusText } })) : []
    }
  } finally { loading.value = false }
}
onMounted(fetchData)
</script>

<template>
  <UDashboardPanel :id="`order-${orderCodeParam}`">
    <template #header>
      <UDashboardNavbar title="Chi tiết đơn hàng">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div v-if="justCreated && detail" class="mb-4 border border-green-200 bg-green-50 text-green-700 rounded px-4 py-3 text-sm flex items-start justify-between gap-4">
        <div><p>Đơn hàng <strong>{{ detail.orderCode }}</strong> đã được tạo thành công</p></div>
        <div class="flex items-center gap-2">
          <UButton color="primary" size="xs" variant="solid" :to="'/orders/create'">Tạo đơn hàng khác</UButton>
          <UButton color="neutral" size="xs" variant="ghost" @click="() => { (route.query as any).created = undefined }">Đóng</UButton>
        </div>
      </div>
      <div v-if="loading" class="p-6 text-center text-sm text-gray-500">Đang tải...</div>
      <div v-else-if="!detail" class="p-6 text-center text-sm text-gray-500">Không tìm thấy đơn hàng.</div>
      <div v-else>
        <div class="w-full max-w-screen-xl mx-auto px-6">
          <div class="space-y-6">
            <!-- Full-width toolbar (single line, horizontally scrollable if narrow) -->
            <div class="flex items-center justify-between gap-6 overflow-x-auto whitespace-nowrap pr-2">
              <div class="flex items-center gap-3 flex-shrink-0">
                <UButton :to="'/orders'" color="neutral" variant="soft" icon="i-heroicons-arrow-left" size="sm" />
                <div class="text-xl font-semibold text-gray-900">{{ detail.orderCode }}</div>
                <div class="flex items-center gap-2">
                  <span v-for="pill in ['Đã thanh toán', 'Đã xử lý', 'Lưu trữ']" :key="pill" class="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-600">
                    <span class="w-2 h-2 rounded-full bg-gray-400" />
                    {{ pill }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-4 flex-shrink-0">
                <UButton color="neutral" variant="ghost" size="sm" class="font-medium inline-flex items-center gap-2" @click="startReturn">
                  <IconReturn class="w-4 h-4" />
                  Trả hàng
                </UButton>
                <UButton color="neutral" variant="ghost" size="sm" class="font-medium inline-flex items-center gap-2" @click="printOrder">
                  <IconPrintOrder class="w-4 h-4" />
                  In đơn hàng
                </UButton>
                <UDropdown :items="[[{ label: 'Hủy đơn', click: () => console.debug('cancel order') }],[{ label: 'Sao chép', click: () => console.debug('copy order') }]]" :popper="{ placement: 'bottom-end' }">
                  <UButton color="neutral" variant="ghost" size="sm" trailing-icon="i-heroicons-chevron-down" class="font-medium">Thao tác khác</UButton>
                </UDropdown>
                <div class="flex border border-gray-200 rounded-md overflow-hidden">
                  <UButton size="sm" color="neutral" variant="ghost" icon="i-heroicons-chevron-left" class="rounded-none" @click="prevOrder" />
                  <div class="w-px bg-gray-200" />
                  <UButton size="sm" color="neutral" variant="ghost" icon="i-heroicons-chevron-right" class="rounded-none" @click="nextOrder" />
                </div>
              </div>
            </div>
            <!-- Full-width status card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader class="sr-only">Trạng thái</BaseCardHeader>
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
                        <th class="px-6 py-2 text-left font-semibold">Sản phẩm</th>
                        <th class="px-6 py-2 text-left font-semibold">Số lượng</th>
                        <th class="px-6 py-2 text-left font-semibold">Đơn giá</th>
                        <th class="px-6 py-2 text-left font-semibold text-right">Thành tiền</th>
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
                              <div class="font-medium text-gray-800">{{ item.productName }}</div>
                              <!-- Placeholder for potential secondary name / normalizedName if available in future -->
                              <div class="text-xs text-gray-500">SKU: {{ item.productId }}</div>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-2 align-top">{{ item.quantity }}</td>
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
              <!-- Payment -->
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>
                  <span class="inline-flex items-center gap-2">
                    <span class="inline-block w-5 h-5" aria-hidden="true">
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
                    <span>Đã thanh toán</span>
                  </span>
                </BaseCardHeader>
                <div class="pb-3 text-sm space-y-2">
                  <div class="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4">
                    <span class="text-gray-600">Tổng tiền hàng</span>
                    <span v-if="detail.payment?.totalQuantity != null" class="text-gray-500 justify-self-center">{{ detail.payment.totalQuantity }} sản phẩm</span>
                    <span v-else class="text-gray-500 justify-self-center"></span>
                    <span class="font-medium justify-self-end">{{ formatCurrency(detail.payment?.subTotal || detail.items.reduce((a, i) => a + (getOriginalPrice(i) * i.quantity), 0)) }}</span>
                  </div>
                  <div
                    v-if="detail.payment?.discountAmount && detail.payment.discountAmount > 0"
                    class="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4"
                  >
                    <span class="text-gray-600">Khuyến mãi</span>
                    <span></span>
                    <span class="text-red-600 justify-self-end">-{{ formatCurrency(detail.payment.discountAmount) }}</span>
                  </div>
                  <div class="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4">
                    <span class="text-gray-600">Thành tiền</span>
                    <span></span>
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
                        <p class="font-medium text-gray-900 leading-6">Chưa yêu cầu hóa đơn điện tử</p>
                        <p class="mt-1 text-sm text-gray-600">Đơn hàng chưa có yêu cầu hóa đơn điện tử. Vui lòng thêm thông tin để tạo hóa đơn điện tử</p>
                      </div>
                    </div>
                    <div class="pt-1">
                      <button type="button" class="text-primary-600 text-sm font-medium whitespace-nowrap hover:underline">Yêu cầu hóa đơn</button>
                    </div>
                  </div>
              </UPageCard>
              <!-- History -->
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Lịch sử đơn hàng</BaseCardHeader>
                <div class="text-sm">
                  <div v-if="!history || !history.length" class="text-gray-500">Không có lịch sử.</div>
                  <ul v-else class="space-y-3">
                    <li v-for="h in history" :key="h.id || h.createdOn" class="flex gap-3">
                      <div class="flex flex-col items-center">
                        <div class="w-2 h-2 rounded-full bg-primary-500 mt-1" />
                        <div class="flex-1 w-px bg-gray-200" />
                      </div>
                      <div>
                        <div class="text-xs text-gray-500">{{ formatDateTime(h.createdOn) }}</div>
                        <div class="text-gray-800">{{ h.message }}</div>
                        <div v-if="h.actorName" class="text-xs text-gray-400">{{ h.actorName }}</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </UPageCard>
            </div>
            <!-- Right column -->
            <div class="w-full lg:w-80 space-y-6 flex-shrink-0">
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Nguồn đơn</BaseCardHeader>
                <div class="text-sm">{{ detail.meta?.sourceName || 'POS' }}</div>
              </UPageCard>
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Khách hàng</BaseCardHeader>
                <div class="text-sm">
                  <div class="space-y-6">
                    <!-- Top summary -->
                    <div class="space-y-2">
                      <div>
                        <div class="font-medium text-primary-600 cursor-pointer hover:underline">{{ detail.customer?.name || '---' }}</div>
                      </div>
                      <div class="flex justify-between items-start text-xs text-gray-600">
                        <div>
                          <span class="text-gray-600">Tổng chi tiêu</span>
                          <span v-if="detail.payment?.totalQuantity != null" class="text-gray-400"> ({{ detail.payment?.totalQuantity }} đơn hàng)</span>
                        </div>
                        <div class="text-gray-900 font-medium">{{ formatCurrency(detail.customer?.totalSpent || detail.payment?.subTotal || 0) }}</div>
                      </div>
                      <div class="flex justify-between items-center text-xs text-gray-600" v-if="detail.customer?.lastOrderCode">
                        <span>Đơn gần nhất</span>
                        <NuxtLink :to="`/orders/${detail.customer?.lastOrderCode}`" class="text-primary-600 font-medium hover:underline">#{{ detail.customer?.lastOrderCode }}</NuxtLink>
                      </div>
                    </div>
                    
                    <!-- Customer group -->
                    <div class="space-y-1">
                      <div class="text-xs font-medium text-gray-700">Nhóm khách hàng</div>
                      <div class="text-xs text-gray-400">Không áp dụng nhóm khách hàng</div>
                    </div>
                    
                    <!-- Contact info -->
                    <div class="space-y-1">
                      <div class="flex items-center justify-between">
                        <div class="text-xs font-medium text-gray-700">Thông tin liên hệ</div>
                        <UButton
                          color="neutral"
                          variant="ghost"
                          size="2xs"
                          aria-label="Sửa liên hệ"
                        >
                          <IconEdit />
                        </UButton>
                      </div>
                      <div class="text-xs text-gray-400">{{ detail.customer?.email || 'Không có email' }}</div>
                      <div class="text-xs text-gray-900" v-if="detail.customer?.phone">{{ detail.customer?.phone }}</div>
                    </div>
                    
                    <!-- Shipping address -->
                    <div class="space-y-1">
                      <div class="flex items-center justify-between">
                        <div class="text-xs font-medium text-gray-700">Địa chỉ giao hàng</div>
                        <UButton
                          color="neutral"
                          variant="ghost"
                          size="2xs"
                          aria-label="Sửa địa chỉ giao hàng"
                        >
                          <IconEdit />
                        </UButton>
                      </div>
                      <div class="text-xs text-gray-900 whitespace-pre-line">
                        <template v-if="detail.address">
                          <div>{{ detail.address.contactName || detail.customer?.name }}</div>
                          <div v-if="detail.address.phoneNumber">{{ detail.address.phoneNumber }}</div>
                          <div>
                            {{ [detail.address.addressLine1, detail.address.city, detail.address.country].filter(Boolean).join(', ') || 'Vietnam' }}
                          </div>
                        </template>
                        <template v-else>
                          Chưa có địa chỉ giao hàng
                        </template>
                      </div>
                    </div>
                    
                    <!-- Show more -->
                    <div class="flex justify-center">
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
                <div v-if="!detail.note" class="text-sm text-gray-500">Chưa có ghi chú</div>
                <div v-else class="text-sm whitespace-pre-line">{{ detail.note }}</div>
              </UPageCard>
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Thông tin bổ sung</BaseCardHeader>
                <div class="text-sm">
                  <div class="space-y-6">
                    <!-- Branch -->
                    <div class="space-y-1">
                      <div class="font-medium text-gray-800">Bán tại chi nhánh</div>
                      <div class="text-gray-600">{{ detail.meta?.branchName || 'Cửa hàng chính' }}</div>
                    </div>
                    
                    <!-- Staff in charge -->
                    <div class="space-y-1">
                      <div class="flex items-center justify-between">
                        <div class="font-medium text-gray-800">Nhân viên phụ trách</div>
                        <button type="button" class="text-gray-400 hover:text-gray-600" aria-label="Sửa nhân viên phụ trách">
                          <IconEdit class="w-4 h-4" />
                        </button>
                      </div>
                      <div class="text-gray-600">{{ detail.meta?.staffInCharge || 'Phạm Văn Toàn' }}</div>
                    </div>
                    
                    <!-- Creator -->
                    <div class="space-y-1">
                      <div class="font-medium text-gray-800">Nhân viên tạo đơn</div>
                      <div class="text-gray-600">{{ detail.meta?.creatorName || 'Phạm Văn Toàn' }}</div>
                    </div>
                    
                    <!-- Order date -->
                    <div class="space-y-1">
                      <div class="font-medium text-gray-800">Ngày đặt hàng</div>
                      <div class="text-gray-600">{{ formatDateTime(detail.meta?.orderDate) }}</div>
                    </div>
                    
                    <!-- Scheduled date -->
                    <div class="space-y-1">
                      <div class="flex items-center justify-between">
                        <div class="font-medium text-gray-800">Ngày hẹn giao</div>
                        <button type="button" class="text-gray-400 hover:text-gray-600" aria-label="Sửa ngày hẹn giao">
                          <IconEdit class="w-4 h-4" />
                        </button>
                      </div>
                      <div class="text-gray-600">{{ formatDateTime(detail.meta?.scheduledDate) || 'Chưa có ngày hẹn giao' }}</div>
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
                        <button type="button" class="text-primary-600 text-xs font-medium hover:underline">Danh sách tag</button>
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
</template>