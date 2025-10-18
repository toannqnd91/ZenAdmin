<script setup lang="ts">
const state = reactive({
  flow: 'standard' as 'standard' | 'advanced' | 'pro',
  showAllowBackorderHint: false,
  autoSaveWhenPaidShipped: true,
  autoDeleteRevenueDebt: false,
  autoDeleteRelatedReceipts: false,
  remind: 'never' as 'never' | '1h' | '6h' | '10h' | '24h'
})
</script>

<template>
  <div class="space-y-4">
    <!-- Quy trình xử lý đơn hàng -->
    <UPageCard title="Quy trình xử lý đơn hàng" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
        <label class="flex items-start gap-3">
          <input
            v-model="state.flow"
            type="radio"
            value="standard"
            class="mt-1"
          >
          <div>
            <div class="font-medium">Tiêu chuẩn</div>
            <div class="text-sm text-gray-600">
              Xử lý đơn hàng nhanh chóng, thao tác đơn giản. Lựa chọn tối ưu cho cửa hàng ưu tiên sự gọn nhẹ và hiệu quả vận hành.
            </div>
          </div>
        </label>
        <label class="flex items-start gap-3 opacity-60 cursor-not-allowed">
          <input
            type="radio"
            value="advanced"
            class="mt-1"
            disabled
          >
          <div>
            <div class="font-medium">Nâng cao</div>
            <div class="text-sm text-gray-600">
              Kiểm soát toàn diện từng bước đóng gói và giao hàng. Hỗ trợ xử lý đồng loạt nhiều đơn hàng, giảm thiểu sai sót,
              nâng cao hiệu suất vận hành cho những đơn vị kinh doanh quy mô lớn hoặc cần quy trình quản lý chặt chẽ.
            </div>
          </div>
        </label>
        <label class="flex items-start gap-3 opacity-60 cursor-not-allowed">
          <input
            type="radio"
            value="pro"
            class="mt-1"
            disabled
          >
          <div>
            <div class="font-medium">
              Chuyên nghiệp
              <UBadge color="warning" variant="soft" class="ms-2">Sắp ra mắt</UBadge>
            </div>
            <div class="text-sm text-gray-600">
              Giải pháp được thiết kế để tối ưu hoá quy trình và sử dụng nhân sự hiệu quả hơn, phù hợp cho các nhà bán hàng
              quy mô lớn với 1000 đơn hàng trên mỗi ngày. Quy trình này tập trung vào việc tự động gom đơn theo các quy tắc để tối ưu lộ trình nhật hàng.
              <UButton
                to="#"
                color="primary"
                variant="link"
                label="Tư vấn ngay"
              />
            </div>
          </div>
        </label>
      </div>
    </UPageCard>

    <!-- Cấu hình đơn hàng -->
    <UPageCard title="Cấu hình đơn hàng" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-3">
        <label class="flex items-start gap-3">
          <input
            v-model="state.showAllowBackorderHint"
            type="checkbox"
            class="mt-1"
          >
          <div>
            <div class="font-medium">
              Hiển thị nút "Cho phép bán âm" tại màn tạo đơn hàng
            </div>
            <div class="text-sm text-gray-600">
              Chỉ bật khi cần tạo đơn linh hoạt cho sản phẩm đã hết hàng. Bật lên sẽ cho phép tạo đơn ngay cả khi sản phẩm hết hàng và đang tắt "Cho phép bán âm"
            </div>
          </div>
        </label>
        <label class="flex items-start gap-3">
          <input
            v-model="state.autoSaveWhenPaidShipped"
            type="checkbox"
            class="mt-1"
          >
          <div>
            <div class="font-medium">
              Đơn hàng sẽ được tự động lưu trữ nếu đã thanh toán và giao hàng
            </div>
          </div>
        </label>
      </div>
    </UPageCard>

    <!-- Xử lý dữ liệu khi xoá đơn hàng -->
    <UPageCard title="Xử lý dữ liệu khi xoá đơn hàng" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-3">
        <label class="flex items-start gap-3 opacity-60 cursor-not-allowed">
          <input
            v-model="state.autoDeleteRevenueDebt"
            type="checkbox"
            class="mt-1"
            disabled
          >
          <div>
            <div class="font-medium">
              Tự động xoá dữ liệu trong báo cáo doanh thu và công nợ khách hàng
            </div>
          </div>
        </label>
        <label class="flex items-start gap-3">
          <input
            v-model="state.autoDeleteRelatedReceipts"
            type="checkbox"
            class="mt-1"
          >
          <div>
            <div class="font-medium">
              Tự động xoá dữ liệu giao dịch trong báo cáo thanh toán, phiếu thu, phiếu chi liên quan
            </div>
            <div class="text-sm text-gray-600">
              Không áp dụng tự động với các phiếu thu chi tạo thủ công
            </div>
          </div>
        </label>
      </div>
    </UPageCard>

    <!-- Nhắc nhở thanh toán đơn chưa hoàn tất -->
    <UPageCard title="Nhắc nhở thanh toán đơn chưa hoàn tất" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-2">
        <div class="text-sm text-gray-600">
          Gửi email nhắc hoàn thành đơn hàng cho khách hàng chưa thanh toán
        </div>
        <div class="text-sm text-gray-500">
          Nếu được chọn, thông báo sẽ được gửi tới tất cả khách hàng, gồm những người không đồng ý nhận tiếp thị.
        </div>

        <div class="space-y-2 pt-1">
          <label class="flex items-center gap-3">
            <input
              v-model="state.remind"
              type="radio"
              value="never"
            >
            <span>Không bao giờ</span>
          </label>
          <label class="flex items-center gap-3">
            <input
              v-model="state.remind"
              type="radio"
              value="1h"
            >
            <span>Sau 1 giờ (Khuyên dùng)</span>
          </label>
          <label class="flex items-center gap-3">
            <input
              v-model="state.remind"
              type="radio"
              value="6h"
            >
            <span> Sau 6 giờ</span>
          </label>
          <label class="flex items-center gap-3">
            <input
              v-model="state.remind"
              type="radio"
              value="10h"
            >
            <span> Sau 10 giờ (Khuyên dùng)</span>
          </label>
          <label class="flex items-center gap-3">
            <input
              v-model="state.remind"
              type="radio"
              value="24h"
            >
            <span> Sau 24 giờ</span>
          </label>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

<style scoped>
</style>
