<script setup lang="ts">
const props = defineProps<{
  ownerName?: string
  lastLogin?: string
  activeCount?: number
  maxCount?: number
}>()

const owner = computed(() => props.ownerName || 'Phạm Văn Toàn')
const last = computed(() => props.lastLogin || 'Đăng nhập lần cuối 12/10/2025 06:45:11')
const active = computed(() => props.activeCount ?? 1)
const max = computed(() => props.maxCount ?? 3)
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

      <!-- Tài khoản nhân viên (empty state) -->
      <UPageCard title="Tài khoản nhân viên" variant="soft" class="bg-white rounded-lg">
        <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
          <div class="py-8 flex flex-col items-center text-center gap-2 text-gray-700">
            <img src="/empty-user-state.svg" alt="" class="w-32 h-32">

            <div class="text-gray-600">
              Cửa hàng của bạn chưa có nhân viên nào
            </div>
            <UButton
              label="Thêm mới nhân viên"
              color="primary"
              variant="solid"
              class="mt-1"
              @click="startCreate"
            />
          </div>
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
