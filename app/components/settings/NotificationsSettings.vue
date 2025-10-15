<script setup lang="ts">
const state = reactive({
  // Orders
  orderCompleted: true,
  orderPaymentSuccess: true,
  orderConfirmed: true,
  orderEdited: true,
  orderCancelled: true,
  orderNew: true,
  orderRefundConfirmed: true,
  // Shipping
  shipmentConfirmed: false,
  // Customers
  customerActivate: false,
  customerResetPassword: false,
  customerRegisterSuccess: false,

  // Browser notification card
  browserOrderNotification: false,
  // Comments card
  commentNotification: false
})
</script>

<template>
  <div class="space-y-4">
    <UPageCard variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6">
        <BaseCardHeader>
          Nội dung email
          <template #actions>
            <NuxtLink to="#" class="text-primary-600 hover:underline flex items-center gap-1 text-sm">
              <UIcon name="i-lucide-pencil" class="w-4 h-4" />
              Tùy chỉnh mẫu email
            </NuxtLink>
          </template>
        </BaseCardHeader>
      </div>
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-600 mb-3">
          Những email này được gửi tự động tới bạn hoặc khách hàng. Click vào tên mẫu email để chỉnh sửa.
        </div>

        <!-- Groups container -->
        <div class="space-y-4">
          <!-- Group: Orders -->
          <div class="rounded-md border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 px-4 py-2 text-sm font-medium">
              Đơn hàng
            </div>
            <ul class="divide-y divide-gray-200">
              <li class="flex items-center gap-4 px-4 py-3">
                <NuxtLink to="#" class="text-primary-600 hover:underline">Hoàn tất đơn hàng</NuxtLink>
                <div class="text-gray-600 text-sm flex-1">
                  Gửi đến những khách hàng đang đặt hàng nhưng chưa hoàn thành việc tạo đơn hàng
                </div>
                <USwitch v-model="state.orderCompleted" disabled color="neutral" />
              </li>
              <li class="flex items-center gap-4 px-4 py-3">
                <NuxtLink to="#" class="text-primary-600 hover:underline">Thông báo thanh toán đơn hàng thành công</NuxtLink>
                <div class="text-gray-600 text-sm flex-1">
                  Được gửi khi đơn hàng chuyển trạng thái thanh toán
                </div>
                <USwitch v-model="state.orderPaymentSuccess" />
              </li>
              <li class="flex items-center gap-4 px-4 py-3">
                <NuxtLink to="#" class="text-primary-600 hover:underline">Xác nhận đơn hàng</NuxtLink>
                <div class="text-gray-600 text-sm flex-1">
                  Được gửi khi khách hàng tạo đơn hàng
                </div>
                <USwitch v-model="state.orderConfirmed" />
              </li>
              <li class="flex items-center gap-4 px-4 py-3">
                <NuxtLink to="#" class="text-primary-600 hover:underline">Sửa đơn hàng</NuxtLink>
                <div class="text-gray-600 text-sm flex-1">
                  Được gửi khi quản trị sửa đơn hàng
                </div>
                <USwitch v-model="state.orderEdited" />
              </li>
              <li class="flex items-center gap-4 px-4 py-3">
                <NuxtLink to="#" class="text-primary-600 hover:underline">Thông báo khi hủy đơn hàng trong trang quản trị</NuxtLink>
                <div class="text-gray-600 text-sm flex-1">
                  Được gửi khi quản trị hủy đơn hàng
                </div>
                <USwitch v-model="state.orderCancelled" />
              </li>
              <li class="flex items-center gap-4 px-4 py-3">
                <NuxtLink to="#" class="text-primary-600 hover:underline">Thông báo đơn hàng mới</NuxtLink>
                <div class="text-gray-600 text-sm flex-1">
                  Được gửi đến những người đã đăng ký khi có đơn hàng mới
                </div>
                <USwitch v-model="state.orderNew" disabled color="neutral" />
              </li>
              <li class="flex items-center gap-4 px-4 py-3">
                <NuxtLink to="#" class="text-primary-600 hover:underline">Xác nhận hoàn trả</NuxtLink>
                <div class="text-gray-600 text-sm flex-1">
                  Được gửi sau khi thực hiện hoàn trả cho khách hàng
                </div>
                <USwitch v-model="state.orderRefundConfirmed" />
              </li>
            </ul>
          </div>

          <!-- Group: Shipping -->
          <div class="rounded-md border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 px-4 py-2 text-sm font-medium">
              Vận chuyển
            </div>
            <ul class="divide-y divide-gray-200">
              <li class="flex items-center gap-4 px-4 py-3">
                <NuxtLink to="#" class="text-primary-600 hover:underline">Xác nhận giao vận</NuxtLink>
                <div class="text-gray-600 text-sm flex-1">
                  Được gửi khi đơn hàng được vận chuyển
                </div>
                <USwitch v-model="state.shipmentConfirmed" />
              </li>
            </ul>
          </div>

          <!-- Group: Customers -->
          <div class="rounded-md border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 px-4 py-2 text-sm font-medium">
              Khách hàng
            </div>
            <ul class="divide-y divide-gray-200">
              <li class="flex items-center gap-4 px-4 py-3">
                <NuxtLink to="#" class="text-primary-600 hover:underline">Kích hoạt tài khoản của khách hàng</NuxtLink>
                <div class="text-gray-600 text-sm flex-1">
                  Được gửi khi tài khoản khách hàng được yêu cầu kích hoạt
                </div>
                <USwitch v-model="state.customerActivate" />
              </li>
              <li class="flex items-center gap-4 px-4 py-3">
                <NuxtLink to="#" class="text-primary-600 hover:underline">Đổi mật khẩu khách hàng</NuxtLink>
                <div class="text-gray-600 text-sm flex-1">
                  Được gửi khi khách hàng yêu cầu đổi mật khẩu
                </div>
                <USwitch v-model="state.customerResetPassword" />
              </li>
              <li class="flex items-center gap-4 px-4 py-3">
                <NuxtLink to="#" class="text-primary-600 hover:underline">Đăng ký tài khoản khách hàng thành công</NuxtLink>
                <div class="text-gray-600 text-sm flex-1">
                  Được gửi đến khách hàng sau khi đăng ký tài khoản thành công trên website
                </div>
                <USwitch v-model="state.customerRegisterSuccess" />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </UPageCard>

    <UPageCard title="Thông báo về đơn hàng" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">
              Thông báo trên trình duyệt
            </div>
            <div class="text-sm text-gray-600">
              Thiết lập này cho phép trình duyệt gửi thông báo khi có đơn hàng mới. Bạn phải cho phép trình duyệt nhận thông báo.
            </div>
          </div>
          <USwitch v-model="state.browserOrderNotification" />
        </div>
      </div>
    </UPageCard>

    <UPageCard title="Thông báo bình luận mới" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600">
            Thiết lập chế độ gửi thông báo qua email khi có bình luận mới
          </div>
          <USwitch v-model="state.commentNotification" />
        </div>
      </div>
    </UPageCard>
  </div>
</template>
