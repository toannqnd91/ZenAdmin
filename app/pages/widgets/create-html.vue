<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { widgetsService, type WidgetZone } from '~/services/widgets.service'

const router = useRouter()

// Form state
const widgetName = ref('')
const widgetZone = ref<string | undefined>(undefined)
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref(0)
const htmlData = ref('')

// UI state
const isSubmitting = ref(false)
const isLoading = ref(false)
const widgetZones = ref<WidgetZone[]>([])
const widgetZoneItems = ref<string[]>([])

// Helper function to convert dd/MM/yyyy HH:mm to ISO string
function convertToISOString(dateTimeString: string): string {
  if (!dateTimeString) return ''

  try {
    // Parse dd/MM/yyyy HH:mm format
    const match = dateTimeString.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/)
    if (!match) return ''

    const [, day, month, year, hours, minutes] = match
    const date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`)
    return date.toISOString()
  } catch {
    return ''
  }
}

// Load widget zones
onMounted(async () => {
  try {
    isLoading.value = true
    const zonesResponse = await widgetsService.getWidgetZones()

    if (zonesResponse && zonesResponse.success && zonesResponse.data) {
      widgetZones.value = zonesResponse.data
      widgetZoneItems.value = zonesResponse.data.map((zone: WidgetZone) => zone.name)
    }
  } catch (error) {
    console.error('Error loading widget zones:', error)
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
    if (!htmlData.value.trim()) {
      alert('Nội dung HTML là bắt buộc')
      return
    }

    // Prepare payload
    const payload = {
      id: 0, // 0 for create
      name: widgetName.value,
      widgetZoneId: widgetZones.value.find(z => z.name === widgetZone.value)?.id || 0,
      publishStart: publishStart.value ? convertToISOString(publishStart.value) : '',
      publishEnd: publishEnd.value ? convertToISOString(publishEnd.value) : '',
      displayOrder: displayOrder.value,
      htmlData: htmlData.value // Send as htmlData per API spec
    }

    // Call API
    const response = await widgetsService.createHtmlWidget(payload as any)

    if (response.success) {
      alert('HTML Widget đã được tạo thành công!')
      router.push('/widgets')
    } else {
      alert('Lỗi: ' + (response.message || 'Không thể tạo widget'))
    }
  } catch (error) {
    console.error('Error creating HTML widget:', error)
    alert('Có lỗi xảy ra khi tạo widget')
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
  <UDashboardPanel id="create-html-widget">
    <template #header>
      <UDashboardNavbar title="Thêm HTML Widget mới">
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
              <span class="text-gray-900 dark:text-white font-medium">Thêm HTML Widget mới</span>
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
                <div>
                  <label for="htmlContent" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nội
                    dung HTML <span class="text-red-500">*</span></label>
                  <div
                    class="rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800">
                    <TinyMCESelfHost v-model="htmlData" editor-id="html-widget-editor" placeholder="Nhập mã HTML..."
                      :height="400" />
                  </div>
                </div>
              </form>
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
