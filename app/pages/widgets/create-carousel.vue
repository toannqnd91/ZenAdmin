<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { widgetsService, type CreateCarouselWidgetRequest, type WidgetZone } from '~/services/widgets.service'
import { fileService } from '~/services/file.service'

const router = useRouter()

const widgetName = ref('')
const widgetZone = ref<string | undefined>(undefined)
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref(0)
const isSubmitting = ref(false)
const widgetZones = ref<WidgetZone[]>([])
const widgetZoneItems = ref<string[]>([])

const items = ref([
  { caption: '', subCaption: '', linkUrl: '', linkText: '', image: null as File | null, imageUrl: '', uploading: false }
])

// Load widget zones on component mount
onMounted(async () => {
  try {
    const response = await widgetsService.getWidgetZones()
    if (response.success && response.data) {
      widgetZones.value = response.data

      // Try different option formats for USelect
      widgetZoneItems.value = response.data.map((zone: WidgetZone) => zone.name)

      // Set default value to first zone if available
      if (response.data.length > 0) {
        widgetZone.value = response.data[0]?.name || undefined
        }
    } else {
      console.error('Failed to load widget zones:', response.message)
    }
  } catch (error) {
    console.error('Error loading widget zones:', error)
  }
})

function addItem() {
  items.value.push({ caption: '', subCaption: '', linkUrl: '', linkText: '', image: null as File | null, imageUrl: '', uploading: false })
}
function removeItem(idx: number) {
  items.value.splice(idx, 1)
}
async function onFileChange(file: File | null, idx: number) {
  if (!items.value[idx]) return
  items.value[idx].image = file
  items.value[idx].imageUrl = ''
  if (!file) return
  // Show preview immediately
  items.value[idx].imageUrl = URL.createObjectURL(file)
  items.value[idx].uploading = true
  try {
    const res = await fileService.uploadFile(file)
    // Expecting ApiFileUploadResponse: { success, data: { fileName, url, ... } }
    if (res && res.success && res.data) {
      const fileData = Array.isArray(res.data) ? res.data[0] : res.data
      if (fileData && fileData.fileName) {
        // Use getFileUrl for preview and API
        items.value[idx].imageUrl = fileService.getFileUrl(fileData.fileName)
      } else {
        alert('Upload failed: Không tìm thấy fileName trong response')
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

async function onSave() {
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

    // Helper function to convert dd/MM/yyyy HH:mm to ISO string
    function convertToISO(dateTimeStr: string): string {
      if (!dateTimeStr) return new Date().toISOString()

      try {
        // Parse dd/MM/yyyy HH:mm format
        const parts = dateTimeStr.split(' ')
        if (parts.length !== 2) throw new Error('Invalid format')

        const [datePart, timePart] = parts
        if (!datePart || !timePart) throw new Error('Missing date or time part')

        const dateParts = datePart.split('/')
        const timeParts = timePart.split(':')

        if (dateParts.length !== 3 || timeParts.length !== 2) {
          throw new Error('Invalid date/time format')
        }

        const [day, month, year] = dateParts
        const [hours, minutes] = timeParts

        if (!day || !month || !year || !hours || !minutes) {
          throw new Error('Missing date/time components')
        }

        const date = new Date(
          parseInt(year),
          parseInt(month) - 1, // Month is 0-indexed
          parseInt(day),
          parseInt(hours),
          parseInt(minutes)
        )

        return date.toISOString()
      } catch {
        console.error('Invalid date format:', dateTimeStr)
        return new Date().toISOString()
      }
    }

    // Map data to API format
    const selectedZone = widgetZones.value.find(zone => zone.name === widgetZone.value)
    if (!selectedZone) {
      alert('Invalid widget zone selected')
      return
    }

    const requestData: CreateCarouselWidgetRequest = {
      id: 0,
      name: widgetName.value,
      widgetZoneId: selectedZone.id,
      publishStart: convertToISO(publishStart.value),
      publishEnd: convertToISO(publishEnd.value),
      displayOrder: displayOrder.value || 0,
      items: items.value.map((item, index) => ({
        image: item.imageUrl || '', // Use uploaded image URL
        imageUrl: item.imageUrl || '',
        caption: item.caption,
        subCaption: item.subCaption,
        linkText: item.linkText,
        targetUrl: item.linkUrl,
        sortOrder: index
      }))
    }

    const response = await widgetsService.createCarouselWidget(requestData)

    if (response.success) {
      alert('Carousel widget created successfully!')
      router.push('/widgets')
    } else {
      alert(`Error: ${response.message}`)
    }
  } catch (error) {
    console.error('Error creating carousel widget:', error)
    alert('Failed to create carousel widget')
  } finally {
    isSubmitting.value = false
  }
}

function onCancel() {
  router.back()
}
</script>

<template>
  <UDashboardPanel class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Create Carousel Widget">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UCard class="w-full mt-6">
        <form class="space-y-6" @submit.prevent="onSave">
          <div class="text-3xl font-light mb-8">
            Create Carousel Widget
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <label class="col-span-2 text-right pr-2">Widget Name</label>
            <div class="col-span-10 w-full">
              <UInput v-model="widgetName" placeholder="Enter widget name" class="w-full" />
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <label class="col-span-2 text-right pr-2">Widget Zone</label>
            <div class="col-span-10 w-full">
              <USelect
                v-model="widgetZone"
                :items="widgetZoneItems"
                placeholder="Select widget zone"
                class="w-full"
              />
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <label class="col-span-2 text-right pr-2">Publish Start</label>
            <div class="col-span-10 w-full">
              <UInput
                v-model="publishStart"
                placeholder="dd/MM/yyyy HH:mm"
                class="w-full"
              />
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <label class="col-span-2 text-right pr-2">Publish End</label>
            <div class="col-span-10 w-full">
              <UInput
                v-model="publishEnd"
                placeholder="dd/MM/yyyy HH:mm"
                class="w-full"
              />
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <div class="col-span-2" />
            <div class="col-span-10 text-xs text-gray-400">
              Định dạng: dd/MM/yyyy HH:mm (ví dụ: 31/07/2025 15:30)
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <label class="col-span-2 text-right pr-2">Display Order</label>
            <div class="col-span-10 w-full">
              <UInput
                v-model="displayOrder"
                type="number"
                min="0"
                placeholder="0"
                class="w-full"
              />
            </div>
          </div>
          <UDivider label="Items" class="my-4" />
          <div class="grid grid-cols-12 gap-4 items-start mb-2">
            <label class="col-span-2 text-right pr-2 pt-2">Items</label>
            <div class="col-span-10 w-full">
              <div v-for="(item, idx) in items" :key="idx" class="mb-4 border-b pb-4">
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Caption</label>
                  <div class="col-span-8 w-full">
                    <UInput v-model="item.caption" placeholder="Caption" class="w-full" />
                  </div>
                  <div class="col-span-2 flex justify-end">
                    <UButton
                      v-if="items.length > 1"
                      icon="i-lucide-x"
                      color="error"
                      variant="soft"
                      size="xs"
                      title="Remove item"
                      @click="() => removeItem(idx)"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Sub Caption</label>
                  <div class="col-span-8 w-full">
                    <UInput v-model="item.subCaption" placeholder="Sub Caption" class="w-full" />
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Link Url</label>
                  <div class="col-span-8 w-full">
                    <UInput v-model="item.linkUrl" placeholder="https://..." class="w-full" />
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Link Text</label>
                  <div class="col-span-8 w-full">
                    <UInput v-model="item.linkText" placeholder="Link Text" class="w-full" />
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Image</label>
                  <div class="col-span-8 w-full">
                    <div v-if="item.imageUrl" class="relative group w-full">
                      <div class="aspect-[16/9] w-full max-h-56 bg-gray-50 border rounded flex items-center justify-center overflow-hidden">
                        <img
                          :src="item.imageUrl"
                          alt="Preview"
                          class="w-full h-full object-cover"
                        >
                      </div>
                      <button
                        type="button"
                        class="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-white/80 hover:bg-white text-red-500 rounded-full shadow group-hover:opacity-100 opacity-80 transition"
                        title="Xoá ảnh"
                        @click="() => { item.image = null; item.imageUrl = '' }"
                      >
                        <UIcon name="i-lucide-x" class="w-4 h-4" />
                      </button>
                    </div>
                    <div v-else>
                      <UFileUpload
                        v-model="item.image"
                        class="w-full"
                        @update:model-value="(file: unknown) => onFileChange(file as File | null, idx)"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <UButton
                icon="i-lucide-plus"
                color="primary"
                variant="ghost"
                size="xs"
                class="mt-2"
                @click="addItem"
              >
                Add more
              </UButton>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <UButton icon="i-lucide-check" color="primary" type="submit">
              Save
            </UButton>
            <UButton color="neutral" variant="soft" @click="onCancel">
              Cancel
            </UButton>
          </div>
        </form>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
