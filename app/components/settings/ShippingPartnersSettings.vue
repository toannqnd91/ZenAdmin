<script setup lang="ts">
const tab = ref<'integrated' | 'self'>('integrated')

interface Partner {
  name: string
  desc: string
  action: 'Kết nối' | 'Đăng ký'
  linkText?: string
}

const partners: Partner[] = [
  { name: 'VIETNAM POST', desc: 'Cung cấp bưu chuyển phát nhanh EMS và chuyển phát bưu kiện', action: 'Kết nối' },
  { name: 'viettel post', desc: 'Dịch vụ nhận gửi, vận chuyển và phát nhanh bằng đường bộ', action: 'Kết nối' },
  { name: 'SPX', desc: 'Giải pháp vận chuyển thông minh, nhanh chóng, an toàn, tiết kiệm', action: 'Kết nối' },
  { name: 'GiaoHangNhanh', desc: 'Giải pháp giao hàng, thu hộ chuyên nghiệp trải dài mọi miền đất nước', action: 'Kết nối' },
  { name: 'J&T EXPRESS', desc: 'Hỗ trợ các hoạt động giao nhận hàng hóa nhanh chóng', action: 'Kết nối' },
  { name: 'BEST EXPRESS', desc: 'Giải pháp vận chuyển thông minh, nhanh chóng, an toàn, tiết kiệm', action: 'Kết nối' },
  { name: 'GHTK', desc: 'Dịch vụ giao hàng thu tiền tận nơi, tốc độ nhanh, phủ sóng toàn quốc', action: 'Kết nối' },
  { name: 'Ahamove', desc: 'Dịch vụ giao hàng nội thành siêu tốc', action: 'Kết nối' },
  { name: 'Grab Express', desc: 'Dịch vụ nhận gửi, vận chuyển và phát nhanh bằng đường bộ', action: 'Đăng ký', linkText: 'Đăng ký xuất hóa đơn (VAT)' },
  { name: 'ninja van', desc: 'Cung cấp dịch vụ giao hàng vượt trội cho các doanh nghiệp', action: 'Kết nối' }
]
</script>

<template>
  <div class="space-y-4">
    <!-- Heading with segment -->
    <UPageCard title="Đối tác vận chuyển" variant="soft" class="bg-white rounded-lg">
      <template #header-actions>
        <div class="inline-flex rounded-md bg-gray-100 p-1">
          <UButton
            :variant="tab === 'integrated' ? 'solid' : 'ghost'"
            color="neutral"
            size="xs"
            label="Đối tác tích hợp"
            @click="tab = 'integrated'"
          />
          <UButton
            :variant="tab === 'self' ? 'solid' : 'ghost'"
            color="neutral"
            size="xs"
            label="Đối tác tự liên hệ"
            @click="tab = 'self'"
          />
        </div>
      </template>
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-600">
          <span>
            Chọn cách kết nối với đối tác vận chuyển phù hợp với mô hình của bạn.
          </span>
        </div>
      </div>
    </UPageCard>

    <template v-if="tab === 'integrated'">
      <!-- Kết nối qua Zen Express -->
      <UPageCard title="Kết nối qua Zen Express" variant="soft" class="bg-white rounded-lg">
        <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex flex-wrap items-center gap-x-5 gap-y-3 py-2">
              <div class="text-xl font-semibold text-green-600">
                Zen Express
              </div>
              <div class="text-sm text-gray-600">
                GiaoHangNhanh
              </div>
              <div class="text-sm text-gray-600">
                BEST
              </div>
              <div class="text-sm text-gray-600">
                ninja van
              </div>
              <div class="text-sm text-gray-600">
                J&T EXPRESS
              </div>
              <div class="text-sm text-gray-600">
                SPX
              </div>
              <div class="text-sm text-gray-600">
                EMS VIETNAM
              </div>
            </div>
            <UButton
              color="primary"
              variant="solid"
              label="Kết nối"
            />
          </div>
          <div class="text-sm text-gray-600">
            <span>
              Tích hợp Sapo Express để sử dụng các đối tác đã kết nối, được hưởng bảng giá, hỗ trợ trực tiếp và đối soát thanh toán.
            </span>
            <NuxtLink to="#" class="text-primary-600 ms-1">
              Xem chính sách
            </NuxtLink>
          </div>
        </div>
      </UPageCard>

      <!-- Kết nối trực tiếp -->
      <UPageCard title="Kết nối trực tiếp với đối tác vận chuyển" variant="soft" class="bg-white rounded-lg">
        <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
          <div class="divide-y divide-gray-200">
            <div
              v-for="p in partners"
              :key="p.name"
              class="flex items-center justify-between py-4"
            >
              <div class="flex items-start gap-4 min-w-0">
                <div class="w-28 shrink-0">
                  <div class="h-8 flex items-center text-gray-800 font-semibold">
                    {{ p.name }}
                  </div>
                </div>
                <div class="min-w-0 text-gray-700">
                  <div class="truncate">
                    {{ p.desc }}
                  </div>
                  <NuxtLink
                    v-if="p.linkText"
                    to="#"
                    class="text-xs text-primary-600"
                  >
                    {{ p.linkText }}
                  </NuxtLink>
                </div>
              </div>
              <div class="shrink-0">
                <UButton
                  :color="p.action === 'Đăng ký' ? 'primary' : 'primary'"
                  :variant="p.action === 'Đăng ký' ? 'soft' : 'solid'"
                  :label="p.action"
                />
              </div>
            </div>
          </div>
        </div>
      </UPageCard>
    </template>

    <template v-else>
      <UPageCard title="Đối tác tự liên hệ" variant="soft" class="bg-white rounded-lg">
        <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600">
            <span>
              Quản lý các đối tác tự liên hệ, thêm ghi chú và hướng dẫn xử lý đơn. (Đang phát triển)
            </span>
          </div>
        </div>
      </UPageCard>
    </template>
  </div>
</template>
