<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ordersService } from '@/services/orders.service'
import type { OrderDetail, OrderHistoryEvent, OrderDetailRawResponse, OrderHistoryListResponse } from '@/services/orders.service'
import BaseCardHeader from '@/components/BaseCardHeader.vue'

const route = useRoute()
const orderCodeParam = computed(() => route.params.code as string)
const loading = ref(false)
const detail = ref<OrderDetail | null>(null)
const history = ref<OrderHistoryEvent[] | null>(null)
const justCreated = computed(() => route.query.created === '1')
const productTotalQuantity = computed(() => detail.value?.items.reduce((a, i) => a + i.quantity, 0) || 0)
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

function startReturn() { console.debug('startReturn clicked', detail.value?.orderCode) }
function printOrder() { window.print() }
function prevOrder() { console.debug('prevOrder') }
function nextOrder() { console.debug('nextOrder') }

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
        let items = Array.isArray(o.orderItems) ? o.orderItems.map(it => ({
          id: it.id,
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          unitPrice: it.productPrice,
          lineTotal: (it.total ?? it.rowTotal ?? (it.productPrice * it.quantity)) || 0,
          thumbnailImageUrl: it.productImage || null
        })) : []
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
                <UButton color="neutral" variant="ghost" size="sm" icon="i-heroicons-cube" class="font-medium" @click="startReturn">Trả hàng</UButton>
                <UButton color="neutral" variant="ghost" size="sm" icon="i-heroicons-printer" class="font-medium" @click="printOrder">In đơn hàng</UButton>
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
                <!-- Shipped items -->
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Đã xử lý giao hàng</BaseCardHeader>
                <div class="-mx-6 mt-4 overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="text-left text-gray-500">
                        <th class="w-12" />
                        <th class="py-2 font-medium">Sản phẩm</th>
                        <th class="py-2 font-medium w-20">Số lượng</th>
                        <th class="py-2 font-medium w-28">Đơn giá</th>
                        <th class="py-2 font-medium w-28">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in detail.items" :key="item.id" class="border-t border-gray-100">
                        <td class="py-2 align-top"><img :src="item.thumbnailImageUrl || '/no-image.svg'" class="w-10 h-10 object-cover rounded" /></td>
                        <td class="py-2 align-top">
                          <div class="font-medium text-gray-800">{{ item.productName }}</div>
                          <button class="text-primary-600 text-xs mt-1" type="button">Thêm ghi chú</button>
                        </td>
                        <td class="py-2 align-top">{{ item.quantity }}</td>
                        <td class="py-2 align-top">{{ formatCurrency(item.unitPrice) }}</td>
                        <td class="py-2 align-top">{{ formatCurrency(item.lineTotal) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </UPageCard>
              <!-- Payment -->
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Đã thanh toán</BaseCardHeader>
                <div class="mt-4 text-sm space-y-2">
                  <div class="flex justify-between"><span>Tổng tiền hàng</span><span>{{ productTotalQuantity }} sản phẩm</span></div>
                  <div class="flex justify-between"><span>Thành tiền</span><span>{{ formatCurrency(detail.payment?.orderTotal) }}</span></div>
                  <div class="flex justify-between font-medium"><span>Khách đã trả</span><span>{{ formatCurrency(detail.payment?.paidAmount) }}</span></div>
                </div>
              </UPageCard>
              <!-- E-invoice -->
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Hóa đơn điện tử</BaseCardHeader>
                <div class="mt-4 text-sm text-amber-600">Chưa yêu cầu hóa đơn điện tử</div>
              </UPageCard>
              <!-- History -->
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Lịch sử đơn hàng</BaseCardHeader>
                <div class="mt-4 text-sm">
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
                <div class="mt-4 text-sm">{{ detail.meta?.sourceName || 'POS' }}</div>
              </UPageCard>
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Khách hàng</BaseCardHeader>
                <div class="mt-4 text-sm space-y-2">
                  <div>
                    <div class="font-medium text-primary-600 cursor-pointer">{{ detail.customer?.name }}</div>
                    <div v-if="detail.customer?.totalSpent != null" class="text-xs text-gray-500">Tổng chi tiêu: {{ formatCurrency(detail.customer?.totalSpent) }}</div>
                    <div v-if="detail.customer?.lastOrderCode" class="text-xs text-gray-500">Đơn gần nhất: {{ detail.customer?.lastOrderCode }}</div>
                  </div>
                  <div v-if="detail.customer?.phone" class="text-xs">{{ detail.customer?.phone }}</div>
                </div>
              </UPageCard>
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Ghi chú</BaseCardHeader>
                <div v-if="!detail.note" class="mt-4 text-sm text-gray-500">Chưa có ghi chú</div>
                <div v-else class="mt-4 text-sm whitespace-pre-line">{{ detail.note }}</div>
              </UPageCard>
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Thông tin bổ sung</BaseCardHeader>
                <div class="mt-4 text-xs space-y-2 text-gray-600">
                  <div><span class="font-medium text-gray-700">Bán tại chi nhánh:</span> {{ detail.meta?.branchName || 'Cửa hàng chính' }}</div>
                  <div><span class="font-medium text-gray-700">Nhân viên phụ trách:</span> {{ detail.meta?.staffInCharge || '---' }}</div>
                  <div><span class="font-medium text-gray-700">Nhân viên tạo đơn:</span> {{ detail.meta?.creatorName || '---' }}</div>
                  <div><span class="font-medium text-gray-700">Ngày đặt hàng:</span> {{ formatDateTime(detail.meta?.orderDate) }}</div>
                  <div><span class="font-medium text-gray-700">Ngày hẹn giao:</span> {{ formatDateTime(detail.meta?.scheduledDate) || 'Chưa có' }}</div>
                  <div><span class="font-medium text-gray-700">Tag:</span>
                    <div class="mt-1">
                      <UInput disabled size="xs" placeholder="Tìm kiếm hoặc thêm mới tag" class="w-full text-xs" />
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
