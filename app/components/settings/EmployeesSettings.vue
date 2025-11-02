<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import BaseTable from '@/components/base/BaseTable.vue'
import { identityService } from '@/services/identity.service'
import { employeesService } from '@/services/employees.service'
import type { EmployeeItem } from '@/services/employees.service'

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

// Employees list (cache-first)
const employees = ref<EmployeeItem[]>([])
const employeesLoading = ref(false)
const employeesRefreshing = ref(false)
const empQ = ref('')
const empSelection = ref<Record<string, boolean>>({})
const empColumns = [
  { key: 'accountText', label: 'Tài khoản' },
  { key: 'statusText', label: 'Trạng thái', align: 'right' as const }
]
const employeeRows = computed(() => {
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
      email: e.email,
      department: e.department,
      position: e.position,
      isActive: e.isActive,
      createdOn: e.createdOn
    }
  })
})

async function loadEmployees() {
  employeesLoading.value = true
  const res = await employeesService.getEmployeesCached({
    onUpdated: (list) => {
      employees.value = Array.isArray(list) ? list : []
    }
  })
  const list = res.data
  employees.value = Array.isArray(list) ? list : []
  if (res.fromCache) {
    employeesLoading.value = false
    employeesRefreshing.value = true
    res.refreshPromise?.finally(() => {
      employeesRefreshing.value = false
    })
  } else {
    employeesLoading.value = false
    employeesRefreshing.value = false
  }
}

onMounted(loadEmployees)
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

          <div class="mt-4">
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
      <UPageCard variant="soft" class="bg-white rounded-lg" :ui="{ header: 'hidden' }">
        <BaseTable
          v-model:q="empQ"
          v-model:row-selection="empSelection"
          :data="employeeRows"
          :loading="employeesLoading"
          :columns="empColumns"
          :col-widths="['', '160px']"
          :table-min-width="'0'"
          title="Danh sách nhân viên"
          :add-button="{ label: 'Thêm mới nhân viên', handler: startCreate }"
          :search-placeholder="'Tìm kiếm nhân viên'"
          :show-row-actions="false"
          :selectable="true"
          :body-padding="'px-0'"
          :header-padding-x="'px-0'"
          :footer-padding="'pb-4'"
          :empty-title="'Chưa có nhân viên'"
          :empty-description="'Hãy thêm nhân viên đầu tiên cho cửa hàng'"
          empty-action-label="Thêm mới nhân viên"
          @empty-action="startCreate"
        >
          <template #column-accountText="{ item }">
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
          </template>
          <template #column-statusText="{ item }">
            <div class="flex items-center justify-end gap-3">
              <UBadge :color="item.isActive ? 'success' : 'neutral'" variant="soft" size="sm">
                {{ item.isActive ? 'Đang kích hoạt' : 'Ngừng kích hoạt' }}
              </UBadge>
              <span class="text-xs text-gray-500">{{ item.createdOn ? new Date(String(item.createdOn)).toLocaleDateString('vi-VN') : '' }}</span>
            </div>
          </template>
        </BaseTable>
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
