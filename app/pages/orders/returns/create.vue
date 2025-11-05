<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRuntimeConfig } from '#imports'
import { useRoute, useRouter } from 'vue-router'
import BaseCardHeader from '@/components/BaseCardHeader.vue'
import BranchSelect from '@/components/BranchSelect.vue'
import AsyncSelect from '@/components/AsyncSelect.vue'
import { warehouseService, type WarehouseItem } from '@/services/warehouse.service'
import { useGlobalWarehouse } from '@/composables/useWarehouse'
import { ordersService, type RawOrderItem } from '@/services/orders.service'
import { returnsService, type CalculateRefundResponseData } from '@/services/returns.service'

const route = useRoute()
const router = useRouter()

const orderCode = computed(() => {
  const raw = (route.query.code as string | undefined) || ''
  return raw.replace(/^#/, '')
})

function goBack() {
  router.back()
}

// Chi nhánh trả hàng (dùng mẫu có sẵn BranchSelect)
const selectedBranch = ref<WarehouseItem | null>(null)
const { selectedWarehouse } = useGlobalWarehouse()

onMounted(async () => {
  try {
    const cached = await warehouseService.getWarehousesCached()
    const list = Array.isArray(cached.data) ? cached.data : []
    // Ưu tiên chi nhánh đã chọn toàn cục nếu có
    const globalId = selectedWarehouse.value?.id
    if (globalId != null) {
      const found = list.find(w => String(w.id) === String(globalId))
      if (found) {
        selectedBranch.value = found
      }
    }
    // Fallback: dùng kho mặc định từ API nếu có
    try {
      const def = await warehouseService.getDefaultWarehouse()
      const defId = def?.data?.id
      if (defId != null) {
        const foundDef = list.find(w => String(w.id) === String(defId))
        if (foundDef) selectedBranch.value = foundDef
      }
    } catch {
      // ignore default fetch errors
    }
  } catch {
    // ignore errors; user có thể tự chọn trong dropdown
  }
  // Fetch order items for display
  await fetchOrderItems()
})

// --- Load order detail to list products ---
type ReturnListItem = {
  id: number | string
  productId: number | string
  productName: string
  quantity: number // ordered quantity (max allowed to return)
  returnQty: number // user-entered return quantity
  unitPrice: number
  lineTotal: number
  thumbnailImageUrl: string | null
}
const orderItems = ref<ReturnListItem[]>([])

// Show summary when any product has return quantity > 0
const hasSelectedReturns = computed(() => orderItems.value.some(it => (it.returnQty || 0) > 0))

// Reason dropdown using AsyncSelect with a local static list for now
type ReasonItem = { value: string, label: string }
const reasonOptions: ReasonItem[] = [
  { value: 'unknown', label: 'Không xác định' },
  { value: 'change-mind', label: 'Khách hàng thay đổi ý định' },
  { value: 'not-as-described', label: 'Hàng không giống mô tả' },
  { value: 'wrong-item', label: 'Gửi sai hàng' },
  { value: 'damaged', label: 'Bị hư hỏng' },
  { value: 'defective', label: 'Hàng lỗi không hoạt động' },
  { value: 'wrong-size', label: 'Sản phẩm sai kích cỡ, kích thước' },
  { value: 'wrong-color', label: 'Sản phẩm giao sai màu' },
  { value: 'wrong-style', label: 'Sai kiểu dáng' },
  { value: 'other', label: 'Khác' }
]
const selectedReason = ref<ReasonItem | null>((reasonOptions[0] ?? null) as ReasonItem | null)
const fetchReasonFn = async (q: string) => {
  const term = (q || '').toLowerCase().trim()
  const list = term
    ? reasonOptions.filter(r => r.label.toLowerCase().includes(term))
    : reasonOptions
  return list as unknown as Record<string, unknown>[]
}

// Original order warehouse name (display-only, top-right of card header)
const orderWarehouseName = ref<string>('')

function formatCurrency(v?: number | null) {
  if (v == null || isNaN(v as number)) return '0'
  const n = Math.floor(Number(v))
  return new Intl.NumberFormat('vi-VN').format(n)
}
function formatCurrencySigned(v?: number | null) {
  const raw = typeof v === 'number' ? v : 0
  const sign = raw < 0 ? '-' : ''
  const absFloored = Math.floor(Math.abs(raw))
  return `${sign}${new Intl.NumberFormat('vi-VN').format(absFloored)}`
}

// Build image URL like /orders/create
const config = useRuntimeConfig()
const imageBaseUrl = (config?.public as { imageBaseUrl?: string } | undefined)?.imageBaseUrl || ''
function getProductImageUrl(item: { thumbnailImageUrl?: string | null }) {
  const url = item?.thumbnailImageUrl
  if (!url) return '/no-image.svg'
  if (!url.includes('/') && imageBaseUrl) return `${imageBaseUrl}/image/${url}`
  return url
}

// Heuristic: infer paid status from available fields without strict typing
function detectPaid(order: Record<string, unknown> | null | undefined): boolean {
  try {
    const ps = String(order?.paymentStatus || order?.paymentStatusString || order?.payment_status || '').toLowerCase()
    if (ps) {
      const paidTokens = ['đã thanh toán', 'paid', 'fully_paid', 'fully paid']
      const unpaidTokens = ['chưa thanh toán', 'unpaid', 'not paid', 'pending']
      if (paidTokens.some(t => ps.includes(t))) return true
      if (unpaidTokens.some(t => ps.includes(t))) return false
    }
    const paidAmount = Number(order?.paidAmount)
    const orderTotal = Number(order?.orderTotal)
    if (Number.isFinite(paidAmount) && Number.isFinite(orderTotal) && orderTotal > 0) {
      return paidAmount >= orderTotal
    }
  } catch {
    // ignore
  }
  return false
}

const isOrderPaid = ref(false)

async function fetchOrderItems() {
  const code = orderCode.value
  if (!code) return
  try {
    const res = await ordersService.getOrderById(code)
    // Align with /orders/[code] page, where res.data is the payload envelope
    type MaybeOrderPayload = { order?: { orderItems?: RawOrderItem[] }, warehouse?: { id?: number | string, name?: string } } | null | undefined
    const payload = (res && 'data' in res) ? (res.data as MaybeOrderPayload) : null
    const rawItems: RawOrderItem[] = Array.isArray(payload?.order?.orderItems)
      ? (payload!.order!.orderItems as RawOrderItem[])
      : []
    if (res && 'success' in res && res.success) {
      orderItems.value = rawItems.map((it) => {
        const qty = it.quantity || 1
        const effectiveUnit = (it.rowTotal && qty > 0) ? (it.rowTotal / qty) : it.productPrice
        return {
          id: it.id,
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          returnQty: 0,
          unitPrice: effectiveUnit,
          lineTotal: it.rowTotal ?? it.total ?? (effectiveUnit * it.quantity),
          thumbnailImageUrl: it.productImage || null
        }
      })

      // Prefer current working branch (global). Only fall back to order's warehouse
      // when no global branch and nothing selected yet.
      const wh = payload?.warehouse
      if (wh && (wh.name || wh.id != null)) {
        orderWarehouseName.value = String(wh.name || '')
      }
      // payment status detection
      isOrderPaid.value = detectPaid(payload?.order)
      const hasGlobal = !!(selectedWarehouse.value && selectedWarehouse.value.id != null && String(selectedWarehouse.value.id).trim() !== '')
      const hasSelected = !!(
        selectedBranch.value && (selectedBranch.value as WarehouseItem | null)?.id != null
      )
      if (!hasGlobal && !hasSelected && wh && (wh.id != null || wh.name)) {
        const idNum = typeof wh.id === 'number' ? wh.id : (wh?.id != null ? Number(wh.id) : 0)
        selectedBranch.value = { id: idNum, name: String(wh.name || '') } as WarehouseItem
      }
    } else {
      orderItems.value = []
    }
  } catch {
    orderItems.value = []
  }
}

function clampReturnQty(it: ReturnListItem) {
  let v = Number(it.returnQty)
  if (!Number.isFinite(v)) v = 0
  v = Math.floor(v)
  if (v < 0) v = 0
  if (v > it.quantity) v = it.quantity
  it.returnQty = v
}

function adjustQty(it: ReturnListItem, delta: number) {
  const next = Math.floor((Number(it.returnQty) || 0) + delta)
  it.returnQty = Math.max(0, Math.min(it.quantity, next))
  clampReturnQty(it)
}

// ---- Refund summary via API ---------------------------------------------
const refundSummary = ref<CalculateRefundResponseData | null>(null)
const calculatingRefund = ref(false)
let refundTimer: number | undefined

function scheduleCalculateRefund() {
  if (refundTimer) window.clearTimeout(refundTimer)
  refundTimer = window.setTimeout(() => {
    void calculateRefund()
  }, 250) // debounce
}

async function calculateRefund() {
  const code = orderCode.value
  const payloadItems = orderItems.value
    .filter(it => (it.returnQty || 0) > 0)
    .map(it => ({ orderItemId: it.id, productId: it.productId, quantity: it.returnQty }))
  if (!code || payloadItems.length === 0) {
    refundSummary.value = null
    return
  }
  calculatingRefund.value = true
  try {
    const res = await returnsService.calculateRefund(code, { items: payloadItems })
    refundSummary.value = (res && res.success && res.data) ? res.data : null
  } catch {
    refundSummary.value = null
  } finally {
    calculatingRefund.value = false
  }
}

watch(orderItems, () => {
  if (hasSelectedReturns.value) scheduleCalculateRefund()
  else refundSummary.value = null
}, { deep: true })
</script>

<template>
  <UDashboardPanel id="return-create">
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
                Tạo đơn trả hàng
              </div>
              <div class="text-xs text-gray-500">
                Mã đơn hàng:
                <span class="font-medium">{{ orderCode }}</span>
              </div>
            </div>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-screen-xl mx-auto px-6">
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 py-4">
          <!-- Left column: select products to return -->
          <div class="space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Chọn sản phẩm trả hàng
                <template #actions>
                  <div class="hidden md:flex items-center gap-2 text-sm text-gray-600">
                    <svg
                      class="w-4 h-4 text-primary-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 1118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span class="font-medium text-gray-700">
                      {{ orderWarehouseName || ' ' }}
                    </span>
                  </div>
                </template>
              </BaseCardHeader>
              <div class="-mx-4 lg:-mx-6">
                <div class="grid grid-cols-[1fr_minmax(80px,auto)_minmax(110px,auto)_minmax(120px,auto)] items-center gap-12 text-sm text-gray-700 bg-gray-50 px-4 lg:px-6 py-2 rounded-t-md">
                  <div class="font-medium">
                    Sản phẩm
                  </div>
                  <div class="font-medium">
                    Số lượng
                  </div>
                  <div class="font-medium">
                    Đơn giá
                  </div>
                  <div class="font-medium text-right">
                    Thành tiền
                  </div>
                </div>
                <!-- Items -->
                <div v-if="orderItems.length > 0" class="divide-y">
                  <div
                    v-for="it in orderItems"
                    :key="it.id"
                    class="grid grid-cols-[1fr_minmax(80px,auto)_minmax(110px,auto)_minmax(120px,auto)] items-center gap-12 text-sm px-4 lg:px-6 py-3"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <img
                        :src="getProductImageUrl(it)"
                        alt=""
                        class="w-10 h-10 rounded object-cover bg-gray-100 flex-shrink-0"
                      >
                      <span class="text-gray-900 font-medium truncate">
                        {{ it.productName }}
                      </span>
                    </div>
                    <div class="text-gray-700">
                      <div class="inline-flex items-stretch rounded-md border border-gray-300 overflow-hidden bg-white">
                        <input
                          v-model.number="it.returnQty"
                          type="number"
                          inputmode="numeric"
                          min="0"
                          :max="it.quantity"
                          step="1"
                          class="w-16 h-9 px-2 text-center border-0 focus:outline-none focus:ring-2 focus:ring-primary-500 number-input-hide-arrows"
                          @input="clampReturnQty(it)"
                        >
                        <div class="flex flex-col w-8 border-l border-gray-300 divide-y divide-gray-300">
                          <button
                            type="button"
                            class="flex-1 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            :disabled="it.returnQty >= it.quantity"
                            @click="adjustQty(it, 1)"
                          >
                            <svg
                              class="w-3 h-3"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M8 5l4 4H4z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            class="flex-1 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            :disabled="it.returnQty <= 0"
                            @click="adjustQty(it, -1)"
                          >
                            <svg
                              class="w-3 h-3"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M8 11L4 7h8z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div class="text-gray-700">
                      {{ formatCurrency(it.unitPrice) }}
                    </div>
                    <div class="text-right font-medium">
                      {{ formatCurrency(it.unitPrice * (it.returnQty || 0)) }}
                    </div>
                  </div>
                </div>
                <!-- Reason select appears when there is at least one return item -->
                <div v-if="hasSelectedReturns" class="border-t border-gray-200 px-4 lg:px-6 py-3">
                  <div class="text-sm font-medium text-gray-900 mb-1">
                    Chọn lý do hoàn trả
                  </div>
                  <AsyncSelect
                    v-model="selectedReason"
                    :fetch-fn="fetchReasonFn"
                    label-field="label"
                    :get-item-key="it => String((it as any).value)"
                    placeholder="Chọn lý do hoàn trả"
                    :full-width="true"
                    :clearable="false"
                    :borderless="false"
                    trigger-class="h-10"
                  />
                </div>
                <!-- Empty state row -->
                <!-- <div v-else class="px-4 lg:px-6 py-6 text-sm text-gray-500">
                  Chưa có sản phẩm nào được chọn
                </div> -->
              </div>
            </UPageCard>

            <!-- Notes -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Ghi chú
              </BaseCardHeader>
              <div class="-mx-4 lg:-mx-6 px-4 lg:px-6 pb-4">
                <input
                  type="text"
                  placeholder="Nhập lý do hoàn trả hàng"
                  class="w-full h-11 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                <div class="text-xs text-gray-500 mt-2">
                  Chỉ có bạn và nhân viên trong cửa hàng có thể nhìn thấy lý do này
                </div>
              </div>
            </UPageCard>
          </div>

          <!-- Right column: sidebar -->
          <div class="space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Chi nhánh trả hàng
              </BaseCardHeader>
              <div class="-mx-4 lg:-mx-6 px-4 lg:px-6 space-y-4">
                <div>
                  <BranchSelect
                    v-model="selectedBranch"
                    placeholder="Chọn chi nhánh"
                    :clearable="true"
                    :full-width="true"
                    :borderless="false"
                    trigger-class="h-10"
                  />
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900 mb-1">
                    Mã đơn trả hàng
                  </div>
                  <input
                    type="text"
                    :value="orderCode"
                    readonly
                    placeholder="Nhập mã đơn trả hàng"
                    class="w-full h-10 px-3 rounded-md border border-gray-300 bg-gray-50 text-sm focus:outline-none"
                  >
                </div>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Tóm tắt
              </BaseCardHeader>
              <div class="-mx-4 lg:-mx-6 px-4 lg:px-6 py-4">
                <template v-if="hasSelectedReturns">
                  <div class="space-y-3">
                    <div>
                      <div class="text-base font-medium text-gray-900">
                        Trả hàng {{ refundSummary?.totalItems ?? orderItems.filter(x => (x.returnQty || 0) > 0).length }} sản phẩm
                      </div>
                      <div class="text-sm text-gray-500">
                        Lý do: {{ (selectedReason && (selectedReason as any).label) || 'Không xác định' }}
                      </div>
                    </div>

                    <div class="h-px bg-gray-200/50" />

                    <div class="flex items-start justify-between text-gray-900">
                      <div>
                        <div class="text-base font-medium">
                          Tổng hoàn sản phẩm
                        </div>
                        <div class="text-sm text-gray-500">
                          {{ refundSummary?.totalItems ?? orderItems.filter(x => (x.returnQty || 0) > 0).length }} sản phẩm
                        </div>
                      </div>
                      <div class="text-base font-medium">
                        {{ formatCurrency(refundSummary?.subtotal ?? 0) }}đ
                      </div>
                    </div>
                    <div class="flex items-start justify-between text-gray-900">
                      <div>
                        <div class="text-base font-medium">
                          Giảm giá
                        </div>
                        <div class="text-sm text-gray-500">
                          Tùy chỉnh
                        </div>
                      </div>
                      <div class="text-base font-medium">
                        {{ formatCurrencySigned(refundSummary?.manualDiscountAmount ?? 0) }}đ
                      </div>
                    </div>
                    <div class="flex items-center justify-between text-gray-900">
                      <div class="text-base font-medium">
                        Hoàn trả thuế
                      </div>
                      <div class="text-base font-medium">
                        {{ formatCurrency(refundSummary?.taxRefund ?? 0) }}đ
                      </div>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                      <div class="text-base font-semibold text-gray-900">
                        Tổng hoàn trả
                      </div>
                      <div class="text-lg font-semibold text-gray-900">
                        {{ formatCurrency(refundSummary?.totalRefund ?? 0) }}đ
                      </div>
                    </div>
                    <div class="-mx-4 lg:-mx-6 h-px bg-gray-200/70" />
                    <template v-if="isOrderPaid && refundSummary">
                      <div class="flex items-center justify-between">
                        <div class="text-base font-medium text-gray-900">
                          Gợi ý hoàn tiền
                        </div>
                        <div class="text-base font-semibold text-amber-500">
                          {{ formatCurrency(refundSummary?.totalRefund ?? 0) }}đ
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="text-sm text-gray-400">
                        Đơn chưa thanh toán hoặc đã hoàn trả hết
                      </div>
                    </template>
                  </div>
                  <div class="pt-4">
                    <button type="button" class="w-full h-10 rounded-md bg-primary-600 hover:bg-primary-700 text-white font-medium">
                      Tạo đơn trả hàng
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="text-sm text-gray-500">
                    Chưa có sản phẩm nào được chọn
                  </div>
                  <div class="pt-4">
                    <button type="button" disabled class="w-full h-10 rounded-md bg-gray-100 text-gray-400 font-medium cursor-not-allowed">
                      Tạo đơn trả hàng
                    </button>
                  </div>
                </template>
              </div>
            </UPageCard>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
/* Hide native number input arrows for consistent custom controls */
input.number-input-hide-arrows[type="number"]::-webkit-outer-spin-button,
input.number-input-hide-arrows[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input.number-input-hide-arrows[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}
</style>
