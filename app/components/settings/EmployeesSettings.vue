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
</script>

<template>
  <div class="space-y-4">
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
          <div class="w-36 h-36 rounded-full bg-gradient-to-b from-blue-50 to-indigo-50 flex items-center justify-center">
            <svg
              class="w-16 h-16 text-blue-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </div>
          <div class="text-gray-600">
            Cửa hàng của bạn chưa có nhân viên nào
          </div>
          <UButton
            label="Thêm mới nhân viên"
            color="primary"
            variant="solid"
            class="mt-1"
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
  </div>
</template>

<style scoped>
.bg-primary-600{ background-color: #1b64f2; }
</style>
