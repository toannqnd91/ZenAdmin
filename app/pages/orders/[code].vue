<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ordersService } from '@/services/orders.service'
import type { OrderDetail, OrderHistoryEvent, OrderDetailRawResponse, OrderHistoryListResponse } from '@/services/orders.service'
import BaseCardHeader from '@/components/BaseCardHeader.vue'

const route = useRoute()
// Use order code from param
const orderCodeParam = computed(() => route.params.code as string)

const loading = ref(false)
const detail = ref<OrderDetail | null>(null)
const history = ref<OrderHistoryEvent[] | null>(null)
const justCreated = computed(() => route.query.created === '1')

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

const productTotalQuantity = computed(() => detail.value?.items.reduce((a, i) => a + i.quantity, 0) || 0)

async function fetchData() {
  try {
    loading.value = true
    const rawCode = orderCodeParam.value || ''
    // Remove leading # if present; backend accepts both numeric id or order code like HD000081
    const codeForApi = rawCode.replace(/^#/, '')
    // Fetch raw order + history (history may still be separate endpoint)
    const [orderRes, historyRes] = await Promise.all([
      ordersService.getOrderById(codeForApi),
      ordersService.getOrderHistory(codeForApi)
    ])
    if (orderRes && 'success' in orderRes && (orderRes as OrderDetailRawResponse).success && orderRes.data) {
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
        shippingAmount?: number
        orderTotal?: number
        paymentMethod?: string | null
        shippingMethod?: string | null
        orderNote?: string | null
      }
      interface RawCustomer {
        customerId: string | number
        name: string
        phone?: string | null
        email?: string | null
      }
      interface RawAddress {
        addressLine1?: string
        addressLine2?: string
        city?: string
        districtName?: string | null
        stateOrProvinceName?: string | null
        countryId?: string | null
        phone?: string | null
        zipCode?: string | null
      }
      interface RawPayload {
        order: RawOrder
  customerInfo?: { customer?: RawCustomer; address?: RawAddress }
      }
      const payload = orderRes.data as unknown as RawPayload
      const o = payload.order
      const c = payload.customerInfo?.customer
      const addr = payload.customerInfo?.address
      if (o) {
        interface MappedItem {
          id: number | string
          productId: number | string
          productName: string
          quantity: number
          unitPrice: number
          lineTotal: number
          thumbnailImageUrl?: string | null
        }
        let items: MappedItem[] = []
        if (Array.isArray(o.orderItems)) {
          items = o.orderItems.map((it): MappedItem => ({
            id: it.id,
            productId: it.productId,
            productName: it.productName,
            quantity: it.quantity,
            unitPrice: it.productPrice,
            lineTotal: (it.total ?? it.rowTotal ?? (it.productPrice * it.quantity)) || 0,
            thumbnailImageUrl: it.productImage || null
          }))
        }
        const totalQty = items.reduce((a, i) => a + (i.quantity || 0), 0)
        const mappedCustomer = c
          ? {
              id: c.customerId,
              name: c.name,
              phone: c.phone || null,
              email: c.email || null
            }
          : null
        const mappedAddress = addr
          ? {
              contactName: c?.name || null,
              phoneNumber: addr.phone || null,
              email: c?.email || null,
              addressLine1: addr.addressLine1 || null,
              addressLine2: addr.addressLine2 || null,
              country: addr.countryId || null,
              stateOrProvince: addr.stateOrProvinceName || null,
              district: addr.districtName || null,
              city: addr.city || null,
              zipCode: addr.zipCode || null
            }
          : null
        detail.value = {
          id: o.id,
          orderCode: rawCode || `#${o.id}`,
          status: o.orderStatusString || '',
          processStatus: o.orderStatusString || '',
          paymentStatus: o.orderStatusString || null,
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
            paidAmount: o.orderTotal || 0, // backend chưa trả paidAmount cụ thể
            paymentMethod: o.paymentMethod || null,
            paymentStatus: o.orderStatusString || null
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
      if (hr.success && hr.data) {
  history.value = hr.data.items.map(h => ({
          id: h.id,
          createdOn: h.createdOn,
          actorName: null,
          message: h.note || h.newStatusText || 'Cập nhật trạng thái',
          meta: {
            oldStatus: h.oldStatusText,
            newStatus: h.newStatusText
          }
        }))
      } else {
        history.value = []
      }
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <UDashboardPanel :id="`order-${orderCodeParam}`">
    <template #header>
      <UDashboardNavbar :title="detail?.orderCode || orderCodeParam || 'Đơn hàng'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <UButton
            color="neutral"
            variant="soft"
            size="sm"
            :to="'/orders'"
          >
            Quay lại danh sách
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        v-if="justCreated && detail"
        class="mb-4 border border-green-200 bg-green-50 text-green-700 rounded px-4 py-3 text-sm flex items-start justify-between gap-4"
      >
        <div>
          <p>
            Đơn hàng <strong>{{ detail.orderCode }}</strong> đã được tạo thành công
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            color="primary"
            size="xs"
            variant="solid"
            :to="'/orders/create'"
          >
            Tạo đơn hàng khác
          </UButton>
          <UButton
            color="neutral"
            size="xs"
            variant="ghost"
            @click="() => { (route.query as any).created = undefined }"
          >
            Đóng
          </UButton>
        </div>
      </div>
      <div v-if="loading" class="p-6 text-center text-sm text-gray-500">
        Đang tải...
      </div>
      <div v-else-if="!detail" class="p-6 text-center text-sm text-gray-500">
        Không tìm thấy đơn hàng.
      </div>
      <div v-else class="space-y-6">
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div class="xl:col-span-9 space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Trạng thái
              </BaseCardHeader>
              <div class="mt-4 flex items-center flex-wrap gap-4 text-sm">
                <div
                  v-for="(s, idx) in ['Đặt hàng', 'Đã xác nhận', 'Đã xử lý', 'Giao hàng', 'Hoàn thành']"
                  :key="s"
                  class="flex items-center"
                >
                  <div :class="['w-3 h-3 rounded-full', idx <= 4 ? 'bg-green-500' : 'bg-gray-300']" />
                  <span class="ml-2" :class="idx <= 4 ? 'text-green-600' : 'text-gray-400'">{{ s }}</span>
                  <div v-if="idx < 4" class="mx-4 h-px w-10 bg-gray-300" />
                </div>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Đã xử lý giao hàng
              </BaseCardHeader>
              <div class="-mx-6 mt-4 overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-gray-500">
                      <th class="w-12" />
                      <th class="py-2 font-medium">
                        Sản phẩm
                      </th>
                      <th class="py-2 font-medium w-20">
                        Số lượng
                      </th>
                      <th class="py-2 font-medium w-28">
                        Đơn giá
                      </th>
                      <th class="py-2 font-medium w-28">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in detail.items"
                      :key="item.id"
                      class="border-t border-gray-100"
                    >
                      <td class="py-2 align-top">
                        <img
                          :src="item.thumbnailImageUrl || '/no-image.svg'"
                          class="w-10 h-10 object-cover rounded"
                        >
                      </td>
                      <td class="py-2 align-top">
                        <div class="font-medium text-gray-800">
                          {{ item.productName }}
                        </div>
                        <button
                          class="text-primary-600 text-xs mt-1"
                          type="button"
                        >
                          Thêm ghi chú
                        </button>
                      </td>
                      <td class="py-2 align-top">
                        {{ item.quantity }}
                      </td>
                      <td class="py-2 align-top">
                        {{ formatCurrency(item.unitPrice) }}
                      </td>
                      <td class="py-2 align-top">
                        {{ formatCurrency(item.lineTotal) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Đã thanh toán
              </BaseCardHeader>
              <div class="mt-4 text-sm space-y-2">
                <div class="flex justify-between">
                  <span>Tổng tiền hàng</span>
                  <span>{{ productTotalQuantity }} sản phẩm</span>
                </div>
                <div class="flex justify-between">
                  <span>Thành tiền</span>
                  <span>{{ formatCurrency(detail.payment?.orderTotal) }}</span>
                </div>
                <div class="flex justify-between font-medium">
                  <span>Khách đã trả</span>
                  <span>{{ formatCurrency(detail.payment?.paidAmount) }}</span>
                </div>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Hóa đơn điện tử
              </BaseCardHeader>
              <div class="mt-4 text-sm text-amber-600">
                Chưa yêu cầu hóa đơn điện tử
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Lịch sử đơn hàng
              </BaseCardHeader>
              <div class="mt-4 text-sm">
                <div v-if="!history || !history.length" class="text-gray-500">
                  Không có lịch sử.
                </div>
                <ul v-else class="space-y-3">
                  <li
                    v-for="h in history"
                    :key="h.id || h.createdOn"
                    class="flex gap-3"
                  >
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
                      <div
                        v-if="h.actorName"
                        class="text-xs text-gray-400"
                      >
                        {{ h.actorName }}
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </UPageCard>
          </div>

          <div class="xl:col-span-3 space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Nguồn đơn
              </BaseCardHeader>
              <div class="mt-4 text-sm">
                {{ detail.meta?.sourceName || 'POS' }}
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Khách hàng
              </BaseCardHeader>
              <div class="mt-4 text-sm space-y-2">
                <div>
                  <div class="font-medium text-primary-600 cursor-pointer">
                    {{ detail.customer?.name }}
                  </div>
                  <div
                    v-if="detail.customer?.totalSpent != null"
                    class="text-xs text-gray-500"
                  >
                    Tổng chi tiêu: {{ formatCurrency(detail.customer?.totalSpent) }}
                  </div>
                  <div
                    v-if="detail.customer?.lastOrderCode"
                    class="text-xs text-gray-500"
                  >
                    Đơn gần nhất: {{ detail.customer?.lastOrderCode }}
                  </div>
                </div>
                <div
                  v-if="detail.customer?.phone"
                  class="text-xs"
                >
                  {{ detail.customer?.phone }}
                </div>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Ghi chú
              </BaseCardHeader>
              <div
                v-if="!detail.note"
                class="mt-4 text-sm text-gray-500"
              >
                Chưa có ghi chú
              </div>
              <div
                v-else
                class="mt-4 text-sm whitespace-pre-line"
              >
                {{ detail.note }}
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Thông tin bổ sung
              </BaseCardHeader>
              <div class="mt-4 text-xs space-y-2 text-gray-600">
                <div><span class="font-medium text-gray-700">Bán tại chi nhánh:</span> {{ detail.meta?.branchName || 'Cửa hàng chính' }}</div>
                <div><span class="font-medium text-gray-700">Nhân viên phụ trách:</span> {{ detail.meta?.staffInCharge || '---' }}</div>
                <div><span class="font-medium text-gray-700">Nhân viên tạo đơn:</span> {{ detail.meta?.creatorName || '---' }}</div>
                <div><span class="font-medium text-gray-700">Ngày đặt hàng:</span> {{ formatDateTime(detail.meta?.orderDate) }}</div>
                <div><span class="font-medium text-gray-700">Ngày hẹn giao:</span> {{ formatDateTime(detail.meta?.scheduledDate) || 'Chưa có' }}</div>
                <div>
                  <span class="font-medium text-gray-700">Tag:</span>
                  <div class="mt-1">
                    <UInput
                      disabled
                      size="xs"
                      placeholder="Tìm kiếm hoặc thêm mới tag"
                      class="w-full text-xs"
                    />
                  </div>
                </div>
              </div>
            </UPageCard>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
