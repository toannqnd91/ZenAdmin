<script setup lang="ts">
const props = defineProps<{
  activeCount?: number
  maxCount?: number
}>()

const active = computed(() => props.activeCount ?? 1)
const max = computed(() => props.maxCount ?? 3)
const percent = computed(() => Math.min(100, Math.round((active.value / Math.max(1, max.value)) * 100)))
</script>

<template>
  <div class="space-y-4">
    <!-- Tổng quan chi nhánh -->
    <UPageCard variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6">
        <BaseCardHeader>
          Tổng quan chi nhánh
          <template #actions>
            <UButton
              icon="i-lucide-plus-circle"
              color="primary"
              variant="soft"
              size="sm"
              label="Thêm mới chi nhánh"
            />
          </template>
        </BaseCardHeader>
      </div>
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-3">
        <div class="w-full bg-gray-200 rounded h-2 overflow-hidden">
          <div
            class="h-2 bg-primary-600 rounded"
            :style="{ width: percent + '%' }"
          />
        </div>
        <div class="text-sm text-gray-700 grid grid-cols-2 gap-2">
          <div class="flex items-center justify-between">
            <span>Chi nhánh quản lý kho đang hoạt động</span>
            <span class="font-medium">{{ active }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>Chi nhánh quản lý kho được hoạt động tối đa</span>
            <span class="font-medium">{{ max }}</span>
          </div>
        </div>

        <div class="rounded-md bg-blue-50 border border-blue-200">
          <div class="px-4 py-3 flex items-start gap-3 text-sm">
            <div class="text-blue-600 mt-0.5">
              <UIcon name="i-lucide-info" />
            </div>
            <div class="text-blue-700">
              <div class="font-medium">
                Bạn đang có {{ active }} chi nhánh quản lý kho được hoạt động tối đa!
              </div>
              <div class="text-blue-700/90">
                Hãy quản lý số lượng chi nhánh có quản lý kho của bạn bằng cách ngừng hoạt động các chi nhánh sẵn có
                hoặc liên hệ tổng đài <span class="font-semibold">1900 6750</span> mua thêm chi nhánh
              </div>
            </div>
          </div>
        </div>
      </div>
    </UPageCard>

    <!-- Danh sách chi nhánh -->
    <UPageCard title="Danh sách chi nhánh" variant="soft" class="bg-white rounded-lg">
      <template #header-actions>
        <UButton
          icon="i-lucide-grid"
          color="neutral"
          variant="ghost"
          label="Cài đặt chi nhánh nhận đơn online"
          class="text-sm"
        />
      </template>
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="py-3">
          <div class="flex items-start gap-3">
            <div class="mt-1">
              <div class="h-9 w-9 rounded-md bg-gray-100 flex items-center justify-center text-gray-500">
                <UIcon name="i-lucide-map-pin" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3">
                <div class="font-medium truncate">
                  Cửa hàng chính
                </div>
                <UDropdown>
                  <UButton
                    color="success"
                    variant="soft"
                    size="xs"
                    label="Đang hoạt động"
                    trailing-icon="i-lucide-chevron-down"
                    class="rounded-full"
                  />
                </UDropdown>
              </div>
              <div class="text-gray-500">
                Vietnam
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UBadge color="neutral" variant="soft">
                Mặc định
              </UBadge>
              <UBadge color="neutral" variant="soft">
                Quản lý kho
              </UBadge>
            </div>
          </div>
          <div class="border-t border-gray-200 mt-3" />
        </div>
      </div>
    </UPageCard>

    <div class="text-center text-sm text-gray-600">
      Tìm hiểu thêm về
      <UButton
        to="#"
        variant="link"
        color="primary"
        label="chi nhánh"
      />
    </div>
  </div>
</template>

<style scoped>
.bg-primary-600{ background-color: #1b64f2; }
</style>
