<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseCardHeader from '@/components/BaseCardHeader.vue'
import TableEmptyState from '@/components/base/TableEmptyState.vue'
import { salesReturnsService, returnsService } from '@/services'
import { useGlobalWarehouse } from '@/composables/useWarehouse'

const route = useRoute()
const router = useRouter()
const { selectedWarehouse } = useGlobalWarehouse()

const code = computed(() => String(route.params.code || ''))

// Detail DTO (flexible with many optionals to be safe against backend shape changes)
interface SalesReturnDetailItem {
  id?: number | string
  orderItemId?: number | string
  productId?: number | string
  productName?: string
  sku?: string | null
  reason?: string | null
  note?: string | null
  quantity?: number
  approvedQty?: number
  unitPrice?: number
  originalUnitPrice?: number
  lineTotal?: number
  adjustmentText?: string | null
}

interface SalesReturnDetailDTO {
  id?: number | string
  returnNumber?: string
  code?: string
  orderId?: number | string | null
  orderCode?: string | null
  status?: string
  statusReceive?: string | null
  statusRefund?: string | null
  createdOn?: string
  warehouseName?: string | null
  customerName?: string | null
  staffName?: string | null
  canceledOn?: string | null
  note?: string | null
  items?: SalesReturnDetailItem[]
  totals?: {
    subtotal?: number
    discount?: number
    tax?: number
    totalRefund?: number
    totalItems?: number
  }
}

const detail = ref<SalesReturnDetailDTO | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

function goBack() {
  router.push('/sales-returns')
}

function formatMoney(n?: number | null) {
  const v = Number(n || 0)
  const sign = v < 0 ? '-' : ''
  const abs = Math.abs(v)
  const s = String(Math.round(abs)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${sign}${s}đ`
}

function formatDate(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy} ${hh}:${mi}`
}

const titleCode = computed(() => detail.value?.returnNumber || detail.value?.code || `#${code.value}`)

const statusReceiveLabel = computed(() => {
  const s = String(detail.value?.statusReceive || detail.value?.status || '').toLowerCase()
  if (!s) return 'Chưa nhận hàng'
  if (s.includes('da nhan') || s.includes('đã nhận') || s.includes('received')) return 'Đã nhận hàng'
  return 'Chưa nhận hàng'
})

const statusRefundLabel = computed(() => {
  const s = String(detail.value?.statusRefund || detail.value?.status || '').toLowerCase()
  if (!s) return 'Chưa hoàn trả'
  if (s.includes('da hoan') || s.includes('đã hoàn') || s.includes('refunded')) return 'Đã hoàn trả'
  return 'Chưa hoàn trả'
})

const totalItemsCount = computed(() => {
  const arr = detail.value?.items || []
  return arr.reduce((s, it) => s + Number(it.approvedQty ?? it.quantity ?? 0), 0)
})

const isProcessed = computed(() => String(detail.value?.status || '').toLowerCase() === 'processed')

// API envelope for single sales return (based on provided sample JSON)
interface SalesReturnDetailApiEnvelope {
  code: string
  success: boolean
  message: string
  data: null | {
    id: number | string
    orderId: number | string | null
    orderCode: string | null
    returnNumber: string
    customerId: number | string | null
    customerName: string | null
    warehouseId: number | string | null
    warehouseName: string | null
    status: string | null
    subtotal: number
    taxTotal: number
    discountReturn: number
    totalRefund: number
    total: number
    refundAmount: number
    note: string | null
    items: Array<{
      id: number | string
      productId: number | string
      productName: string
      quantity: number
      unitPrice: number
      lineTotal: number
      reason: string | null
      restock: boolean
      originalQuantity: number
      shippedQuantity: number
      returnedQuantity: number
      maxReturnQty: number
      lineTax: number
      costPrice: number
    }> | null
  }
}

async function loadDetail() {
  loading.value = true
  error.value = null
  try {
    const res = await salesReturnsService.getByCode(code.value) as unknown as SalesReturnDetailApiEnvelope
    if (!res?.success) throw new Error(res?.message || 'Lỗi tải dữ liệu')
    const data = res.data
    if (!data) throw new Error('Không có dữ liệu đơn trả hàng')
    const itemsArr = Array.isArray(data.items) ? data.items : []
    detail.value = {
      id: data.id,
      returnNumber: data.returnNumber,
      code: data.returnNumber,
      orderId: data.orderId,
      orderCode: data.orderCode,
      status: data.status || undefined,
      createdOn: undefined, // backend sample lacks createdOn timestamp
      warehouseName: data.warehouseName || undefined,
      customerName: data.customerName && String(data.customerName).trim() !== '' ? data.customerName : 'Khách lẻ',
      staffName: undefined,
      canceledOn: undefined,
      note: data.note || undefined,
      items: itemsArr.map(it => ({
        id: it.id,
        productId: it.productId,
        productName: it.productName,
        quantity: Number(it.quantity || 0),
        approvedQty: Number(it.quantity || 0),
        unitPrice: Number(it.unitPrice || 0),
        originalUnitPrice: undefined, // not present in sample, keep placeholder
        lineTotal: Number(it.lineTotal || (Number(it.unitPrice || 0) * Number(it.quantity || 0))),
        reason: it.reason || null
      })),
      totals: {
        subtotal: Number(data.subtotal || 0),
        discount: Number(data.discountReturn || 0),
        tax: Number(data.taxTotal || 0),
        totalRefund: Number(data.totalRefund || data.subtotal || 0),
        totalItems: itemsArr.reduce((s, it) => s + Number(it.quantity || 0), 0)
      }
    }
    if (detail.value?.orderCode) {
      await calculateRefundSuggestion()
    }
  } catch (e) {
    const err = e as { message?: string }
    error.value = err?.message || 'Không tải được chi tiết trả hàng'
  } finally {
    loading.value = false
  }
}

onMounted(loadDetail)

// Refund suggestion (Gợi ý hoàn tiền)
const refundSuggestLoading = ref(false)
const refundSuggestAmount = ref<number | null>(null)
async function calculateRefundSuggestion() {
  const orderCode = String(detail.value?.orderCode || '')
  if (!orderCode) return
  refundSuggestLoading.value = true
  try {
    const body = {
      items: (detail.value?.items || []).map(it => ({
        orderItemId: it.orderItemId ?? it.id ?? 0,
        productId: it.productId ?? 0,
        quantity: Number(it.approvedQty ?? it.quantity ?? 0)
      }))
    }
    const res = await returnsService.calculateRefund(orderCode, body)
    if (res?.success && res?.data) {
      refundSuggestAmount.value = Number(res.data.totalRefund || 0)
    } else {
      refundSuggestAmount.value = null
    }
  } catch {
    refundSuggestAmount.value = null
  } finally {
    refundSuggestLoading.value = false
  }
}

const onRefund = async () => {
  const toast = useToast()
  try {
    const amountRaw = detail.value?.totals?.totalRefund
    const amountNum = Number(amountRaw)
    const amount = Number.isFinite(amountNum) ? Math.max(0, amountNum) : 0
    const method = 'cash'
    const note = ''
    const res = await salesReturnsService.refund(code.value, { amount, method, note })
    if (res?.success) {
      toast.add({ title: 'Hoàn tiền', description: 'Đã hoàn tiền cho phiếu trả hàng', color: 'primary' })
      await loadDetail()
    } else {
      throw new Error((res as any)?.message || 'Hoàn tiền thất bại')
    }
  } catch (e) {
    const err = e as { message?: string }
    toast.add({ title: 'Hoàn tiền', description: err?.message || 'Có lỗi xảy ra', color: 'error' })
  }
}

const onReceive = async () => {
  const toast = useToast()
  try {
    const whId = selectedWarehouse.value?.id ?? null
    const res = await salesReturnsService.process(code.value, whId)
    if (res?.success) {
      toast.add({ title: 'Nhận hàng', description: 'Đã xử lý phiếu trả hàng', color: 'primary' })
      await loadDetail()
    } else {
      throw new Error(res?.message || 'Xử lý thất bại')
    }
  } catch (e) {
    const err = e as { message?: string }
    toast.add({ title: 'Nhận hàng', description: err?.message || 'Có lỗi xảy ra', color: 'error' })
  }
}
</script>

<template>
  <!-- eslint-disable vue/max-attributes-per-line, vue/html-closing-bracket-newline, vue/singleline-html-element-content-newline, vue/html-indent, vue/first-attribute-linebreak, vue/html-self-closing -->
  <UDashboardPanel id="sales-return-detail">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <button
              class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              @click="goBack"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div>
              <div class="flex items-center gap-3">
                <div class="text-lg font-semibold">{{ titleCode }}</div>
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">{{ statusReceiveLabel }}</span>
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">{{ statusRefundLabel }}</span>
              </div>
              <div class="text-xs text-gray-500">{{ formatDate(detail?.createdOn) }}</div>
            </div>
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-3">
            <UButton label="Hủy đơn trả hàng" color="neutral" variant="soft" size="sm" />
            <UButton label="Lưu trữ" color="neutral" variant="soft" size="sm" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-screen-xl mx-auto px-6 py-6">
        <div v-if="loading" class="py-10 text-center text-gray-500">Đang tải...</div>
        <div v-else-if="error" class="py-10 text-center text-red-600">{{ error }}</div>
        <template v-else>
          <div class="flex flex-col lg:flex-row gap-6">
            <!-- Left column -->
            <div class="flex-1 space-y-6">
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>
                  <span class="inline-flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                    <span>Đang trả hàng</span>
                  </span>
                </BaseCardHeader>
                <div class="-mx-6 mt-2">
                  <template v-if="(detail?.items?.length || 0) > 0">
                    <table class="min-w-full w-full text-sm border-separate border-spacing-0">
                      <thead>
                        <tr class="bg-gray-50">
                          <th class="px-6 py-2 text-left font-semibold">Sản phẩm</th>
                          <th class="px-6 py-2 text-right font-semibold">Số lượng</th>
                          <th class="px-6 py-2 text-right font-semibold">Đơn giá</th>
                          <th class="px-6 py-2 text-right font-semibold">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="it in detail?.items || []" :key="String(it.id ?? it.orderItemId ?? Math.random())">
                          <td class="px-6 py-3 align-top">
                            <div class="flex items-start gap-3">
                              <div class="w-10 h-10 rounded bg-gray-100 inline-flex items-center justify-center text-gray-400">—</div>
                              <div class="space-y-0.5">
                                <button type="button" class="text-primary-600 font-medium hover:underline text-left">{{ it.productName || 'Sản phẩm' }}</button>
                                <div v-if="it.adjustmentText" class="text-xs text-gray-500">{{ it.adjustmentText }}</div>
                                <div class="text-xs text-gray-500">• Lý do: {{ it.reason || 'Không xác định' }}</div>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-3 text-right whitespace-nowrap tabular-nums">{{ it.approvedQty ?? it.quantity ?? 0 }}</td>
                          <td class="px-6 py-3 text-right whitespace-nowrap tabular-nums">
                            <div>
                              {{ formatMoney(it.unitPrice || 0) }}
                              <div v-if="it.originalUnitPrice && it.originalUnitPrice > (it.unitPrice || 0)" class="text-gray-400 line-through">{{ formatMoney(it.originalUnitPrice) }}</div>
                            </div>
                          </td>
                          <td class="px-6 py-3 text-right whitespace-nowrap tabular-nums">
                            <span class="font-semibold">{{ formatMoney(it.lineTotal || 0) }}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </template>
                  <template v-else>
                    <TableEmptyState title="Chưa có sản phẩm" description="Đơn trả hàng chưa có sản phẩm nào" />
                  </template>
                </div>

                <!-- Summary rows -->
                <div class="-mx-6 px-6 py-4 text-sm">
                  <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div class="text-gray-600">Tổng tiền hàng</div>
                    <div class="text-right">
                      <span class="mr-2 text-xs text-gray-500">{{ totalItemsCount }} sản phẩm</span>
                      <span class="font-medium">{{ formatMoney(detail?.totals?.subtotal || 0) }}</span>
                    </div>
                    <div class="text-gray-600">Giảm giá</div>
                    <div class="text-right">{{ (detail?.totals?.discount || 0) ? `-${formatMoney(Math.abs(detail?.totals?.discount || 0))}` : '------' }}</div>
                    <div class="text-gray-900 font-semibold">Tổng hoàn trả</div>
                    <div class="text-right font-semibold">{{ formatMoney(detail?.totals?.totalRefund ?? detail?.totals?.subtotal ?? 0) }}</div>
                  </div>

                  <div class="mt-4">
                    <div class="flex items-center justify-between rounded-md border border-gray-100 px-4 py-2 bg-gray-50">
                      <div class="text-sm">Gợi ý hoàn tiền</div>
                      <div class="text-sm font-semibold">
                        <span v-if="refundSuggestLoading">Đang tính...</span>
                        <span v-else>{{ refundSuggestAmount != null ? formatMoney(refundSuggestAmount) : formatMoney(detail?.totals?.totalRefund ?? 0) }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="mt-4 flex items-center justify-end gap-3">
                    <UButton v-if="isProcessed" label="Hoàn tiền" color="neutral" @click="onRefund" />
                    <UButton label="Nhận hàng" color="primary" :disabled="isProcessed" @click="onReceive" />
                  </div>
                </div>
              </UPageCard>
            </div>

            <!-- Right column -->
            <div class="w-full lg:w-80 space-y-6">
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Khách hàng</BaseCardHeader>
                <div class="-mx-6 px-6 pb-4 text-sm">
                  <div v-if="detail?.customerName" class="text-gray-900">{{ detail.customerName }}</div>
                  <div v-else class="text-gray-500">Không có khách hàng</div>
                </div>
              </UPageCard>

              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Đơn hàng</BaseCardHeader>
                <div class="-mx-6 px-6 pb-4 text-sm">
                  <div class="text-gray-600">Mã đơn hàng</div>
                  <div>
                    <NuxtLink v-if="detail?.orderCode" :to="`/orders/${detail.orderCode}`" class="text-primary-600 hover:underline">#{{ detail.orderCode }}</NuxtLink>
                    <span v-else class="text-gray-500">---</span>
                  </div>
                </div>
              </UPageCard>

              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Thông tin phiếu</BaseCardHeader>
                <div class="-mx-6 px-6 pb-4 text-sm space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="text-gray-600">Chi nhánh trả hàng</div>
                    <div class="text-gray-900">{{ detail?.warehouseName || 'Cửa hàng chính' }}</div>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="text-gray-600">Ngày tạo</div>
                    <div class="text-gray-900">{{ formatDate(detail?.createdOn) }}</div>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="text-gray-600">Ngày hủy đơn trả</div>
                    <div class="text-gray-900">{{ detail?.canceledOn ? formatDate(detail.canceledOn) : '---' }}</div>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="text-gray-600">Nhân viên trả hàng</div>
                    <div class="text-gray-900">{{ detail?.staffName || '---' }}</div>
                  </div>
                </div>
              </UPageCard>

              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Ghi chú</BaseCardHeader>
                <div class="-mx-6 px-6 pb-4 text-sm text-gray-500">{{ detail?.note || 'Chưa có ghi chú' }}</div>
              </UPageCard>
            </div>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
