
<script setup lang="ts">
import { ref } from 'vue'
import BaseCardHeader from '~/components/BaseCardHeader.vue'

const splitLine = ref(false)
</script>

<template>
  <UDashboardPanel id="purchase-order-panel">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <UDashboardSidebarCollapse />
            <div>
              <div class="text-lg font-semibold">
                Tạo đơn nhập hàng
              </div>
            </div>
          </div>
        </template>
        <template #right>
          <!-- Có thể thêm nút hoặc trạng thái ở đây nếu cần -->
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="w-full max-w-6xl mx-auto px-4 lg:px-6">
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Cột trái -->
          <div class="flex-1 space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>
                  Sản phẩm
                  <template #actions>
                    <CustomCheckbox
                      v-model="splitLine"
                      class="text-sm font-normal"
                    >
                      Tách dòng
                    </CustomCheckbox>
                  </template>
                </BaseCardHeader>
                <div class="flex items-center gap-2 mb-4">
                  <div class="flex-1 relative">
                    <input
                      type="text"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Tìm theo tên, mã SKU, quét mã Barcode... (F3)"
                    >
                  </div>
                  <button class="h-9 px-4 rounded-md border border-gray-300 bg-gray-50 text-sm font-medium hover:bg-gray-100">
                    Chọn nhiều
                  </button>
                </div>
                <div class="flex flex-col items-center justify-center py-10">
                  <img src="/no-image.svg" class="w-20 h-20 mb-3 opacity-60" alt="empty">
                  <div class="text-gray-500 mb-3">
                    Bạn chưa thêm sản phẩm nào
                  </div>
                  <button class="px-4 h-9 rounded-md bg-primary-600 text-white font-medium hover:bg-primary-700 transition">
                    Thêm sản phẩm
                  </button>
                </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Thanh toán</BaseCardHeader>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span>Tổng tiền</span>
                    <span>0₫</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Thêm giảm giá (F6)</span>
                    <span>0₫</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Chi phí nhập hàng (F7)</span>
                    <span>0₫</span>
                  </div>
                  <div class="flex justify-between font-semibold">
                    <span>Tiền cần trả NCC</span>
                    <span>0₫</span>
                  </div>
                </div>
            </UPageCard>
          </div>
          <!-- Cột phải -->
          <div class="w-full lg:w-80 space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Nhà cung cấp</BaseCardHeader>
              <div class="-mx-6 px-6">
                <input
                  type="text"
                  class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tìm theo tên, SDT, mã NCC...(F4)"
                >
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Chi nhánh nhập</BaseCardHeader>
              <div class="-mx-6 px-6">
                <select class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>Tên chi nhánh 1</option>
                  <option>Chi nhánh 2</option>
                </select>
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Thông tin bổ sung</BaseCardHeader>
              <div class="-mx-6 px-6">
                <div class="mb-2">
                  <label class="block text-sm mb-1">Nhân viên phụ trách</label>
                  <select class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>Phạm Văn Toàn</option>
                    <option>Nguyễn Văn B</option>
                  </select>
                </div>
                <div class="mb-2">
                  <label class="block text-sm mb-1">Ngày nhập dự kiến</label>
                  <input type="date" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
                <div class="mb-2">
                  <label class="block text-sm mb-1">Mã đơn nhập</label>
                  <input type="text" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nhập mã đơn">
                </div>
                <div>
                  <label class="block text-sm mb-1">Tham chiếu</label>
                  <input type="text" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nhập mã tham chiếu">
                </div>
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Ghi chú</BaseCardHeader>
              <div class="-mx-6 px-6">
                <textarea
                  class="w-full px-3 py-2.5 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows="2"
                  placeholder="VD: Chỉ nhận hàng trong giờ hành chính"
                />
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Tag
                <template #actions>
                  <a href="#" class="text-primary-600 text-sm font-medium">Danh sách tag</a>
                </template>
              </BaseCardHeader>
              <div class="-mx-6 px-6">
                <input
                  type="text"
                  class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tìm kiếm hoặc thêm mới tag"
                >
              </div>
            </UPageCard>
          </div>
        </div>
        <div class="flex justify-end mt-8 mb-8">
          <UButton
            label="Tạo đơn nhập hàng"
            color="primary"
            size="lg"
            class="px-8 py-2 text-lg font-semibold rounded-md shadow"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
