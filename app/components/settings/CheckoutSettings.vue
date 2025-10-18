<script setup lang="ts">
const layout = ref<'one' | 'three'>('one')
const account = ref<'disabled' | 'required' | 'optional'>('optional')

// Field requirement states: 'hidden' | 'optional' | 'required'
const fields = reactive({
  phone: 'optional' as 'hidden' | 'optional' | 'required',
  email: 'required' as 'hidden' | 'optional' | 'required',
  address: 'optional' as 'hidden' | 'optional' | 'required',
  district: 'optional' as 'hidden' | 'optional' | 'required',
  ward: 'optional' as 'hidden' | 'optional' | 'required'
})

const allowDifferentShipping = ref(false)

const enableRecaptcha = ref(false)
const language = ref('Tiếng Việt')
</script>

<template>
  <div class="space-y-4">
    <!-- Card: Kiểu hiển thị trang thanh toán -->
    <UPageCard title="Kiểu hiển thị trang thanh toán" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- One-step option -->
          <label
            class="relative border rounded-md p-4 cursor-pointer flex items-start gap-3 min-h-24"
            :class="layout === 'one' ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-300'"
          >
            <input
              v-model="layout"
              type="radio"
              value="one"
              class="mt-1"
            >
            <div class="flex-1">
              <div class="font-medium">
                Thanh toán 1 bước
              </div>
              <div class="mt-2 flex items-center gap-2">
                <div class="flex flex-col items-center gap-1">
                  <span class="size-3 rounded-full bg-primary-500" />
                  <span class="h-5 w-9 rounded border border-gray-300 bg-white" />
                  <span class="size-3 rounded-full bg-gray-300" />
                </div>
                <div class="flex flex-col items-center gap-1">
                  <span class="size-3 rounded-full bg-gray-300" />
                  <span class="h-5 w-9 rounded border border-gray-300 bg-white" />
                  <span class="size-3 rounded-full bg-gray-300" />
                </div>
              </div>
            </div>
          </label>
          <!-- Three-step option -->
          <label
            class="relative border rounded-md p-4 cursor-pointer flex items-start gap-3 min-h-24"
            :class="layout === 'three' ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-300'"
          >
            <input
              v-model="layout"
              type="radio"
              value="three"
              class="mt-1"
            >
            <div class="flex-1">
              <div class="font-medium">
                Thanh toán 3 bước
              </div>
              <div class="mt-2 flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <span class="size-3 rounded-full bg-primary-500" />
                  <span class="h-5 w-9 rounded border border-gray-300 bg-white" />
                </div>
                <div class="flex items-center gap-2">
                  <span class="size-3 rounded-full bg-gray-300" />
                  <span class="h-5 w-9 rounded border border-gray-300 bg-white" />
                </div>
                <div class="flex items-center gap-2">
                  <span class="size-3 rounded-full bg-gray-300" />
                  <span class="h-5 w-9 rounded border border-gray-300 bg-white" />
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>
    </UPageCard>

    <!-- Card: Tài khoản khách hàng -->
    <UPageCard title="Tài khoản khách hàng" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-2">
        <label class="flex items-start gap-2">
          <input
            v-model="account"
            type="radio"
            value="disabled"
            class="mt-1"
          >
          <div>
            Vô hiệu hóa đăng nhập tài khoản
          </div>
        </label>
        <label class="flex items-start gap-2">
          <input
            v-model="account"
            type="radio"
            value="required"
            class="mt-1"
          >
          <div>
            Bắt buộc đăng nhập tài khoản
          </div>
        </label>
        <label class="flex items-start gap-2">
          <input
            v-model="account"
            type="radio"
            value="optional"
            class="mt-1"
          >
          <div>
            Không bắt buộc đăng nhập tài khoản
          </div>
        </label>
      </div>
    </UPageCard>

    <!-- Card: Thông tin thanh toán -->
    <UPageCard title="Thông tin thanh toán" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Phone -->
          <div>
            <div class="text-sm font-medium text-gray-900">
              Số điện thoại
            </div>
            <div class="space-y-1.5">
              <label class="flex items-center gap-2">
                <input
                  v-model="fields.phone"
                  type="radio"
                  value="hidden"
                >
                <span>Ẩn</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="fields.phone"
                  type="radio"
                  value="optional"
                >
                <span>Không bắt buộc</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="fields.phone"
                  type="radio"
                  value="required"
                >
                <span>Bắt buộc</span>
              </label>
            </div>
          </div>
          <!-- Email -->
          <div>
            <div class="text-sm font-medium text-gray-900">
              Email
            </div>
            <div class="space-y-1.5">
              <label class="flex items-center gap-2">
                <input
                  v-model="fields.email"
                  type="radio"
                  value="hidden"
                >
                <span>Ẩn</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="fields.email"
                  type="radio"
                  value="optional"
                >
                <span>Không bắt buộc</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="fields.email"
                  type="radio"
                  value="required"
                >
                <span>Bắt buộc</span>
              </label>
            </div>
          </div>
          <!-- Address -->
          <div>
            <div class="text-sm font-medium text-gray-900">
              Địa chỉ
            </div>
            <div class="space-y-1.5">
              <label class="flex items-center gap-2">
                <input
                  v-model="fields.address"
                  type="radio"
                  value="hidden"
                >
                <span>Ẩn</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="fields.address"
                  type="radio"
                  value="optional"
                >
                <span>Không bắt buộc</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="fields.address"
                  type="radio"
                  value="required"
                >
                <span>Bắt buộc</span>
              </label>
            </div>
          </div>
          <!-- District -->
          <div>
            <div class="text-sm font-medium text-gray-900">
              Quận/Huyện
            </div>
            <div class="space-y-1.5">
              <label class="flex items-center gap-2">
                <input
                  v-model="fields.district"
                  type="radio"
                  value="hidden"
                >
                <span>Ẩn</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="fields.district"
                  type="radio"
                  value="optional"
                >
                <span>Không bắt buộc</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="fields.district"
                  type="radio"
                  value="required"
                >
                <span>Bắt buộc</span>
              </label>
            </div>
          </div>
          <!-- Ward -->
          <div>
            <div class="text-sm font-medium text-gray-900">
              Phường/Xã
            </div>
            <div class="space-y-1.5">
              <label class="flex items-center gap-2">
                <input
                  v-model="fields.ward"
                  type="radio"
                  value="hidden"
                >
                <span>Ẩn</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="fields.ward"
                  type="radio"
                  value="optional"
                >
                <span>Không bắt buộc</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="fields.ward"
                  type="radio"
                  value="required"
                >
                <span>Bắt buộc</span>
              </label>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-200 my-3" />
        <label class="flex items-center gap-2 text-sm">
          <input
            v-model="allowDifferentShipping"
            type="checkbox"
          >
          <span>
            Cho phép khách hàng nhập thông tin nhận hàng khác với thông tin mua hàng.
          </span>
        </label>
      </div>
    </UPageCard>

    <!-- Card: Điều khoản & thông báo thêm -->
    <UPageCard title="Điều khoản sử dụng, bảo mật, hoàn trả, nội dung thông báo thêm" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
        <div>
          <div class="flex items-center justify-between text-sm font-medium mb-1">
            <div class="text-gray-900">
              Chính sách hoàn trả
            </div>
            <UButton color="primary" variant="link" label="Sử dụng nội dung mẫu" />
          </div>
          <UTextarea :rows="5" placeholder="Nhập nội dung" />
        </div>
        <div>
          <div class="flex items-center justify-between text-sm font-medium mb-1">
            <div class="text-gray-900">
              Chính sách bảo mật
            </div>
            <UButton color="primary" variant="link" label="Sử dụng nội dung mẫu" />
          </div>
          <UTextarea :rows="5" placeholder="Nhập nội dung" />
        </div>
        <div>
          <div class="flex items-center justify-between text-sm font-medium mb-1">
            <div class="text-gray-900">
              Điều khoản sử dụng
            </div>
            <UButton color="primary" variant="link" label="Sử dụng nội dung mẫu" />
          </div>
          <UTextarea :rows="5" placeholder="Nhập nội dung" />
        </div>
        <div>
          <div class="flex items-center justify-between text-sm font-medium mb-1">
            <div class="flex items-center gap-1 text-gray-900">
              <span>Nội dung thông báo thêm</span>
              <UTooltip text="Hiển thị đoạn thông báo bổ sung ở trang checkout">
                <UIcon name="i-lucide-info" class="text-gray-400" />
              </UTooltip>
            </div>
          </div>
          <UTextarea :rows="3" placeholder="Nhập nội dung" />
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input
            v-model="enableRecaptcha"
            type="checkbox"
          >
          <span class="flex items-center gap-1">
            <span>Bật Google reCaptcha ở trang thanh toán</span>
            <UTooltip text="Bảo vệ biểu mẫu thanh toán khỏi spam/bot">
              <UIcon name="i-lucide-info" class="text-gray-400" />
            </UTooltip>
          </span>
        </label>
      </div>
    </UPageCard>

    <!-- Card: Nội dung chân trang thanh toán -->
    <UPageCard title="Nội dung chân trang thanh toán" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <UTextarea :rows="3" placeholder="Nhập nội dung" />
        <div class="text-xs text-gray-500 mt-1">
          Nội dung này chỉ hiển thị ở chân trang thanh toán và trang đặt hàng thành công.
        </div>
      </div>
    </UPageCard>

    <!-- Card: Ngôn ngữ trang thanh toán -->
    <UPageCard title="Ngôn ngữ trang thanh toán" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">
              Ngôn ngữ đang sử dụng: <span class="font-medium">{{ language }}</span>
            </div>
          </div>
          <UButton
            icon="i-lucide-pen-line"
            color="neutral"
            variant="ghost"
            label="Chỉnh sửa"
          />
        </div>
      </div>
    </UPageCard>

    <div class="flex justify-end">
      <UButton color="primary" variant="solid" label="Lưu" />
    </div>
  </div>
</template>
