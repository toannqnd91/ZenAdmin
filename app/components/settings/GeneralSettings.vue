<script setup lang="ts">
const state = reactive({
  // Thông tin cửa hàng
  logo: '' as string,
  storeName: '',
  businessName: '',
  phone: '',
  address: '',
  country: 'Vietnam',
  province: '',
  adminEmail: '',
  notifyEmail: '',
  // Tiêu chuẩn & định dạng
  timezone: '(UTC+07:00) Bangkok, Hanoi, Jakarta',
  weightUnit: 'Gram (g)',
  currency: 'Việt Nam đồng (VND)',
  // Định dạng mã đơn hàng
  orderPrefix: '#',
  orderSuffix: '',
  // Quản lý kho
  warehouseMode: 'simple' as 'simple' | 'full',
  costMode: 'fixed' as 'fixed' | 'auto' | 'weighted',
  lotSelect: 'manual' as 'manual' | 'auto'
})

// Simple dropzone logic
const isOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const onDrop = (e: DragEvent) => {
  e.preventDefault()
  isOver.value = false
  const files = e.dataTransfer?.files
  if (files && files.length) {
    const file = files[0]
    state.logo = URL.createObjectURL(file)
  }
}
const onChooseFile = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) state.logo = URL.createObjectURL(file)
}
const chooseFromDevice = () => fileInput.value?.click()

const save = () => {
  // TODO: Call API to persist settings
  console.log('Saved settings', JSON.parse(JSON.stringify(state)))
}
</script>

<template>
  <div class="space-y-4">
    <!-- Thông tin cửa hàng -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">
          Thông tin cửa hàng
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Logo uploader -->
        <div>
          <label class="block text-sm font-medium mb-2">Logo</label>
          <div
            :class="[
              'border-2 border-dashed rounded-md bg-white text-center p-4 md:p-6 select-none',
              isOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
            ]"
            @dragover.prevent="isOver = true"
            @dragleave.prevent="isOver = false"
            @drop="onDrop"
          >
            <div v-if="state.logo" class="flex items-center justify-center">
              <img :src="state.logo" alt="logo preview" class="h-24 w-24 object-contain" />
            </div>
            <div v-else>
              <p class="text-sm text-gray-600">
                Kéo thả hoặc <button type="button" class="text-primary-600 hover:underline">thêm ảnh từ URL</button>
              </p>
              <button type="button" class="mt-1 text-sm font-medium text-primary-600 hover:underline" @click="chooseFromDevice">
                Tải ảnh lên từ thiết bị
              </button>
              <p class="text-xs text-gray-500 mt-1">
                Dung lượng ảnh tối đa 2MB
              </p>
            </div>
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onChooseFile">
          </div>
        </div>

        <!-- Right column basic fields -->
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Tên kinh doanh</label>
            <UInput v-model="state.businessName" placeholder="Nhập tên kinh doanh" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Tỉnh/Thành phố</label>
            <UInput v-model="state.province" placeholder="Chọn tỉnh thành" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Email gửi thông báo</label>
            <UInput v-model="state.notifyEmail" placeholder="Nhập email" />
          </div>
        </div>

        <!-- Left column more fields -->
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Tên cửa hàng<span class="text-red-500">*</span></label>
            <UInput v-model="state.storeName" placeholder="Nhập tên cửa hàng" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Quốc gia</label>
            <USelect v-model="state.country" :options="['Vietnam', 'Thailand', 'Singapore']" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Email quản trị <span class="text-gray-400">(i)</span></label>
            <UInput v-model="state.adminEmail" placeholder="Nhập email" />
          </div>
        </div>

        <!-- Full width row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
          <div>
            <label class="block text-sm font-medium mb-1">Điện thoại</label>
            <UInput v-model="state.phone" placeholder="Nhập số điện thoại" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Địa chỉ</label>
            <UInput v-model="state.address" placeholder="Nhập địa chỉ" />
          </div>
        </div>
      </div>
    </UCard>

    <!-- Tiêu chuẩn & định dạng -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">
          Tiêu chuẩn & định dạng
        </h2>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Múi giờ</label>
          <USelect
            v-model="state.timezone"
            :options="['(UTC+07:00) Bangkok, Hanoi, Jakarta', '(UTC+08:00) Singapore']"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Khối lượng mặc định</label>
          <USelect v-model="state.weightUnit" :options="['Gram (g)', 'Kilogram (kg)']" />
        </div>
        <div>
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium mb-1">Tiền tệ</label>
            <NuxtLink to="#" class="text-xs text-primary-600 hover:underline">
              Thay đổi định dạng
            </NuxtLink>
          </div>
          <USelect v-model="state.currency" :options="['Việt Nam đồng (VND)', 'Đô la Mỹ (USD)']" />
        </div>
      </div>
    </UCard>

    <!-- Định dạng mã đơn hàng -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">
          Định dạng mã đơn hàng
        </h2>
      </template>
      <p class="text-sm text-gray-600 mb-3">
        Đơn hàng mặc định bắt đầu là #1001, bạn có thể thay đổi tiền tố hoặc hậu tố gợi ý giống như "BN1001" hoặc "1001-AD"
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Tiền tố</label>
          <UInput v-model="state.orderPrefix" placeholder="#" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Hậu tố</label>
          <UInput v-model="state.orderSuffix" placeholder="Nhập hậu tố" />
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-3">
        Mã đơn hàng sẽ được áp dụng: #1001, #1002, ...
      </p>
    </UCard>

    <!-- Cấu hình quản lý kho -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">
          Cấu hình quản lý kho
        </h2>
      </template>

      <div class="space-y-4">
        <!-- Group 1: Warehouse mode -->
        <div>
          <div class="text-sm font-medium mb-2">
            Lựa chọn quản lý kho phù hợp với quy trình vận hành của cửa hàng
          </div>
          <div class="space-y-2">
            <label class="flex items-start gap-2">
              <input v-model="state.warehouseMode" type="radio" value="simple" class="mt-1">
              <div>
                <div class="font-medium">Quản lý kho đơn giản</div>
              </div>
            </label>
            <label class="flex items-start gap-2">
              <input v-model="state.warehouseMode" type="radio" value="full" class="mt-1">
              <div>
                <div class="font-medium">Quản lý kho đầy đủ</div>
              </div>
            </label>
          </div>
        </div>

        <div class="border-t border-gray-200" />

        <!-- Group 2: Cost price mode -->
        <div>
          <div class="text-sm font-medium mb-2">
            Cài đặt giá vốn cố định hoặc tự động tính lại giá vốn khi nhập hàng vào kho
          </div>
          <div class="space-y-2">
            <label class="flex items-start gap-2">
              <input v-model="state.costMode" type="radio" value="fixed" class="mt-1">
              <div>
                <div class="font-medium">Giá vốn cố định</div>
              </div>
            </label>
            <label class="flex items-start gap-2">
              <input v-model="state.costMode" type="radio" value="auto" class="mt-1">
              <div>
                <div class="font-medium">Tự động tính lại giá vốn khi nhập</div>
              </div>
            </label>
            <label class="flex items-start gap-2">
              <input v-model="state.costMode" type="radio" value="weighted" class="mt-1">
              <div>
                <div class="font-medium">Giá vốn bình quân gia quyền</div>
              </div>
            </label>
          </div>
        </div>

        <div class="border-t border-gray-200" />

        <!-- Group 3: Lot selection mode -->
        <div>
          <div class="text-sm font-medium mb-2">
            Cài đặt phương thức chọn lô để xuất kho khi bán hàng, chuyển kho, trả hàng nhập
          </div>
          <div class="space-y-2">
            <label class="flex items-start gap-2">
              <input v-model="state.lotSelect" type="radio" value="manual" class="mt-1">
              <div>
                <div class="font-medium">Chọn thủ công</div>
                <div class="text-xs text-gray-500">
                  Cửa hàng chọn lô thủ công khi xuất kho bán hàng, chuyển kho, trả hàng nhập
                </div>
              </div>
            </label>
            <label class="flex items-start gap-2">
              <input v-model="state.lotSelect" type="radio" value="auto" class="mt-1">
              <div>
                <div class="font-medium">Chọn tự động</div>
                <div class="text-xs text-gray-500">
                  Hệ thống tự động chọn lô xuất kho theo quy tắc FEFO (gần hết hạn trước) khi xuất kho bán hàng, chuyển kho, trả hàng nhập
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </UCard>

    <div class="flex justify-end">
      <UButton color="primary" @click="save">
        Lưu
      </UButton>
    </div>
  </div>
</template>
