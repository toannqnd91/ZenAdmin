<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, onMounted } from 'vue'
import BaseCardHeader from '~/components/BaseCardHeader.vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import { customersService } from '@/services/customers.service'

const route = useRoute()
const router = useRouter()

// id is string per request
const customerId = computed(() => String(route.params.id || ''))

if (!customerId.value) {
  // If no id, go back to customers list
  router.replace('/customers')
}

// Status display types
type UiPaymentStatus = 'Đã thanh toán' | 'Thanh toán một phần' | 'Chưa thanh toán'
type UiProcessStatus = 'Đã xử lý' | 'Đang xử lý' | 'Đã hủy'

// Backend enum reference (numeric order status)
const ORDER_STATUS_MAP: Record<number, UiProcessStatus> = {
  1: 'Đang xử lý', // New
  10: 'Đang xử lý', // OnHold
  20: 'Đang xử lý', // PendingPayment
  30: 'Đang xử lý', // PaymentReceived
  35: 'Đang xử lý', // PaymentFailed
  40: 'Đang xử lý', // Invoiced
  50: 'Đang xử lý', // Shipping
  60: 'Đang xử lý', // Shipped
  70: 'Đã xử lý', // Complete
  80: 'Đã hủy', // Canceled
  90: 'Đã hủy', // Refunded (treat as canceled for now)
  100: 'Đã xử lý' // Closed
}

function mapPaymentStatus(apiStatus: string | null | undefined, paidAmount: number, total: number): UiPaymentStatus {
  const status = (apiStatus || '').toLowerCase()
  if (status === 'paid' || (paidAmount >= total && total > 0)) return 'Đã thanh toán'
  if (status === 'partiallypaid' || paidAmount > 0) return 'Thanh toán một phần'
  return 'Chưa thanh toán'
}

function mapProcessStatusFromCode(code: number | null | undefined, text: string | null | undefined): UiProcessStatus {
  if (code != null && ORDER_STATUS_MAP[code]) return ORDER_STATUS_MAP[code]
  // fallback to text heuristics
  const t = (text || '').toLowerCase()
  if (t.includes('cancel')) return 'Đã hủy'
  if (t.includes('complete') || t.includes('close')) return 'Đã xử lý'
  return 'Đang xử lý'
}

function initialsFromName(name: string) {
  const parts = (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const lastTwo = parts.slice(-2)
  return lastTwo.map(p => p[0]?.toUpperCase() || '').join('') || 'CU'
}

function mapGender(genderCode: string | null): string {
  if (genderCode === null || genderCode === '') return ''
  const code = Number(genderCode)
  if (code === 0) return 'Nam'
  if (code === 1) return 'Nữ'
  if (code === 2) return 'Chưa xác định'
  return ''
}

function formatMoney(n: number) {
  return `${Number(n || 0).toLocaleString('vi-VN')}đ`
}

const customer = ref({
  id: customerId.value,
  fullName: '',
  email: '' as string | null,
  phone: '' as string | null,
  gender: '' as string | null,
  birthDate: '' as string | null,
  marketingOptIn: false,
  hasAccount: false,
  address: '' as string | null,
  group: '' as string | null,
  tags: [] as string[],
  orderStats: {
    latestOrderNo: '',
    orderCount: 0,
    totalSpend: 0,
    avgSpend: 0
  },
  financials: {
    totalSales: 0,
    totalNetSales: 0,
    totalAmount: 0,
    paid: 0,
    receivable: 0,
    currentReceivables: 0
  }
})

// Groups state
type GroupOption = { id: number, name: string }
const groups = ref<GroupOption[]>([])
const selectedGroups = ref<GroupOption[]>([])
// no-op

// RemoteSearchSelect fetcher for groups (local filter since API doesn't expose search param)
async function fetchCustomerGroups(search: string): Promise<GroupOption[]> {
  try {
    if (!groups.value.length) {
      const res = await customersService.getCustomerGroupsExternal()
      groups.value = Array.isArray(res?.data) ? res.data.map(g => ({ id: g.id, name: g.name })) : []
    }
    const q = (search || '').toLowerCase()
    return q ? groups.value.filter(g => g.name.toLowerCase().includes(q)) : groups.value
  } catch {
    return []
  }
}

const recentOrders = ref<Array<{
  no: string
  author: string
  time: string
  amount: number
  paymentStatus: UiPaymentStatus
  processStatus: UiProcessStatus
}>>([])

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  const date = d.toLocaleDateString('vi-VN')
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${date} ${time}`
}

// Legacy helper no longer used (replaced by mapProcessStatusFromCode)

const note = ref('')
const newTag = ref('')
function addTag() {
  const t = newTag.value.trim()
  if (!t) return
  if (!customer.value.tags.includes(t)) customer.value.tags.push(t)
  newTag.value = ''
}
function removeTag(i: number) {
  customer.value.tags.splice(i, 1)
}

function goBack() {
  router.push('/customers')
}

function openInviteActivation() {
  // Placeholder for sending activation invite
}

function viewAllOrders() {
  // Placeholder navigation to orders list filtered by customer
}

function reloadDebts() {
  // Placeholder reload action for debt management card
}

function saveCustomer() {
  // Placeholder for save action (notes/tags/groups changes)
}

// Render helpers for multiline sections
const contactText = computed(() => [
  customer.value.fullName || '',
  customer.value.phone || '',
  mapGender(customer.value.gender),
  customer.value.birthDate || ''
].filter(Boolean).join('\n'))

const addressText = computed(() => [
  customer.value.fullName || '',
  customer.value.phone || '',
  customer.value.address || ''
].filter(Boolean).join('\n'))

// Fetch data from external API and map to view model

onMounted(async () => {
  try {
    if (!customerId.value) return
    // Fetch groups, customer details and recent orders in parallel
    const [groupsRes, customerRes, ordersRes] = await Promise.all([
      customersService.getCustomerGroupsExternal(),
      customersService.getCustomerByIdExternal(customerId.value),
      customersService.getCustomerOrdersExternal(customerId.value)
    ])

    groups.value = Array.isArray(groupsRes?.data) ? groupsRes.data.map(g => ({ id: g.id, name: g.name })) : []

    if (customerRes?.success && customerRes.data) {
      const d = customerRes.data
      customer.value.id = String(d.id ?? customerId.value)
      customer.value.fullName = d.fullName || d.name || ''
      customer.value.email = d.email || null
      customer.value.phone = d.phoneNumber || null
      // gender mapping: backend returns number|null; leave string for now
      customer.value.gender = d.gender == null ? null : String(d.gender)
      // birthDate ISO -> locale date (dd/MM/yyyy)
      customer.value.birthDate = d.birthDate ? new Date(d.birthDate).toLocaleDateString('vi-VN') : null

      // address
      const addr = Array.isArray(d.address)
        ? d.address.find((a: { isDefault: boolean }) => a.isDefault) || d.address[0]
        : null
      if (addr) {
        const parts = [
          addr.addressLine1,
          addr.wardName,
          addr.districtName,
          addr.stateOrProvinceName,
          addr.countryName
        ].filter(Boolean)
        customer.value.address = parts.join(', ')
      } else {
        customer.value.address = null
      }

      // groups
      const ids = Array.isArray(d.groups) ? d.groups.map(g => g.groupId) : []
      selectedGroups.value = ids
        .map(id => groups.value.find(g => g.id === id) || null)
        .filter(Boolean) as GroupOption[]
      customer.value.group = selectedGroups.value[0]?.name || null

      // stats
      customer.value.orderStats.orderCount = d.totalOrders || 0
      customer.value.orderStats.totalSpend = d.totalAmount || d.totalNetSales || d.totalSales || 0
      customer.value.orderStats.avgSpend = d.totalOrders
        ? Math.round((d.totalAmount || 0) / d.totalOrders)
        : 0
      customer.value.financials = {
        totalSales: d.totalSales || 0,
        totalNetSales: d.totalNetSales || 0,
        totalAmount: d.totalAmount || 0,
        paid: d.paid || 0,
        receivable: d.receivable || 0,
        currentReceivables: d.currentReceivables || d.receivable || 0
      }
      // note
      if (typeof d.note === 'string') {
        note.value = d.note
      }
      // latestOrderNo unknown from customer payload → will try to derive from orders response below
    }
    // Orders mapping
    if (ordersRes?.data?.items?.length) {
      recentOrders.value = ordersRes.data.items.map((i) => {
        const paymentStatus = mapPaymentStatus(i.paymentStatus, i.paidAmount, i.orderTotal)

        const rawCode = i.orderCode || `#${i.id}`
        const normalizedCode = rawCode.startsWith('#') ? rawCode : `#${rawCode}`

        return {
          no: normalizedCode,
          author: 'Từ Admin', // API does not supply author; placeholder
          time: formatDateTime(i.createdOn),
          amount: i.orderTotal || 0,
          paymentStatus,
          processStatus: mapProcessStatusFromCode(i.orderStatus, i.orderStatusText)
        }
      })
      if (!customer.value.orderStats.latestOrderNo && recentOrders.value[0]) {
        customer.value.orderStats.latestOrderNo = recentOrders.value[0].no
      }
    }
  } catch {
    // Silent for now; could add a toast later
  }
})
</script>

<template>
  <UDashboardPanel id="customer-detail" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <UDashboardSidebarCollapse />
            <div class="text-lg font-semibold flex items-center gap-2">
              <span>
                {{ customer.fullName }}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="w-4 h-4 text-gray-500"
              >
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 011.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-md border border-transparent bg-white text-sm text-primary-600 hover:text-primary-700"
              @click="openInviteActivation"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="w-4 h-4"
              >
                <path d="M2.25 12l8.954-8.955c.44-.439 1.166-.128 1.166.49V8.5c4.833.208 7.5 2.73 7.5 7.5-1.5-2-3.75-3-7.5-3v4.965c0 .618-.725.929-1.166.49L2.25 12z" />
              </svg>
              Gửi lời mời kích hoạt tài khoản
            </button>
            <button
              type="button"
              class="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
              @click="goBack"
            >
              Quay lại
            </button>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-6xl mx-auto px-4 lg:px-6 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Summary card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4">
                <div class="flex items-start gap-4">
                  <div class="h-14 w-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                    {{ initialsFromName(customer.fullName) }}
                  </div>
                  <div class="flex-1">
                    <div class="text-lg font-semibold text-gray-900">
                      {{ customer.fullName }}
                    </div>
                    <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div class="flex flex-col">
                        <div class="text-sm text-gray-500">
                          Đơn hàng mới nhất
                        </div>
                        <div class="text-sm">
                          <a href="#" class="text-primary-600 hover:underline">
                            {{ customer.orderStats.latestOrderNo }}
                          </a>
                        </div>
                        <div class="text-xs text-gray-500">
                          Từ Admin
                        </div>
                      </div>
                      <div class="flex flex-col">
                        <div class="text-sm text-gray-500">
                          Tổng chi tiêu
                        </div>
                        <div class="text-base font-semibold">
                          {{ formatMoney(customer.orderStats.totalSpend) }}
                        </div>
                        <div class="text-xs text-gray-500">
                          {{ customer.orderStats.orderCount }} đơn hàng
                        </div>
                      </div>
                      <div class="flex flex-col">
                        <div class="text-sm text-gray-500">
                          Chi tiêu trung bình
                        </div>
                        <div class="text-base font-semibold">
                          {{ formatMoney(customer.orderStats.avgSpend) }}
                        </div>
                      </div>
                    </div>
                    <div class="mt-6 border-t border-gray-100 pt-6">
                      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div class="flex flex-col">
                          <div class="text-xs uppercase tracking-wide text-gray-500">
                            Tổng bán (Gross)
                          </div>
                          <div class="text-base font-semibold">
                            {{ formatMoney(customer.financials.totalSales) }}
                          </div>
                        </div>
                        <div class="flex flex-col">
                          <div class="text-xs uppercase tracking-wide text-gray-500">
                            Tổng bán trừ trả hàng
                          </div>
                          <div class="text-base font-semibold">
                            {{ formatMoney(customer.financials.totalNetSales) }}
                          </div>
                        </div>
                        <div class="flex flex-col">
                          <div class="text-xs uppercase tracking-wide text-gray-500">
                            Công nợ hiện tại
                          </div>
                          <div class="text-base font-semibold text-red-600">
                            {{ formatMoney(customer.financials.currentReceivables) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Recent orders card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Đơn hàng gần đây
                <template #actions>
                  <a href="#" class="text-sm text-primary-600 hover:underline" @click.prevent="viewAllOrders">Danh sách đơn hàng</a>
                </template>
              </BaseCardHeader>
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="divide-y divide-gray-200 dark:divide-gray-700">
                  <div
                    v-for="o in recentOrders"
                    :key="o.no"
                    class="py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div class="text-sm">
                        <a href="#" class="text-primary-600 hover:underline">
                          {{ o.no }}
                        </a>
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ o.author }} | {{ o.time }}
                      </div>
                    </div>
                    <div class="flex flex-col items-end gap-1">
                      <div class="text-sm font-medium">
                        {{ formatMoney(o.amount) }}
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          v-if="o.paymentStatus === 'Thanh toán một phần'"
                          class="inline-flex items-center rounded-full bg-blue-50 text-blue-700 text-xs px-3 h-7"
                        >
                          <svg
                            class="w-3 h-3 mr-2 text-blue-600"
                            viewBox="0 0 10 10"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <circle
                              cx="5"
                              cy="5"
                              r="4"
                              stroke="currentColor"
                              stroke-width="1.5"
                              fill="white"
                            />
                            <path d="M1 5 A4 4 0 0 1 9 5 L1 5 Z" fill="currentColor" />
                          </svg>
                          Thanh toán một phần
                        </span>
                        <span
                          v-else-if="o.paymentStatus === 'Đã thanh toán'"
                          class="inline-flex items-center rounded-full bg-gray-100 text-gray-700 text-xs px-3 h-7"
                        >
                          <span class="w-1.5 h-1.5 rounded-full bg-gray-500 mr-2" />
                          Đã thanh toán
                        </span>
                        <span
                          v-else
                          class="inline-flex items-center rounded-full bg-amber-50 text-amber-700 text-xs px-3 h-7"
                        >
                          <span class="w-1.5 h-1.5 rounded-full bg-amber-600 mr-2" />
                          Chưa thanh toán
                        </span>
                        <span class="inline-flex items-center rounded-full bg-gray-100 text-gray-700 text-xs px-3 h-7">
                          <span class="w-1.5 h-1.5 rounded-full bg-gray-500 mr-2" />
                          {{ o.processStatus }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Debt management card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <template #title>
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-banknotes-20-solid" class="w-4 h-4" />
                  <div class="text-base font-medium">
                    Quản lý công nợ
                  </div>
                </div>
              </template>
              <div class="-mx-6 px-6 pt-10 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="flex flex-col items-center justify-center gap-4 text-center">
                  <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl">
                    <UIcon name="i-heroicons-document-currency-dollar-20-solid" class="w-10 h-10 text-gray-500" />
                  </div>
                  <div class="text-sm text-gray-500">
                    Lỗi tải dữ liệu
                  </div>
                  <button
                    type="button"
                    class="h-9 px-4 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
                    @click="reloadDebts"
                  >
                    Tải lại
                  </button>
                </div>
              </div>
            </UPageCard>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            <!-- Contact card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Liên hệ
                <template #actions>
                  <button class="text-gray-400 hover:text-gray-600" title="Chỉnh sửa">
                    <UIcon name="i-heroicons-pencil-square-20-solid" class="w-5 h-5" aria-hidden="true" />
                  </button>
                </template>
              </BaseCardHeader>
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                <div v-if="customer.email" class="text-sm">
                  <a :href="`mailto:${customer.email}`" class="text-primary-600 hover:underline">
                    {{ customer.email }}
                  </a>
                </div>
                <div class="text-sm whitespace-pre-line text-gray-700">
                  {{ contactText }}
                </div>

                <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-medium text-gray-900">
                      Sổ địa chỉ
                    </h3>
                    <button class="text-gray-400 hover:text-gray-600" title="Chỉnh sửa">
                      <UIcon name="i-heroicons-pencil-square-20-solid" class="w-5 h-5" aria-hidden="true" />
                    </button>
                  </div>
                  <div class="mt-2 text-sm whitespace-pre-line text-gray-700">
                    {{ addressText }}
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Group card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <template #title>
                <div class="text-base font-medium">
                  Nhóm khách hàng
                </div>
              </template>
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-3">
                <div>
                  <RemoteSearchSelect
                    v-model="selectedGroups"
                    :fetch-fn="fetchCustomerGroups"
                    placeholder="Chọn nhóm khách hàng"
                    :clearable="true"
                    label-field="name"
                    :searchable="true"
                    :search-in-trigger="true"
                    :dropdown-max-height="360"
                    :multiple="true"
                    :full-width="true"
                  />
                </div>
                <div v-if="selectedGroups.length" class="flex flex-wrap gap-2">
                  <span
                    v-for="g in selectedGroups"
                    :key="g.id"
                    class="inline-flex items-center rounded-full bg-primary-50 text-primary-700 text-xs px-3 h-7"
                  >
                    {{ g.name }}
                  </span>
                </div>
              </div>
            </UPageCard>

            <!-- Notes card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <template #title>
                <div class="text-base font-medium">
                  Ghi chú
                </div>
              </template>
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <textarea
                  v-model="note"
                  rows="5"
                  class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Nhập ghi chú"
                />
              </div>
            </UPageCard>

            <!-- Tags card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Tag
                <template #actions>
                  <a href="#" class="text-primary-600 text-xs font-medium hover:underline">Danh sách tag</a>
                </template>
              </BaseCardHeader>
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <input
                  v-model="newTag"
                  type="text"
                  class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tìm kiếm hoặc thêm mới tag"
                  @keydown.enter.prevent="addTag"
                >
                <div v-if="customer.tags.length" class="flex flex-wrap gap-2 mt-3">
                  <div
                    v-for="(t, i) in customer.tags"
                    :key="t+i"
                    class="px-2 h-7 rounded-full bg-primary-50 text-primary-700 text-xs inline-flex items-center gap-1"
                  >
                    <span>{{ t }}</span>
                    <button
                      type="button"
                      class="text-primary-500 hover:text-primary-700"
                      @click="removeTag(i)"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </UPageCard>
          </div>
        </div>

        <!-- Save -->
        <div class="flex justify-end mt-8 mb-4">
          <button
            type="button"
            class="px-6 h-10 rounded-md font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition shadow sm bg-primary-600 text-white hover:bg-primary-700"
            @click="saveCustomer"
          >
            <span>Lưu</span>
          </button>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
