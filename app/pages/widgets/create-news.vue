<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { widgetsService } from '~/services/widgets.service'
import { NewsService } from '~/services/news.service'
import type { WidgetZone, CreateNewsWidgetRequest } from '~/services/widgets.service'

const router = useRouter()

// Form state
const widgetName = ref('')
const widgetZone = ref<string | undefined>(undefined)
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref(0)

// News widget settings
const category = ref(0)
const numberOfNews = ref(4)
const isFeaturedOnly = ref(false)
const orderBy = ref(0)

// UI state
const isSubmitting = ref(false)
const isLoading = ref(false)
const widgetZones = ref<WidgetZone[]>([])
const widgetZoneItems = ref<string[]>([])
const categoryOptions = ref<{ label: string, value: string | number }[]>([])

const orderByOptions = [
  { label: 'Mới nhất', value: 0 },
  { label: 'Xem nhiều nhất', value: 1 },
  { label: 'Nhiều bình luận nhất', value: 2 }
]

// Helper function to convert dd/MM/yyyy HH:mm to ISO string
function convertToISOString(dateTimeString: string): string {
  if (!dateTimeString) return ''

  try {
    const match = dateTimeString.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/)
    if (!match) return ''

    const [, day, month, year, hours, minutes] = match
    const date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`)
    return date.toISOString()
  } catch {
    return ''
  }
}

// Load data
onMounted(async () => {
  try {
    isLoading.value = true

    // Load widget zones and categories in parallel
    const [zonesResponse, categoriesResponse] = await Promise.all([
      widgetsService.getWidgetZones(),
      new NewsService().getCategories()
    ])

    // Process widget zones
    if (zonesResponse.success && zonesResponse.data) {
      widgetZones.value = zonesResponse.data
      widgetZoneItems.value = zonesResponse.data.map((zone: WidgetZone) => zone.name)
    }

    // Process categories
    if (categoriesResponse && categoriesResponse.data) {
      categoryOptions.value = [
        { label: 'Tất cả danh mục', value: 0 },
        ...categoriesResponse.data.map((cat: any) => ({ label: cat.name, value: cat.id }))
      ]
    }
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    isLoading.value = false
  }
})

// Submit handler
async function handleSubmit() {
  if (isSubmitting.value) return

  try {
    isSubmitting.value = true

    // Validation
    if (!widgetName.value.trim()) {
      alert('Tên Widget là bắt buộc')
      return
    }
    if (!widgetZone.value) {
      alert('Vị trí hiển thị là bắt buộc')
      return
    }

    // Find the widget zone ID by name
    const selectedZone = widgetZones.value.find(zone => zone.name === widgetZone.value)
    if (!selectedZone) {
      alert('Vui lòng chọn vị trí hiển thị hợp lệ')
      return
    }

    const payload: CreateNewsWidgetRequest = {
      id: 0,
      name: widgetName.value,
      widgetZoneId: selectedZone.id,
      publishStart: publishStart.value ? convertToISOString(publishStart.value) : null,
      publishEnd: publishEnd.value ? convertToISOString(publishEnd.value) : null,
      displayOrder: displayOrder.value,
      setting: {
        numberOfNews: numberOfNews.value,
        categoryId: category.value === 0 ? null : category.value,
        orderBy: orderBy.value,
        featuredOnly: isFeaturedOnly.value
      }
    }

    const response = await widgetsService.createNewsWidget(payload)

    if (response.success) {
      alert('News Widget đã được tạo thành công!')
      router.push('/widgets')
    } else {
      alert('Lỗi: ' + (response.message || 'Không thể tạo widget'))
    }
  } catch (error: unknown) {
    console.error('Error creating news widget:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    alert('Có lỗi xảy ra: ' + errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  router.push('/widgets')
}

function goBack() {
  router.push('/widgets')
}
</script>

<template>
  <UDashboardPanel id="create-news-widget">
    <template #header>
      <UDashboardNavbar title="Thêm News Widget mới">
        <template #leading>
          <div class="flex items-center gap-3">
            <button
              class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              @click="goBack">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <UButton label="Hủy" variant="ghost" color="neutral" @click="handleCancel" />
            <UButton label="Lưu" :loading="isSubmitting" @click="handleSubmit" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-6xl mx-auto px-4 lg:px-6">
        <!-- Breadcrumb -->
        <nav class="mb-6" aria-label="Breadcrumb">
          <ol class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <NuxtLink to="/widgets" class="hover:text-primary-600 dark:hover:text-primary-400">Quản lý Widgets
              </NuxtLink>
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd" />
              </svg>
              <span class="text-gray-900 dark:text-white font-medium">Thêm News Widget mới</span>
            </li>
          </ol>
        </nav>

        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <svg class="animate-spin h-8 w-8 text-primary-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p class="text-gray-500">
              Đang tải dữ liệu...
            </p>
          </div>
        </div>

        <div v-else class="flex flex-col lg:flex-row gap-6">
          <!-- Left column -->
          <div class="flex-1 space-y-6">
            <UPageCard title="Thông tin Widget" variant="soft" class="bg-white rounded-lg overflow-hidden">
              <form class="space-y-6" @submit.prevent="handleSubmit">
                <div>
                  <label for="widgetName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tên
                    Widget <span class="text-red-500">*</span></label>
                  <input id="widgetName" v-model="widgetName" type="text" placeholder="Nhập tên widget"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
              </form>
            </UPageCard>

            <UPageCard title="Cấu hình hiển thị tin tức" variant="soft" class="bg-white rounded-lg overflow-hidden">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Danh mục tin
                    tức</label>
                  <select v-model="category"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Số lượng tin
                    tức</label>
                  <input v-model="numberOfNews" type="number" min="1" placeholder="4"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sắp xếp theo</label>
                  <select v-model="orderBy"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option v-for="opt in orderByOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>
                <div class="flex items-center">
                  <input id="featuredOnly" v-model="isFeaturedOnly" type="checkbox"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                  <label for="featuredOnly" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Chỉ hiển thị tin nổi bật
                  </label>
                </div>
              </div>
            </UPageCard>
          </div>

          <!-- Right column -->
          <div class="w-full lg:w-80 space-y-6">
            <UPageCard title="Cài đặt hiển thị" variant="soft" class="bg-white rounded-lg">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vị trí (Zone) <span
                      class="text-red-500">*</span></label>
                  <select v-model="widgetZone"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option :value="undefined" disabled>Chọn vị trí hiển thị</option>
                    <option v-for="zone in widgetZoneItems" :key="zone" :value="zone">{{ zone }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thứ tự hiển thị</label>
                  <input v-model="displayOrder" type="number" min="0" placeholder="0"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
              </div>
            </UPageCard>

            <UPageCard title="Thời gian xuất bản" variant="soft" class="bg-white rounded-lg">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngày bắt đầu</label>
                  <input v-model="publishStart" placeholder="dd/MM/yyyy HH:mm"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngày kết thúc</label>
                  <input v-model="publishEnd" placeholder="dd/MM/yyyy HH:mm"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
                <div class="text-xs text-gray-500 italic">
                  Định dạng: dd/MM/yyyy HH:mm
                </div>
              </div>
            </UPageCard>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
