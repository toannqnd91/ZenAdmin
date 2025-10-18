<script setup lang="ts">
const showBanner = ref(true)
const weightMode = ref<'order' | 'custom'>('order')

const length = ref(10)
const width = ref(10)
const height = ref(10)
const requirement = ref('Cho xem hàng không cho thử')
const note = ref('')
const noteMax = 255

const autoSyncDelivered = ref(false)

const configs = ref([
  {
    branch: '1 Chi nhánh lấy hàng',
    area: '1 Khu vực giao hàng'
  }
])
</script>

<template>
  <div class="space-y-4">
    <!-- Top banner -->
    <div
      v-if="showBanner"
      class="rounded-md border border-blue-200 bg-blue-50 text-blue-800"
    >
      <div class="flex items-start gap-3 px-4 py-3">
        <UIcon name="i-lucide-info" class="mt-0.5 text-blue-600" />
        <div class="flex-1">
          <div class="font-medium">
            Tạo đơn xong - Giao hàng ngay!
          </div>
          <div class="text-sm">
            Hãy cài đặt ứng dụng Giao hàng tự động để tiết kiệm thời gian, chốt đơn nhanh gấp bội
            <NuxtLink to="#" class="text-primary-600">tại đây</NuxtLink>
          </div>
        </div>
        <button
          class="text-blue-700 hover:text-blue-900"
          type="button"
          @click="showBanner = false"
        >
          <UIcon name="i-lucide-x" />
        </button>
      </div>
    </div>

    <!-- Thông tin gói hàng mặc định -->
    <UPageCard title="Thông tin gói hàng mặc định" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
        <div>
          <div class="text-sm font-medium text-gray-900 mb-1">
            Khối lượng
          </div>
          <div class="space-y-1.5">
            <label class="flex items-center gap-2">
              <input v-model="weightMode" type="radio" value="order">
              <span>Theo sản phẩm trong đơn hàng</span>
            </label>
            <label class="flex items-center gap-2">
              <input v-model="weightMode" type="radio" value="custom">
              <span>Tùy chỉnh</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label class="block text-sm font-medium mb-1">Dài</label>
            <div class="flex items-center gap-2">
              <UInput v-model="length" type="number" :min="0" />
              <span class="text-sm text-gray-500">cm</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Rộng</label>
            <div class="flex items-center gap-2">
              <UInput v-model="width" type="number" :min="0" />
              <span class="text-sm text-gray-500">cm</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Cao</label>
            <div class="flex items-center gap-2">
              <UInput v-model="height" type="number" :min="0" />
              <span class="text-sm text-gray-500">cm</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Yêu cầu giao hàng</label>
            <USelect
              v-model="requirement"
              :items="['Cho xem hàng không cho thử', 'Cho xem hàng cho thử', 'Không cho xem hàng']"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Ghi chú</label>
          <UTextarea v-model="note" :rows="3" placeholder="Nhập ghi chú cho gói hàng mặc định" />
          <div class="flex justify-end text-xs text-gray-500 mt-1">
            {{ note.length }}/{{ noteMax }}
          </div>
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-2 text-sm">
            <input v-model="autoSyncDelivered" type="checkbox">
            <span>Tự động đồng bộ trạng thái "Đã hoàn hàng" với đối tác vận chuyển tích hợp</span>
            <UTooltip text="Áp dụng với đơn đẩy vận chuyển">
              <UIcon name="i-lucide-info" class="text-gray-400" />
            </UTooltip>
          </label>
          <div class="flex items-start gap-2 text-sm text-amber-600">
            <UIcon name="i-lucide-alert-triangle" />
            <span>
              Lưu ý: Các thông tin cấu hình sẽ áp dụng cho toàn bộ các đơn đẩy vận chuyển. Bạn có thể thay đổi các thông tin này tại màn hình đẩy đơn
            </span>
          </div>
        </div>
      </div>
    </UPageCard>

    <!-- Cấu hình phí vận chuyển -->
    <UPageCard title="Cấu hình phí vận chuyển" variant="soft" class="bg-white rounded-lg">
      <template #header-actions>
        <UButton
          icon="i-lucide-plus-circle"
          color="primary"
          variant="soft"
          label="Thêm cấu hình"
        />
      </template>
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-600 mb-3">
          Thêm phí giao hàng mới cho các khu vực vận chuyển khác nhau hoặc sử dụng mức phí tạm tính của các đối tác vận chuyển. Xem hướng dẫn cấu hình phí vận chuyển
          <NuxtLink to="#" class="text-primary-600">tại đây</NuxtLink>.
        </div>

        <div
          v-for="c in configs"
          :key="c.branch + c.area"
          class="rounded-md border border-gray-200 p-3 flex items-center justify-between gap-3 mb-3"
        >
          <div class="flex items-center gap-4">
            <UIcon name="i-lucide-arrows-right-left" class="text-gray-500" />
            <div class="flex items-center gap-2 text-sm text-gray-700">
              <span class="inline-flex items-center gap-1">
                <UIcon name="i-lucide-building-2" />
                {{ c.branch }}
              </span>
              <span>→</span>
              <span class="inline-flex items-center gap-1">
                <UIcon name="i-lucide-map-pin" />
                {{ c.area }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UButton icon="i-lucide-pen-line" color="neutral" variant="ghost" />
            <UButton icon="i-lucide-trash-2" color="neutral" variant="ghost" />
          </div>
        </div>
      </div>
    </UPageCard>
  </div>
</template>
