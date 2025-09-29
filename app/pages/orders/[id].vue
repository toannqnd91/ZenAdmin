<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ordersService } from '@/services/orders.service'
import type { OrderDetail, OrderHistoryEvent } from '@/services/orders.service'
import BaseCardHeader from '@/components/BaseCardHeader.vue'

const route = useRoute()
const orderId = computed(() => route.params.id as string | number)

const loading = ref(false)
const detail = ref<OrderDetail | null>(null)
const history = ref<OrderHistoryEvent[] | null>(null)

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
    const [d, h] = await Promise.all([
      ordersService.getOrderById(orderId.value),
      ordersService.getOrderHistory(orderId.value)
    ])
    if (d && 'success' in d) detail.value = d.data as OrderDetail | null
    if (h && 'success' in h) history.value = h.data as OrderHistoryEvent[] | null
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <UDashboardPanel :id="`order-${orderId}`">
    <template #header>
      <UDashboardNavbar :title="detail?.orderCode || 'Đơn hàng'">
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
      <div v-if="loading" class="p-6 text-center text-sm text-gray-500">
        Đang tải...
      </div>
      <div v-else-if="!detail" class="p-6 text-center text-sm text-gray-500">
        Không tìm thấy đơn hàng.
      </div>
      <div v-else class="space-y-6">
        <!-- Status timeline row -->
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div class="xl:col-span-9 space-y-6">
            <!-- Status timeline card -->
            <UCard>
              <BaseCardHeader title="Trạng thái" />
              <div class="mt-4 flex items-center flex-wrap gap-4 text-sm">
                <!-- Simplified timeline -->
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
            </UCard>

            <!-- Products card -->
            <UCard>
              <BaseCardHeader title="Đã xử lý giao hàng" />
              <div class="mt-4 overflow-x-auto">
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
            </UCard>

            <!-- Payment summary card -->
            <UCard>
              <BaseCardHeader title="Đã thanh toán" />
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
            </UCard>

            <!-- Invoice status card -->
            <UCard>
              <BaseCardHeader title="Hóa đơn điện tử" />
                <div class="mt-4 text-sm text-amber-600">
                  Chưa yêu cầu hóa đơn điện tử
                </div>
            </UCard>

            <!-- History card -->
            <UCard>
              <BaseCardHeader title="Lịch sử đơn hàng" />
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
            </UCard>
          </div>

          <!-- Right side column -->
          <div class="xl:col-span-3 space-y-6">
            <UCard>
              <BaseCardHeader title="Nguồn đơn" />
              <div class="mt-4 text-sm">
                {{ detail.meta?.sourceName || 'POS' }}
              </div>
            </UCard>

            <UCard>
              <BaseCardHeader title="Khách hàng" />
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
            </UCard>

            <UCard>
              <BaseCardHeader title="Ghi chú" />
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
            </UCard>

            <UCard>
              <BaseCardHeader title="Thông tin bổ sung" />
              <div class="mt-4 text-xs space-y-2 text-gray-600">
                <div><span class="font-medium text-gray-700">Bán tại chi nhánh:</span> {{ detail.meta?.branchName || 'Cửa hàng chính' }}</div>
                <div><span class="font-medium text-gray-700">Nhân viên phụ trách:</span> {{ detail.meta?.staffInCharge || '---' }}</div>
                <div><span class="font-medium text-gray-700">Nhân viên tạo đơn:</span> {{ detail.meta?.creatorName || '---' }}</div>
                <div><span class="font-medium text-gray-700">Ngày đặt hàng:</span> {{ formatDateTime(detail.meta?.orderDate) }}</div>
                <div><span class="font-medium text-gray-700">Ngày hẹn giao:</span> {{ formatDateTime(detail.meta?.scheduledDate) || 'Chưa có' }}</div>
                <div>
                  <span class="font-medium text-gray-700">Tag:</span>
                  <div class="mt-1">
                    <input
                      type="text"
                      disabled
                      placeholder="Tìm kiếm hoặc thêm mới tag"
                      class="w-full text-xs px-2 py-1 border rounded bg-gray-50"
                    >
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
