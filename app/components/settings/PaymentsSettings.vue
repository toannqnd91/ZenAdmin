<script setup lang="ts">
const integrated = [
  { name: 'VietQR Pro', desc: 'Giải pháp thanh toán tiện lợi hoàn toàn miễn phí.', action: 'Chọn ngân hàng', actionVariant: 'link', logo: '/icons/payments/vietqr-pro.svg' },
  { name: 'VNPAY QR', desc: 'Tiên phong trong thanh toán QR Code tại Việt Nam.', action: 'Kết nối', logo: '/icons/payments/vnpay-qr.svg' },
  { name: 'MoMo', desc: 'Siêu Ứng Dụng Thanh Toán số 1 Việt Nam', action: 'Kết nối', logo: '/icons/payments/momo.svg' },
  { name: 'KBank', desc: 'Giải pháp chấp nhận thanh toán thẻ và QR thuận tiện, bảo mật', action: 'Kết nối', logo: '/icons/payments/kbank.svg' },
  { name: 'VPBank', desc: 'Giải pháp chấp nhận thanh toán thẻ an toàn, tiện lợi tại quầy.', action: 'Kết nối', logo: '/icons/payments/vpbank.svg' },
  { name: 'VNPAY QR (Online)', desc: 'Giải pháp thanh toán trực tuyến dành cho nhà bán hàng online.', action: 'Kết nối', logo: '/icons/payments/vnpay-online.svg' },
  { name: 'ZaloPay', desc: 'Giải pháp thanh toán trực tuyến cho nhà bán hàng online và offline', action: 'Kết nối', logo: '/icons/payments/zalopay.svg' },
  { name: 'VNPT EPAY', desc: 'Cổng thanh toán trực tuyến (ATM, Visa/master, Momo, Zalo, Viettel Money...)', action: 'Kết nối', badge: 'Miễn phí cài đặt', logo: '/icons/payments/vnpt-epay.svg' },
  { name: 'ECOOPAY', desc: 'Cổng thanh toán trực tuyến (QRcode, ATM, Visa/master, Momo, Zalo, Viettel Money...)', action: 'Kết nối', logo: '/icons/payments/ecoopay.svg' },
  { name: 'AFTEE', desc: 'Giải pháp thanh toán mua trước trả sau an toàn, linh hoạt.', action: 'Kết nối', logo: '/icons/payments/aftee.svg' },
  { name: 'Fundiin', desc: 'Giải pháp thanh toán mua trước trả sau an toàn, linh hoạt.', action: 'Kết nối', logo: '/icons/payments/fundiin.svg' }
]

const manualTransfer = [
  { name: 'Chuyển khoản', status: 'Đang sử dụng', account: '---' }
]

const manualOthers = [
  { name: 'Tiền mặt', status: 'Đang sử dụng', account: 'Không áp dụng' },
  { name: 'Thanh toán thẻ', status: 'Đang sử dụng', account: '---' },
  { name: 'Thu hộ (COD)', status: 'Đang sử dụng', account: 'Không áp dụng' }
]

const defaultMethod = ref('Tiền mặt')
</script>

<template>
  <div class="space-y-4">
    <!-- Phương thức thanh toán tích hợp -->
    <UPageCard title="Phương thức thanh toán" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 pb-1 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="text-sm font-medium mb-3">
          Phương thức thanh toán tích hợp
        </div>
        <div class="divide-y divide-gray-200">
          <div
            v-for="item in integrated"
            :key="item.name"
            class="flex items-center justify-between gap-3 py-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="h-10 w-28 flex items-center justify-center">
                <img :src="item.logo" :alt="item.name" class="max-h-8 object-contain">
              </div>
              <div class="min-w-0">
                <div class="font-medium truncate">
                  {{ item.name }}
                </div>
                <div class="text-sm text-gray-600 truncate">
                  {{ item.desc }}
                </div>
              </div>
              <UBadge v-if="item.badge" color="success" variant="soft">
                {{ item.badge }}
              </UBadge>
            </div>
            <div>
              <UButton
                v-if="item.actionVariant === 'link'"
                :label="item.action"
                color="primary"
                variant="link"
              />
              <UButton
                v-else
                :label="item.action"
                color="primary"
                variant="solid"
              />
            </div>
          </div>
        </div>
      </div>
    </UPageCard>

    <!-- Thủ công: Chuyển khoản -->
    <UPageCard title="Phương thức thanh toán thủ công" variant="soft" class="bg-white rounded-lg">
      <template #header-actions>
        <div class="flex items-center gap-3">
          <UButton
            icon="i-lucide-banknote"
            color="neutral"
            variant="ghost"
            label="Quản lý tài khoản ngân hàng"
            class="text-sm"
          />
          <UButton
            icon="i-lucide-plus-circle"
            color="primary"
            variant="soft"
            label="Thêm phương thức"
            class="text-sm"
          />
        </div>
      </template>
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
        <!-- Chuyển khoản table -->
        <div class="rounded-md border border-gray-200">
          <div class="px-4 py-3 text-sm text-gray-700">
            Cập nhật thông tin tài khoản để thanh toán bằng mã VietQR động dễ dàng hơn.
          </div>
          <div class="border-t border-gray-200" />
          <div class="px-4 py-2 text-sm grid grid-cols-3 gap-3 font-medium text-gray-700">
            <div>Tên phương thức</div>
            <div>Trạng thái</div>
            <div>Tài khoản thụ hưởng</div>
          </div>
          <div class="border-t border-gray-200" />
          <div
            v-for="row in manualTransfer"
            :key="row.name"
            class="px-4 py-3 text-sm grid grid-cols-3 gap-3 items-center"
          >
            <div class="text-gray-900">
              {{ row.name }}
            </div>
            <div>
              <UBadge color="success" variant="soft">
                {{ row.status }}
              </UBadge>
            </div>
            <div class="text-gray-500">
              {{ row.account }}
            </div>
          </div>
        </div>

        <!-- Phương thức khác table -->
        <div class="rounded-md border border-gray-200">
          <div class="px-4 py-3 text-sm text-gray-700">
            Cập nhật phương thức thanh toán để theo dõi sổ quỹ tiền mặt và tài khoản ngân hàng.
          </div>
          <div class="border-t border-gray-200" />
          <div class="px-4 py-2 text-sm grid grid-cols-3 gap-3 font-medium text-gray-700">
            <div>Tên phương thức</div>
            <div>Trạng thái</div>
            <div>Tài khoản thụ hưởng</div>
          </div>
          <div class="border-t border-gray-200" />
          <div
            v-for="row in manualOthers"
            :key="row.name"
            class="px-4 py-3 text-sm grid grid-cols-3 gap-3 items-center"
          >
            <div class="text-gray-900">
              {{ row.name }}
            </div>
            <div>
              <UBadge color="success" variant="soft">
                {{ row.status }}
              </UBadge>
            </div>
            <div class="text-gray-500">
              {{ row.account }}
            </div>
          </div>
        </div>
      </div>
    </UPageCard>

    <!-- Cài đặt khác -->
    <UPageCard title="Cài đặt khác" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-700">
          <div class="font-medium mb-2">
            Thiết lập thanh toán mặc định
          </div>
          <div class="text-gray-600 mb-2">
            Phương thức được ưu tiên sử dụng khi xác nhận thanh toán đơn hàng trên trang quản trị
          </div>
          <div class="max-w-xs">
            <USelect
              v-model="defaultMethod"
              :items="['Tiền mặt', 'Chuyển khoản', 'Thanh toán thẻ', 'Thu hộ (COD)']"
            />
          </div>
          <div class="flex justify-end mt-6">
            <UButton color="primary" variant="solid" label="Lưu" />
          </div>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

<style scoped>
.bg-primary-600{ background-color: #1b64f2; }
</style>
