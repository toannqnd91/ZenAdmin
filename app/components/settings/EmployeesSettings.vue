<script setup lang="ts">
import { ref, reactive, computed, onMounted, onActivated, onDeactivated, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { identityService } from '@/services/identity.service'
import { employeesService } from '@/services/employees.service'
import type { EmployeeItem } from '@/services/employees.service'

type EmployeeRow = {
  id: string | number
  accountText: string
  statusText: string
  name: string
  email?: string
  department?: string
  position?: string
  isActive: boolean
  createdOn?: unknown
}

// Extended detail type (adds optional fields used by UI)
type EmployeeDetail = EmployeeItem & { phone?: string, status?: 'Pending' | 'Active' | 'Inactive' }

const owner = ref<string>('')
const last = ref<string>('')
const loadingOwner = ref(false)

async function loadOwner() {
  loadingOwner.value = true
  const res = await identityService.getShopOwnerCached({
    onUpdated: (data) => {
      if (data) {
        owner.value = data.fullName || data.name || data.userName || data.email || ''
        last.value = data.createdOn ? `Tạo ngày ${new Date(data.createdOn).toLocaleString('vi-VN')}` : ''
      }
    }
  })
  const data = res.data
  if (data) {
    owner.value = data.fullName || data.name || data.userName || data.email || ''
    last.value = data.createdOn ? `Tạo ngày ${new Date(data.createdOn).toLocaleString('vi-VN')}` : ''
  }
  loadingOwner.value = false
}

onMounted(loadOwner)

const active = ref(1)
const max = ref(3)
const percent = computed(() => Math.min(100, Math.round((active.value / Math.max(1, max.value)) * 100)))

// Local state: toggle create employee view
const creating = ref(false)
const firstNameRef = ref<HTMLInputElement | null>(null)
const form = reactive({ firstName: '', lastName: '', email: '', phone: '', notify: false })
function startCreate() {
  creating.value = true
  nextTick(() => {
    try {
      firstNameRef.value?.focus()
    } catch {
      // ignore
    }
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      // ignore
    }
  })
}
function cancelCreate() {
  creating.value = false
}
function submitInvite() {
  // placeholder action
  // In real app, call API then reset/close
  console.log('Invite employee', { ...form })
}

// Permissions assignment state
const assigning = ref(false)
const selectedBranch = ref<string>('')
const selectedRole = ref<string>('')
type PermissionGroup = { key: string, title: string, children: { key: string, title: string }[] }
const permissionGroups = ref<PermissionGroup[]>([
  { key: 'home', title: 'Trang chủ', children: [{ key: 'home.view', title: 'Xem trang chủ' }] },
  { key: 'orders', title: 'Đơn hàng', children: Array.from({ length: 9 }).map((_, i) => ({ key: `orders.${i + 1}`, title: `Quyền ${i + 1}` })) },
  { key: 'draft-orders', title: 'Đơn hàng nháp', children: Array.from({ length: 5 }).map((_, i) => ({ key: `draft.${i + 1}`, title: `Quyền ${i + 1}` })) },
  { key: 'incomplete-orders', title: 'Đơn hàng chưa hoàn tất', children: [{ key: 'incomplete.view', title: 'Xem' }] },
  { key: 'returns', title: 'Trả hàng', children: Array.from({ length: 5 }).map((_, i) => ({ key: `returns.${i + 1}`, title: `Quyền ${i + 1}` })) },
  { key: 'products', title: 'Sản phẩm', children: Array.from({ length: 7 }).map((_, i) => ({ key: `products.${i + 1}`, title: `Quyền ${i + 1}` })) },
  { key: 'product-cats', title: 'Danh mục sản phẩm', children: [{ key: 'pc.view', title: 'Xem' }] },
  { key: 'shipping', title: 'Vận chuyển', children: Array.from({ length: 4 }).map((_, i) => ({ key: `ship.${i + 1}`, title: `Quyền ${i + 1}` })) },
  { key: 'warehouse', title: 'Kho', children: Array.from({ length: 31 }).map((_, i) => ({ key: `wh.${i + 1}`, title: `Quyền ${i + 1}` })) },
  { key: 'customers', title: 'Khách hàng', children: Array.from({ length: 5 }).map((_, i) => ({ key: `cust.${i + 1}`, title: `Quyền ${i + 1}` })) },
  { key: 'sales-report', title: 'Báo cáo bán hàng', children: Array.from({ length: 2 }).map((_, i) => ({ key: `salerep.${i + 1}`, title: `Quyền ${i + 1}` })) },
  { key: 'payment-report', title: 'Báo cáo thanh toán', children: [{ key: 'payrep.view', title: 'Xem' }] },
  { key: 'other-report', title: 'Báo cáo khác', children: Array.from({ length: 3 }).map((_, i) => ({ key: `otherrep.${i + 1}`, title: `Quyền ${i + 1}` })) },
  { key: 'promo', title: 'Khuyến mãi', children: Array.from({ length: 2 }).map((_, i) => ({ key: `promo.${i + 1}`, title: `Quyền ${i + 1}` })) },
  { key: 'cashbook', title: 'Sổ quỹ', children: Array.from({ length: 5 }).map((_, i) => ({ key: `cash.${i + 1}`, title: `Quyền ${i + 1}` })) },
  { key: 'website', title: 'Website', children: Array.from({ length: 5 }).map((_, i) => ({ key: `web.${i + 1}`, title: `Quyền ${i + 1}` })) },
  { key: 'settings', title: 'Cấu hình', children: Array.from({ length: 9 }).map((_, i) => ({ key: `cfg.${i + 1}`, title: `Quyền ${i + 1}` })) }
])
const expandedGroups = ref<Record<string, boolean>>({})
const selectedPerms = ref<Record<string, boolean>>({})
const groupSelectedCount = (g: PermissionGroup) => g.children.reduce((n,c)=> n + (selectedPerms.value[c.key] ? 1 : 0), 0)
const isGroupChecked = (g: PermissionGroup) => groupSelectedCount(g) === g.children.length
const isGroupIndeterminate = (g: PermissionGroup) => groupSelectedCount(g) > 0 && !isGroupChecked(g)
function toggleGroup(g: PermissionGroup) {
  const target = !isGroupChecked(g)
  const next = { ...selectedPerms.value }
  for (const c of g.children) next[c.key] = target
  selectedPerms.value = next
}
function toggleChild(key: string) {
  selectedPerms.value = { ...selectedPerms.value, [key]: !selectedPerms.value[key] }
}
function selectAll() {
  const allSelected = permissionGroups.value.every(g => isGroupChecked(g))
  const next: Record<string, boolean> = {}
  for (const g of permissionGroups.value) for (const c of g.children) next[c.key] = !allSelected
  selectedPerms.value = next
}
function openAll() {
  const allOpen = permissionGroups.value.every(g => expandedGroups.value[g.key])
  const next: Record<string, boolean> = {}
  for (const g of permissionGroups.value) next[g.key] = !allOpen
  expandedGroups.value = next
}
function openAssign() {
  assigning.value = true
}
function closeAssign() {
  assigning.value = false
}

// Employees list (cache-first) with shared Nuxt state for instant return on tab/page switch
const employeesState = useState<EmployeeItem[]>('employees/list', () => [])
const employeesStateTs = useState<number>('employees/list/ts', () => 0)
const employees = ref<EmployeeItem[]>(employeesState.value || [])
const employeesLoading = ref(false)
const employeesRefreshing = ref(false)
const empQ = ref('')
const empSelection = ref<Record<string, boolean>>({})
// Columns definition removed (no longer using BaseTable)
const employeeRows = computed<EmployeeRow[]>(() => {
  return employees.value.map((e) => {
    const name = e.fullName || e.email || e.code
    const acct = [name, e.department, e.position].filter(Boolean).join(' ')
    return {
      id: e.id,
      // columns for filtering/searching
      accountText: acct,
      statusText: e.isActive ? 'Đang kích hoạt' : 'Ngừng kích hoạt',
      // raw fields for custom rendering
      name,
      email: e.email || undefined,
      department: e.department || undefined,
      position: e.position || undefined,
      isActive: e.isActive,
      createdOn: e.createdOn || undefined
    }
  })
})

// Detail view state and helpers
const selected = ref<EmployeeDetail | null>(null)
const employeeMap = computed<Record<string, EmployeeDetail>>(() => {
  const map: Record<string, EmployeeDetail> = {}
  for (const e of employees.value as EmployeeDetail[]) {
    map[String(e.id)] = e
  }
  return map
})

function openDetailById(id: string | number) {
  const emp = employeeMap.value[String(id)]
  if (emp) {
    selected.value = emp
    creating.value = false
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      // ignore
    }
  }
}
function closeDetail() {
  selected.value = null
}

async function loadEmployees(force = false) {
  if (!force && (employeesLoading.value || employeesRefreshing.value)) return
  // If we already have shared-state data and not forcing, show it instantly and refresh in background
  const now = Date.now()
  const hasShared = Array.isArray(employeesState.value) && employeesState.value.length > 0
  const isFresh = now - (employeesStateTs.value || 0) < 60_000
  if (hasShared && !force) {
    employees.value = employeesState.value
  }
  employeesLoading.value = !(hasShared && isFresh)
  const res = await employeesService.getEmployeesCached({
    onUpdated: (list) => {
      const next = Array.isArray(list) ? list : []
      employees.value = next
      employeesState.value = next
      employeesStateTs.value = Date.now()
    }
  })
  const list = res.data
  const next = Array.isArray(list) ? list : []
  employees.value = next
  employeesState.value = next
  employeesStateTs.value = Date.now()
  if (res.fromCache) {
    // If cache is used but currently empty, keep showing skeletons until refresh finishes
    const hadData = employees.value.length > 0
    employeesRefreshing.value = true
    employeesLoading.value = !hadData
    res.refreshPromise
      ?.finally(() => {
        employeesRefreshing.value = false
        employeesLoading.value = false
        // Ensure shared cache mirrors final state
        employeesState.value = employees.value
        employeesStateTs.value = Date.now()
      })
  } else {
    employeesLoading.value = false
    employeesRefreshing.value = false
  }
}

// Selection helpers for custom table
const filteredRows = computed(() => {
  const q = (empQ.value || '').toLowerCase()
  if (!q) return employeeRows.value
  return employeeRows.value.filter((r: EmployeeRow) => {
    const account = String(r.accountText || '').toLowerCase()
    const status = String(r.statusText || '').toLowerCase()
    return account.includes(q)
      || status.includes(q)
  })
})

const isSelected = (id: string | number) => !!empSelection.value[String(id)]
const setRowSelected = (id: string | number, v: boolean) => {
  const next = { ...(empSelection.value || {}) }
  next[String(id)] = v
  empSelection.value = next
}
const pageAllSelected = computed(() => filteredRows.value.length > 0 && filteredRows.value.every(it => isSelected(String(it.id))))
const pageSomeSelected = computed(() => filteredRows.value.some(it => isSelected(String(it.id))))
const selectAllState = computed<'none' | 'some' | 'all'>(() => pageAllSelected.value ? 'all' : (pageSomeSelected.value ? 'some' : 'none'))
const toggleAllVisible = () => {
  const target = !(selectAllState.value === 'all')
  const next = { ...(empSelection.value || {}) }
  for (const it of filteredRows.value) next[String(it.id)] = target
  empSelection.value = next
}

onMounted(() => {
  loadEmployees(true)
})
// In keep-alive scenarios or when navigating back to this card, ensure data is present
onActivated(() => {
  if (!employees.value.length && !employeesLoading.value) {
    loadEmployees(true)
  }
})

onDeactivated(() => {
  // Avoid getting stuck in a "refreshing" state when navigating away mid-refresh
  employeesLoading.value = false
  employeesRefreshing.value = false
})

// Also reload when route changes to this page (client-side tab/section switches)
const route = useRoute()
watch(() => route.fullPath, () => {
  if (!employees.value.length && !employeesLoading.value) {
    loadEmployees(true)
  }
})
</script>

<template>
  <div class="space-y-4">
    <!-- Create employee view -->
    <template v-if="creating">
      <UPageCard
        variant="soft"
        class="bg-white rounded-lg"
        :ui="{ header: 'mb-0' }"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <UButton
              icon="i-lucide-arrow-left"
              variant="ghost"
              color="neutral"
              @click="cancelCreate"
            />
            <div class="text-base font-semibold">
              Thêm mới tài khoản nhân viên
            </div>
          </div>
        </template>
        <div class="-mx-6 px-6 pt-0 border-t-1 border-gray-200 dark:border-gray-700">
          <div class="text-lg font-semibold pt-3 mb-2">
            Thông tin tài khoản
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ</label>
              <input
                v-model="form.lastName"
                type="text"
                placeholder="Nhập họ"
                class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên<span class="text-red-500">*</span></label>
              <input
                ref="firstNameRef"
                v-model="form.firstName"
                type="text"
                placeholder="Nhập tên"
                class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email<span class="text-red-500">*</span></label>
              <input
                v-model="form.email"
                type="email"
                placeholder="Nhập email"
                class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Điện thoại<span class="text-red-500">*</span></label>
              <input
                v-model="form.phone"
                type="tel"
                placeholder="Nhập số điện thoại"
                class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
            </div>
          </div>

          <div class="-mx-6 px-6 pt-0">
            <UCheckbox
              v-model="form.notify"
              label="Gửi thông báo của cửa hàng qua email cho tài khoản"
            />
          </div>
        </div>
      </UPageCard>

      <div class="w-full flex justify-end mt-6">
        <UButton
          color="primary"
          variant="solid"
          label="Gửi lời mời"
          @click="submitInvite"
        />
      </div>
    </template>

    <!-- Assign permissions view -->
    <template v-else-if="assigning && selected">
      <UPageCard
        variant="soft"
        class="bg-white rounded-lg"
        :ui="{ header: 'mb-0' }"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <UButton
              icon="i-lucide-arrow-left"
              variant="ghost"
              color="neutral"
              @click="closeAssign"
            />
            <div class="text-base font-semibold truncate">
              Phân quyền cho "{{ selected?.fullName || selected?.email || 'Nhân viên' }}"
            </div>
          </div>
        </template>

        <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chi nhánh phân quyền<span class="text-red-500">*</span></label>
              <select
                v-model="selectedBranch"
                class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="" disabled>
                  Chọn chi nhánh
                </option>
                <option value="main">
                  Chi nhánh chính
                </option>
                <option value="branch-1">
                  Chi nhánh 1
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chọn vai trò</label>
              <select
                v-model="selectedRole"
                class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="" disabled>
                  Chọn vai trò
                </option>
                <option value="viewer">
                  Xem
                </option>
                <option value="editor">
                  Chỉnh sửa
                </option>
                <option value="admin">
                  Quản trị
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-2">
            <div class="text-lg font-semibold">
              Quyền quản trị
            </div>
            <div class="text-sm">
              <UButton
                variant="link"
                color="primary"
                label="Chọn tất cả"
                @click="selectAll"
              />
              <span class="mx-1">•</span>
              <UButton
                variant="link"
                color="primary"
                label="Mở tất cả"
                @click="openAll"
              />
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="g in permissionGroups"
              :key="g.key"
              class="border border-gray-200 rounded-md"
            >
              <div class="flex items-center justify-between gap-3 px-3 h-12">
                <div class="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    role="checkbox"
                    :aria-checked="isGroupChecked(g) ? 'true' : (isGroupIndeterminate(g) ? 'mixed' : 'false')"
                    :class="[
                      'inline-flex items-center justify-center h-5 w-5 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-1',
                      isGroupChecked(g) || isGroupIndeterminate(g)
                        ? 'bg-[#1b64f2] border-[#1b64f2] text-white focus:ring-blue-400'
                        : 'bg-white border-gray-300 text-gray-400 focus:ring-blue-400'
                    ]"
                    @click="toggleGroup(g)"
                  >
                    <svg
                      v-if="isGroupChecked(g)"
                      class="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <svg
                      v-else-if="isGroupIndeterminate(g)"
                      class="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                    >
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <div class="truncate font-medium">
                    {{ g.title }}
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-50 text-gray-700 border border-gray-200">
                    {{ groupSelectedCount(g) }}/{{ g.children.length }}
                  </span>
                  <button
                    type="button"
                    class="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
                    @click="expandedGroups[g.key] = !expandedGroups[g.key]"
                  >
                    <UIcon :name="expandedGroups[g.key] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" />
                  </button>
                </div>
              </div>

              <div v-if="expandedGroups[g.key]" class="px-3 pb-3 pt-0">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  <label
                    v-for="c in g.children"
                    :key="c.key"
                    class="flex items-center gap-3 py-1"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      :aria-checked="selectedPerms[c.key] ? 'true' : 'false'"
                      :class="[
                        'inline-flex items-center justify-center h-5 w-5 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-1',
                        selectedPerms[c.key]
                          ? 'bg-[#1b64f2] border-[#1b64f2] text-white focus:ring-blue-400'
                          : 'bg-white border-gray-300 text-gray-400 focus:ring-blue-400'
                      ]"
                      @click.prevent="toggleChild(c.key)"
                    >
                      <svg
                        v-if="selectedPerms[c.key]"
                        class="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <span class="text-sm">{{ c.title }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UPageCard>
    </template>

    <!-- Employee detail view -->
    <template v-else-if="selected">
      <UPageCard
        variant="soft"
        class="bg-white rounded-lg"
        :ui="{ header: 'mb-0' }"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <UButton
              icon="i-lucide-arrow-left"
              variant="ghost"
              color="neutral"
              @click="closeDetail"
            />
            <div class="text-base font-semibold truncate">
              {{ selected?.fullName || selected?.email || 'Chi tiết nhân viên' }}
            </div>
          </div>
        </template>

        <div
          v-if="selected && selected.isActive === false"
          class="-mx-6 px-6 py-3 border-y border-gray-200/80 bg-blue-50 text-blue-900 flex items-start gap-3"
        >
          <UIcon name="i-lucide-info" class="mt-0.5 size-5 text-blue-500" />
          <div class="text-sm">
            <div class="font-medium">
              Yêu cầu tham gia cửa hàng đã được gửi tới số điện thoại {{ (selected as any).phone || '—' }}
            </div>
            <div>
              Vui lòng thông báo nhân viên <span class="font-medium">{{ selected?.fullName || selected?.email || 'nhân viên' }}</span> kiểm tra tin nhắn và xác nhận để truy cập cửa hàng
            </div>
          </div>
        </div>

        <div class="-mx-6 px-6 pt-0 border-t-1 border-gray-200 dark:border-gray-700">
          <div class="text-lg font-semibold pt-3 mb-2">
            Thông tin tài khoản
          </div>

          <div class="flex items-center justify-between gap-3 p-3 border border-dashed border-gray-200 rounded-md bg-white">
            <div class="flex items-center gap-3 min-w-0">
              <div class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <UIcon name="i-lucide-user" class="size-5 text-gray-500" />
              </div>
              <div class="min-w-0">
                <div class="text-primary-600 font-medium truncate">
                  {{ selected?.fullName || selected?.email || '—' }}<span v-if="(selected as any).phone"> - {{ (selected as any).phone }}</span>
                </div>
                <div class="text-sm text-gray-500 truncate">
                  {{ selected?.email || '—' }}
                </div>
              </div>
            </div>
            <UButton
              v-if="selected && selected.isActive === false"
              color="neutral"
              variant="soft"
              size="sm"
              label="Chờ xác nhận tham gia"
            />
          </div>
        </div>

        <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-2">
            <div class="text-lg font-semibold">
              Quyền quản trị
            </div>
            <UButton
              color="primary"
              variant="link"
              label="Phân quyền cho tài khoản"
              @click="openAssign"
            />
          </div>
          <div class="text-sm text-gray-600">
            Nhân viên chưa có quyền quản trị tại chi nhánh nào
          </div>
        </div>
      </UPageCard>

      <div class="w-full flex justify-end gap-3 mt-6">
        <UButton color="error" variant="soft" label="Xóa tài khoản" />
        <UButton color="error" variant="solid" label="Ngừng kích hoạt" />
      </div>
    </template>

    <template v-else>
      <!-- Tổng quan tài khoản -->
      <UPageCard title="Tổng quan tài khoản" variant="soft" class="bg-white rounded-lg">
        <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
          <div class="space-y-2">
            <div class="w-full bg-gray-200 rounded h-2 overflow-hidden">
              <div
                class="h-2 bg-primary-600 rounded"
                :style="{ width: percent + '%' }"
              />
            </div>
            <div class="text-sm text-gray-600">
              <div>
                Tài khoản đang kích hoạt <span class="font-medium">{{ active }}</span>
              </div>
              <div>
                Tài khoản được kích hoạt tối đa <span class="font-medium">{{ max }}</span>
              </div>
            </div>
          </div>
        </div>
      </UPageCard>

      <!-- Tài khoản chủ cửa hàng -->
      <UPageCard title="Tài khoản chủ cửa hàng" variant="soft" class="bg-white rounded-lg">
        <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  class="w-5 h-5 text-gray-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="7" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              </div>
              <div class="min-w-0">
                <div class="text-primary-600 font-medium truncate">
                  {{ owner }}
                </div>
                <div class="text-sm text-gray-500 truncate">
                  {{ last }}
                </div>
              </div>
            </div>
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              Đang kích hoạt
            </span>
          </div>
        </div>
      </UPageCard>

      <!-- Tài khoản nhân viên -->
      <UPageCard variant="soft" class="bg-white rounded-lg">
        <div class="-mx-6 px-6">
          <BaseCardHeader>
            Tài khoản nhân viên
            <template #actions>
              <UButton
                icon="i-lucide-plus-circle"
                color="primary"
                variant="soft"
                size="sm"
                label="Thêm mới nhân viên"
                @click="startCreate"
              />
            </template>
          </BaseCardHeader>
        </div>

        <div class="-mx-6 px-6 pt-0">
          <!-- Align with card inner padding like the sample -->
          <div class="w-full mb-3">
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <UIcon name="i-lucide-search" class="size-4" />
              </span>
              <input
                v-model="empQ"
                type="text"
                placeholder="Tìm kiếm nhân viên"
                class="w-full pl-9 pr-3 h-[36px] text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
            </div>
          </div>
        </div>
        <div class="-mx-6">
          <div class="relative px-6 overflow-x-hidden">
            <div class="absolute top-0 left-0 right-0 h-12 bg-gray-50 -mx-6 z-0" />
            <table class="w-full table-fixed text-sm relative z-10">
              <colgroup>
                <col class="w-14">
                <col>
                <col class="w-[160px]">
              </colgroup>
              <thead class="text-gray-800">
                <tr class="h-12">
                  <th class="py-0">
                    <div class="w-14 h-full flex items-center justify-start">
                      <button
                        type="button"
                        role="checkbox"
                        :aria-checked="selectAllState==='all' ? 'true' : (selectAllState==='some' ? 'mixed' : 'false')"
                        :class="[
                          'inline-flex items-center justify-center h-5 w-5 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-1',
                          selectAllState==='none'
                            ? 'bg-white border-gray-300 text-gray-400 focus:ring-blue-400'
                            : 'bg-[#1b64f2] border-[#1b64f2] text-white focus:ring-blue-400'
                        ]"
                        @click="toggleAllVisible"
                      >
                        <svg
                          v-if="selectAllState==='all'"
                          class="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="3"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <svg
                          v-else-if="selectAllState==='some'"
                          class="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="3"
                          stroke-linecap="round"
                        >
                          <path d="M5 12h14" />
                        </svg>
                      </button>
                    </div>
                  </th>
                  <th class="py-3 text-left font-medium">
                    Tài khoản
                  </th>
                  <th class="py-3 text-right font-medium pr-0">
                    Trạng thái
                  </th>
                </tr>
              </thead>

              <tbody v-if="employeesLoading">
                <tr v-for="n in 5" :key="'sk-'+n" class="border-t border-gray-200">
                  <td class="py-4">
                    <div class="w-14 h-full flex items-center">
                      <div class="h-5 w-5 rounded-md bg-gray-200 animate-pulse" />
                    </div>
                  </td>
                  <td class="py-4">
                    <div class="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
                  </td>
                  <td class="py-4 text-right pr-0">
                    <div class="h-4 w-1/3 ml-auto rounded bg-gray-200 animate-pulse" />
                  </td>
                </tr>
              </tbody>

              <tbody v-else>
                <tr
                  v-for="item in filteredRows"
                  :key="String(item.id)"
                  :class="{ 'bg-primary-50/30': isSelected(String(item.id)) }"
                  class="border-t border-gray-200 cursor-pointer"
                  @click="openDetailById(item.id)"
                >
                  <td class="py-4 align-middle">
                    <div class="w-14 h-full flex items-center justify-start">
                      <button
                        v-if="String(item.id) !== 'summary'"
                        type="button"
                        role="checkbox"
                        :aria-checked="isSelected(String(item.id)) ? 'true' : 'false'"
                        :class="[
                          'inline-flex items-center justify-center h-5 w-5 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-1',
                          isSelected(String(item.id))
                            ? 'bg-[#1b64f2] border-[#1b64f2] text-white focus:ring-blue-400'
                            : 'bg-white border-gray-300 text-gray-400 focus:ring-blue-400'
                        ]"
                        @click.stop="setRowSelected(String(item.id), !isSelected(String(item.id)))"
                      >
                        <svg
                          v-if="isSelected(String(item.id))"
                          class="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="3"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td class="py-4">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                        <UIcon name="i-lucide-user" class="size-4 text-gray-500" />
                      </div>
                      <div class="min-w-0">
                        <div class="font-medium truncate text-primary-600 hover:underline">
                          {{ item.name }}
                        </div>
                        <div class="text-xs text-gray-500 truncate">
                          {{ item.email || 'Chưa bao giờ đăng nhập' }}
                          <span v-if="item.department"> • {{ item.department }}</span>
                          <span v-if="item.position"> • {{ item.position }}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 text-right">
                    <div class="flex items-center justify-end gap-3">
                      <UBadge :color="item.isActive ? 'success' : 'neutral'" variant="soft" size="sm">
                        {{ item.isActive ? 'Đang kích hoạt' : 'Ngừng kích hoạt' }}
                      </UBadge>
                      <span class="text-xs text-gray-500">{{ item.createdOn ? new Date(String(item.createdOn)).toLocaleDateString('vi-VN') : '' }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="!employeesLoading && filteredRows.length === 0" class="py-10 text-center">
              <div class="text-sm text-gray-600 mb-2">
                Chưa có nhân viên
              </div>
              <UButton
                color="primary"
                variant="solid"
                label="Thêm mới nhân viên"
                @click="startCreate"
              />
            </div>
          </div>
        </div>
        <div v-if="employeesRefreshing" class="py-2 text-xs text-gray-500 text-center">
          Đang cập nhật...
        </div>
      </UPageCard>

      <div class="text-center text-sm text-gray-600">
        Tìm hiểu thêm về
        <UButton
          to="#"
          variant="link"
          color="primary"
          label="quản lý nhân viên"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.bg-primary-600{ background-color: #1b64f2; }
</style>
