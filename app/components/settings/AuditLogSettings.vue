<script setup lang="ts">
const search = ref('')
const timeFilter = ref<string | undefined>(undefined)
const funcFilter = ref<string | undefined>(undefined)

const timeOptions = ['Tất cả', 'Hôm nay', '7 ngày qua', '30 ngày qua']
const funcOptions = ['Tất cả', 'Sản phẩm', 'Nhập hàng', 'Đặt hàng nhập', 'Kênh bán hàng', 'Menu']

interface LogItem {
  time: string
  category: string
  actor: string
  desc: string
  linkText?: string
  linkHref?: string
}

const groups: Array<{ date: string, items: LogItem[] }> = [
  {
    date: '12 tháng 10, 2025',
    items: [
      { time: '06:48:38', category: 'Nhập hàng', actor: 'Phạm Văn Toàn', desc: 'Thêm mới đơn nhập hàng', linkText: 'REI00001', linkHref: '#' },
      { time: '06:47:51', category: 'Đặt hàng nhập', actor: 'Phạm Văn Toàn', desc: 'Thêm mới đơn đặt hàng nhập', linkText: 'PO00001', linkHref: '#' },
      { time: '06:46:49', category: 'Sản phẩm', actor: 'Phạm Văn Toàn', desc: 'Thêm mới sản phẩm', linkText: 'sản phẩm 002', linkHref: '#' },
      { time: '06:46:26', category: 'Sản phẩm', actor: 'Phạm Văn Toàn', desc: 'Thêm mới sản phẩm', linkText: 'sản phẩm 001', linkHref: '#' },
      { time: '06:45:23', category: 'Kênh bán hàng', actor: 'Sapo', desc: 'Kích hoạt kênh bán hàng: Website - Cửa hàng trực tuyến' },
      { time: '06:45:11', category: 'Menu', actor: 'Sapo', desc: 'Thêm mới menu', linkText: 'Chính sách', linkHref: '#' },
      { time: '06:45:11', category: 'Menu', actor: 'Sapo', desc: 'Thêm mới menu', linkText: 'Hướng dẫn', linkHref: '#' },
      { time: '06:45:11', category: 'Menu', actor: 'Sapo', desc: 'Thêm mới menu', linkText: 'Hỗ trợ', linkHref: '#' },
      { time: '06:45:11', category: 'Menu', actor: 'Sapo', desc: 'Thêm mới menu', linkText: 'Thông tin', linkHref: '#' },
      { time: '06:45:11', category: 'Menu', actor: 'Sapo', desc: 'Thêm mới menu', linkText: 'Footer', linkHref: '#' }
    ]
  }
]
</script>

<template>
  <div class="space-y-4">
    <UPageCard title="Nhật ký hoạt động" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <!-- Toolbar -->
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="md:flex-1">
            <UInput
              v-model="search"
              placeholder="Tìm kiếm theo tên người thao tác, ứng dụng..."
            />
          </div>
          <div class="flex items-center gap-2">
            <USelect
              v-model="timeFilter"
              :items="timeOptions"
              placeholder="Thời gian"
              class="min-w-[150px]"
            />
            <USelect
              v-model="funcFilter"
              :items="funcOptions"
              placeholder="Chức năng"
              class="min-w-[150px]"
            />
          </div>
        </div>

        <!-- Timeline -->
        <div class="mt-4 space-y-6">
          <div
            v-for="group in groups"
            :key="group.date"
            class="space-y-2"
          >
            <div class="text-sm font-medium text-gray-700">
              {{ group.date }}
            </div>
            <div>
              <ul class="space-y-3">
                <li
                  v-for="item in group.items"
                  :key="item.time + item.desc + (item.linkText || '')"
                  class="flex gap-5"
                >
                  <div class="flex flex-col items-center">
                    <div class="w-2 h-2 rounded-full bg-primary-500 mt-1" />
                    <div class="flex-1 w-px bg-blue-300" />
                  </div>
                  <div class="flex-1">
                    <!-- Row 1: time, category, actor -->
                    <div class="flex flex-wrap items-start gap-x-4 gap-y-1">
                      <div class="w-20 text-sm text-primary-600">
                        {{ item.time }}
                      </div>
                      <div class="w-28 text-sm text-gray-700">
                        {{ item.category }}
                      </div>
                      <div class="font-semibold text-gray-900">
                        {{ item.actor }}
                      </div>
                    </div>
                    <!-- Row 2: description + link aligned under text columns -->
                    <div class="mt-0.5 flex flex-wrap items-start gap-x-4">
                      <div class="w-20" />
                      <div class="w-28" />
                      <div class="text-sm text-gray-700">
                        <span>{{ item.desc }}</span>
                        <template v-if="item.linkText">
                          <span> : </span>
                          <NuxtLink to="#" class="text-primary-600 hover:underline">
                            {{ item.linkText }}
                          </NuxtLink>
                        </template>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Load more -->
        <div class="border-t border-gray-200 mt-2" />
        <div class="py-4 flex justify-center">
          <UButton
            color="primary"
            variant="link"
            label="Xem thêm"
          />
        </div>
      </div>
    </UPageCard>
  </div>
</template>

<style scoped>
/* global line removed; per-item segments are drawn instead */

.timeline-dot {
  width: 8px;
  height: 8px;
  background: #3b82f6; /* blue-500 */
  border-radius: 9999px;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}
</style>
