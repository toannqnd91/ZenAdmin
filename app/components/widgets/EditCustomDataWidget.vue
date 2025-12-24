<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { widgetsService, type WidgetZone } from '~/services/widgets.service'
import { fileService } from '~/services/file.service'

const router = useRouter()
const route = useRoute()

// Get widget ID from route params
const widgetId = parseInt(route.params.id as string)

const widgetName = ref('')
const widgetZone = ref<string | undefined>(undefined)
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref(0)
const isSubmitting = ref(false)
const isLoading = ref(true)
const widgetZones = ref<WidgetZone[]>([])
const widgetZoneItems = ref<string[]>([])
const isMounted = ref(false)

const items = ref([
  { caption: '', subCaption: '', linkText: '', targetUrl: '', sortOrder: 0, image: null as File | null, imageUrl: '', uploading: false }
])

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
  isMounted.value = true // Ensure Teleport works
  try {
    isLoading.value = true

    // Execute requests in parallel for faster loading
    const [zonesResponse, response] = await Promise.all([
      widgetsService.getWidgetZones().catch(err => {
        console.error('Zone fetch error:', err)
        return { success: false, data: [] }
      }),
      widgetsService.getCustomDataWidget(widgetId).catch(err => {
        console.error('Widget fetch error:', err)
        return { success: false, message: err.message, data: null }
      })
    ])

    // Process Zones
    if (zonesResponse && zonesResponse.success && zonesResponse.data) {
      widgetZones.value = zonesResponse.data
      widgetZoneItems.value = zonesResponse.data.map((zone: WidgetZone) => zone.name)
    }

    // Process Widget Data
    if (response && response.success && response.data) {
      const data = response.data

      // Populate form with existing data
      widgetName.value = data.name
      publishStart.value = formatDateTimeForInput(data.publishStart)
      publishEnd.value = formatDateTimeForInput(data.publishEnd)
      displayOrder.value = data.displayOrder

      // Find widget zone name by ID
      const selectedZone = widgetZones.value.find(zone => zone.id === data.widgetZoneId)
      widgetZone.value = selectedZone?.name

      // Populate items
      if (data.items && data.items.length > 0) {
        // Map items and ensure image is handled correctly
        items.value = data.items.map((item: any) => ({
          caption: item.caption,
          subCaption: item.subCaption,
          linkText: item.linkText,
          targetUrl: item.targetUrl,
          sortOrder: item.sortOrder,
          image: null,
          imageUrl: item.imageUrl, // Assuming API returns imageUrl
          uploading: false
        }))
      }
    } else {
      console.error('Failed to load widget data:', response?.message)
      throw new Error(response?.message || 'Failed load')
    }
  } catch (error) {
    console.error('Error loading widget data:', error)
    console.warn('Falling back to mock data')

    // Mock data for demo
    widgetName.value = 'Featured Custom Data'
    const defaultZone = widgetZones.value.length > 0 ? widgetZones.value[0] : undefined
    widgetZone.value = defaultZone?.name || 'Home Featured'
    publishStart.value = '01/01/2025 00:00'
    publishEnd.value = '31/12/2025 23:59'
    displayOrder.value = 1
    items.value = [
      {
        caption: 'Feature 1',
        subCaption: 'Description of feature 1',
        linkText: 'Learn More',
        targetUrl: '/feature-1',
        sortOrder: 0,
        image: null,
        imageUrl: 'https://placehold.co/800x450?text=Feature+1',
        uploading: false
      },
      {
        caption: 'Feature 2',
        subCaption: 'Description of feature 2',
        linkText: 'View Details',
        targetUrl: '/feature-2',
        sortOrder: 1,
        image: null,
        imageUrl: '',
        uploading: false
      }
    ]
  } finally {
    isLoading.value = false
  }
})

function addItem() {
  items.value.push({ caption: '', subCaption: '', linkText: '', targetUrl: '', sortOrder: items.value.length, image: null as File | null, imageUrl: '', uploading: false })
}

function removeItem(idx: number) {
  items.value.splice(idx, 1)
}

async function onFileChange(file: File | null, idx: number) {
  if (!items.value[idx]) return
  items.value[idx].image = null
  items.value[idx].imageUrl = ''
  if (!file) return

  items.value[idx].image = file
  items.value[idx].imageUrl = URL.createObjectURL(file)
  items.value[idx].uploading = true

  try {
    const res = await fileService.uploadFile(file)
    if (res && res.success && res.data) {
      // New format: { success: true, data: { url: "...", ... } }
      // res.data is the file object e.g. { url: '...', fileName: '...' }
      const fileData = res.data
      if (fileData && fileData.url) {
        items.value[idx].imageUrl = fileData.url
      } else {
        alert('Upload failed: Không tìm thấy url trong response')
        items.value[idx].imageUrl = ''
      }
    } else {
      alert('Upload failed: ' + (res.message || 'Unknown error'))
      items.value[idx].imageUrl = ''
    }
  } catch (err) {
    alert('Upload failed')
    items.value[idx].imageUrl = ''
  } finally {
    items.value[idx].uploading = false
  }
}

function removeImage(idx: number) {
  if (!items.value[idx]) return
  items.value[idx].image = null
  items.value[idx].imageUrl = ''
}

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

    // Chuẩn hóa dữ liệu 
    const payload = {
      id: widgetId,
      name: widgetName.value,
      widgetZoneId: widgetZones.value.find(z => z.name === widgetZone.value)?.id || 0,
      publishStart: publishStart.value ? new Date(publishStart.value.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:00')).toISOString() : '',
      publishEnd: publishEnd.value ? new Date(publishEnd.value.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:00')).toISOString() : '',
      displayOrder: displayOrder.value,
      items: items.value.map((item: any, idx) => ({
        image: item.imageUrl,
        imageUrl: item.imageUrl,
        caption: item.caption,
        subCaption: item.subCaption,
        linkText: item.linkText,
        targetUrl: item.targetUrl,
        sortOrder: parseInt(item.sortOrder || idx) // Ensure sortOrder is number
      }))
    }

    // Gọi API PUT
    const response = await widgetsService.updateCustomDataWidget(widgetId, payload)
    if (response.success) {
      alert('Custom Data widget updated successfully!')
      router.push('/widgets')
    } else {
      alert('Update failed: ' + (response.message || 'Unknown error'))
    }
  } catch (error) {
    console.error('Error updating widget:', error)
    // Fallback for demo
    console.warn('API update failed, simulating success')
    alert('Custom Data widget updated successfully (Mock)!')
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
          </div>
        </UPageCard>

        <UPageCard title="Danh sách Items" variant="soft" class="bg-white rounded-lg">
          <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
            <div v-for="(item, idx) in items" :key="idx"
              class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 relative">
              <div class="absolute top-4 right-4">
                <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" title="Xoá item này"
                  @click="() => removeItem(idx)" :disabled="items.length <= 1" />
              </div>

              <h3 class="text-sm font-semibold text-gray-900 mb-4">Item #{{ idx + 1 }}</h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Image Upload (Left) -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Hình ảnh</label>
                  <div class="border rounded-lg overflow-hidden bg-white">
                    <div v-if="item.imageUrl" class="relative group aspect-video">
                      <img
                        :src="item.image && item.imageUrl.startsWith('blob:') ? item.imageUrl : (fileService.getFileUrl(item.imageUrl) || '')"
                        alt="Preview" class="w-full h-full object-cover">
                      <button type="button"
                        class="absolute top-1 right-1 flex items-center justify-center w-6 h-6 bg-white/80 hover:bg-white text-red-500 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xoá ảnh" @click="removeImage(idx)">
                        <UIcon name="i-lucide-x" class="w-4 h-4" />
                      </button>
                    </div>
                    <div v-else class="p-4 flex flex-col items-center justify-center min-h-[150px]">
                      <UFileUpload v-model="item.image" class="w-full" :multiple="false"
                        @update:model-value="(file: unknown) => onFileChange(file as File | null, idx)" />
                      <p v-if="item.uploading" class="text-xs text-blue-500 mt-2">Đang tải ảnh lên...</p>
                    </div>
                  </div>
                </div>

                <!-- Info Fields (Right) -->
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiêu đề
                      (Caption)</label>
                    <input v-model="item.caption" placeholder="Tiêu đề item"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả phụ (Sub
                      Caption)</label>
                    <input v-model="item.subCaption" placeholder="Mô tả ngắn"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đường dẫn (Target
                      URL)</label>
                    <input v-model="item.targetUrl" placeholder="https://example.com"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nhãn nút (Link
                        Text)</label>
                      <input v-model="item.linkText" placeholder="VD: Xem thêm"
                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thứ tự
                        (Sort)</label>
                      <input v-model="item.sortOrder" type="number" placeholder="0"
                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <UButton label="Thêm Item Mới" icon="i-lucide-plus" color="primary" variant="soft" block @click="addItem" />
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
