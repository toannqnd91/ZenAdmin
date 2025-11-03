<script setup lang="ts">
import { ref, reactive, computed, onMounted, onActivated, onDeactivated, watch } from 'vue'
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
const form = reactive({ firstName: '', lastName: '', email: '', phone: '', notify: false })
function startCreate() {
  creating.value = true
}
function cancelCreate() {
  creating.value = false
}
function submitInvite() {
  // placeholder action
  // In real app, call API then reset/close
  console.log('Invite employee', { ...form })
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
      <UPageCard variant="soft" class="bg-white rounded-lg" :ui="{ header: 'mb-0' }">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div class="text-lg font-semibold">
              Tài khoản nhân viên
            </div>
            <UButton
              icon="i-lucide-plus"
              variant="link"
              color="primary"
              label="Thêm mới nhân viên"
              @click="startCreate"
            />
          </div>
        </template>
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
                  class="border-t border-gray-200"
                  :class="{ 'bg-primary-50/30': isSelected(String(item.id)) }"
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
                        @click="setRowSelected(String(item.id), !isSelected(String(item.id)))"
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
                        <button class="font-medium truncate text-primary-600 hover:underline">
                          {{ item.name }}
                        </button>
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
