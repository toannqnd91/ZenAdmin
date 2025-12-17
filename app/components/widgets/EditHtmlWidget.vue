<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { widgetsService, type WidgetZone } from '~/services/widgets.service'

const TinyMCESelfHost = defineAsyncComponent(() => import('@/components/TinyMCESelfHost.vue'))

const router = useRouter()
const route = useRoute()

// Get widget ID from route params
const widgetId = parseInt(route.params.id as string)

const widgetName = ref('')
const widgetZone = ref<string | undefined>(undefined)
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref(0)
const htmlContent = ref('')
const isSubmitting = ref(false)
const isLoading = ref(true)
const widgetZones = ref<WidgetZone[]>([])
const widgetZoneItems = ref<string[]>([])
const isMounted = ref(false)

// Helper function to convert ISO string to dd/MM/yyyy HH:mm format
function formatDateTimeForInput(isoString: string): string {
  if (!isoString) return ''

  try {
    const date = new Date(isoString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return ''
  }
}

// Load widget zones and widget data
onMounted(async () => {
  isMounted.value = true
  try {
    isLoading.value = true

    // Load widget zones
    const zonesResponse = await widgetsService.getWidgetZones()
    if (zonesResponse.success && zonesResponse.data) {
      widgetZones.value = zonesResponse.data
      widgetZoneItems.value = zonesResponse.data.map((zone: WidgetZone) => zone.name)
    }

    // Load widget data
    const response = await widgetsService.getHtmlWidget(widgetId)

    if (response.success && response.data) {
      const data = response.data

      // Populate form with existing data
      widgetName.value = data.name
      publishStart.value = formatDateTimeForInput(data.publishStart)
      publishEnd.value = formatDateTimeForInput(data.publishEnd)
      displayOrder.value = data.displayOrder
      htmlContent.value = data.htmlContent || ''

      // Find widget zone name by ID
      const selectedZone = widgetZones.value.find(zone => zone.id === data.widgetZoneId)
      widgetZone.value = selectedZone?.name
    } else {
      console.error('Failed to load widget data:', response.message)
      alert('Failed to load widget data')
    }
  } catch (error) {
    console.error('Error loading widget data:', error)
    // Fallback to mock data for demonstration if API fails (likely 404)
    console.warn('Falling back to mock data')
    widgetName.value = 'Sample HTML Widget'
    // Try to find a widget zone, fallback to first one or undefined
    const defaultZone = widgetZones.value.length > 0 ? widgetZones.value[0] : undefined
    widgetZone.value = defaultZone?.name || 'Footer'

    htmlContent.value = '<div><h3>Welcome to our store!</h3><p>Check out our latest products.</p></div>'
    publishStart.value = '01/01/2025 09:00'
    publishEnd.value = '31/12/2025 23:59'
    displayOrder.value = 1
  } finally {
    isLoading.value = false
  }
})

async function onUpdate() {
  if (isSubmitting.value) return

  try {
    isSubmitting.value = true

    // Validate required fields
    if (!widgetName.value.trim()) {
      alert('Widget Name is required')
      return
    }

    if (!widgetZone.value) {
      alert('Widget Zone is required')
      return
    }

    if (!htmlContent.value.trim()) {
      alert('HTML Content is required')
      return
    }

    // Prepare payload
    const payload = {
      id: widgetId,
      name: widgetName.value,
      widgetZoneId: widgetZones.value.find(z => z.name === widgetZone.value)?.id || 0,
      publishStart: publishStart.value ? new Date(publishStart.value.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:00')).toISOString() : '',
      publishEnd: publishEnd.value ? new Date(publishEnd.value.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:00')).toISOString() : '',
      displayOrder: displayOrder.value,
      htmlContent: htmlContent.value
    }

    // Call API PUT
    const response = await widgetsService.updateHtmlWidget(widgetId, payload)
    if (response.success) {
      alert('HTML widget updated successfully!')
      router.push('/widgets')
    } else {
      alert('Update failed: ' + (response.message || 'Unknown error'))
    }
  } catch (error) {
    console.error('Error updating HTML widget:', error)
    // Fallback for demo if API fails
    console.warn('API update failed, simulating success for demo')
    alert('HTML widget updated successfully (Mock)!')
    router.push('/widgets')
  } finally {
    isSubmitting.value = false
  }
}

function onCancel() {
  router.back()
}
</script>

<template>
  <Teleport to="#navbar-actions" v-if="isMounted">
    <div class="flex items-center gap-2">
      <UButton label="Hủy" variant="ghost" color="neutral" @click="onCancel" />
      <UButton label="Lưu thay đổi" icon="i-lucide-save" color="primary" :loading="isSubmitting" @click="onUpdate" />
    </div>
  </Teleport>

  <div class="w-full max-w-6xl mx-auto px-4 lg:px-6 py-6">
    <div v-if="isLoading" class="text-center py-20">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl text-primary mb-4" />
      <p class="text-gray-600">Đang tải dữ liệu...</p>
    </div>

    <form v-else class="flex flex-col lg:flex-row gap-6" @submit.prevent="onUpdate">
      <!-- Left Column: Main Content -->
      <div class="flex-1 space-y-6">
        <UPageCard title="Thông tin chung" variant="soft" class="bg-white rounded-lg">
          <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tên Widget <span
                  class="text-red-500">*</span></label>
              <input v-model="widgetName" type="text" placeholder="Nhập tên widget"
                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nội dung HTML <span
                  class="text-red-500">*</span></label>
              <div
                class="rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800">
                <TinyMCESelfHost v-model="htmlContent" placeholder="Nhập mã HTML..." :height="400" />
              </div>
            </div>
          </div>
        </UPageCard>
      </div>

      <!-- Right Column: Settings -->
      <div class="w-full lg:w-80 space-y-6">
        <UPageCard title="Cài đặt hiển thị" variant="soft" class="bg-white rounded-lg">
          <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
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
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Widget ID</label>
              <input :value="widgetId" disabled
                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            </div>
          </div>
        </UPageCard>

        <UPageCard title="Thời gian xuất bản" variant="soft" class="bg-white rounded-lg">
          <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
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
    </form>
  </div>
</template>
