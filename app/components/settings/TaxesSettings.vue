<script setup lang="ts">
const showBanner = ref(true)
const manageTaxInfo = ref(false)
const priceIncludesTax = ref(false)
const taxOnShipping = ref(false)

const importTax = ref(0)
const saleTax = ref(0)
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
            Cập nhật cấu hình thuế linh hoạt
          </div>
          <div class="text-sm">
            Bạn có thể thiết lập riêng mức thuế cho nhập hàng và bán hàng, hỗ trợ chính xác đến 2 chữ số thập phân
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

    <!-- Cấu hình chung -->
    <UPageCard title="Cấu hình chung" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="text-sm font-medium mb-2">
          Quản lý cách cửa hàng của bạn thu thuế và hiển thị thuế
        </div>
        <div class="space-y-3">
          <label class="flex items-start gap-2">
            <input v-model="manageTaxInfo" type="checkbox" class="mt-1">
            <div>
              <div class="text-sm">Quản lý thông tin thuế của cửa hàng</div>
              <div class="text-xs text-gray-500">Áp dụng cho giao dịch tạo từ trang quản trị</div>
            </div>
          </label>

          <label class="flex items-start gap-2">
            <input v-model="priceIncludesTax" type="checkbox" class="mt-1">
            <div>
              <div class="text-sm">Giá đã bao gồm thuế</div>
              <div class="text-xs text-gray-500">Giá bán sản phẩm và phí vận chuyển trong đơn đã bao gồm giá trị thuế.</div>
            </div>
          </label>

          <label class="flex items-start gap-2">
            <input v-model="taxOnShipping" type="checkbox" class="mt-1">
            <div>
              <div class="text-sm">Ghi nhận thuế lên phí vận chuyển</div>
              <div class="text-xs text-gray-500">Tính thuế khi áp dụng phí vận chuyển trong đơn hàng</div>
            </div>
          </label>
        </div>
      </div>
    </UPageCard>

    <!-- Thuế chung -->
    <UPageCard title="Thuế chung" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Thuế nhập hàng<span class="text-red-500">*</span></label>
            <div class="flex">
              <UInput
                v-model="importTax"
                type="number"
                :min="0"
                :max="100"
                :step="0.01"
                class="rounded-e-none"
              >
                <template #trailing>
                  <span class="text-gray-500">%</span>
                </template>
              </UInput>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Thuế bán hàng<span class="text-red-500">*</span></label>
            <div class="flex">
              <UInput
                v-model="saleTax"
                type="number"
                :min="0"
                :max="100"
                :step="0.01"
                class="rounded-e-none"
              >
                <template #trailing>
                  <span class="text-gray-500">%</span>
                </template>
              </UInput>
            </div>
          </div>
        </div>
      </div>
    </UPageCard>

    <!-- Thuế tuỳ chỉnh sản phẩm -->
    <UPageCard title="Thuế tuỳ chỉnh sản phẩm" variant="soft" class="bg-white rounded-lg">
      <template #header-actions>
        <UButton
          icon="i-lucide-plus-circle"
          color="primary"
          variant="soft"
          label="Thêm thuế sản phẩm"
        />
      </template>
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-600">
          Đặt thuế áp dụng riêng cho một số sản phẩm thuộc danh mục được chỉ định.
        </div>
      </div>
    </UPageCard>

    <!-- Thuế vận chuyển -->
    <UPageCard title="Thuế vận chuyển" variant="soft" class="bg-white rounded-lg">
      <template #header-actions>
        <UButton
          icon="i-lucide-plus-circle"
          color="primary"
          variant="soft"
          label="Thêm thuế vận chuyển"
        />
      </template>
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-600">
          Đặt thuế tuỳ áp dụng riêng cho phí vận chuyển
        </div>
      </div>
    </UPageCard>
  </div>
</template>
