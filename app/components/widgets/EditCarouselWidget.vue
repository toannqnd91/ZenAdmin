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

const items = ref([
  { caption: '', subCaption: '', linkUrl: '', linkText: '', image: null as File | null, imageUrl: '', uploading: false }
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
  try {
    isLoading.value = true
    
    // Load widget zones
    const zonesResponse = await widgetsService.getWidgetZones()
    if (zonesResponse.success && zonesResponse.data) {
      widgetZones.value = zonesResponse.data
      widgetZoneItems.value = zonesResponse.data.map((zone: WidgetZone) => zone.name)
    }
    
    // Load widget data
    console.log('Loading carousel widget data for ID:', widgetId)
    const response = await widgetsService.getCarouselWidget(widgetId)
    
    if (response.success && response.data) {
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
        items.value = data.items.map(item => ({
          caption: item.caption,
          subCaption: item.subCaption,
          linkUrl: item.targetUrl,
          linkText: item.linkText,
          image: null,
          imageUrl: item.imageUrl,
          uploading: false
        }))
      }
    } else {
      console.error('Failed to load widget data:', response.message)
      alert('Failed to load widget data')
    }
  } catch (error) {
    console.error('Error loading widget data:', error)
    alert('Error loading widget data')
  } finally {
    isLoading.value = false
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
  // Always reset imageUrl and image
  items.value[idx].image = null
  items.value[idx].imageUrl = ''
  if (!file) return
  // Show preview immediately
  items.value[idx].image = file
  items.value[idx].imageUrl = URL.createObjectURL(file)
  items.value[idx].uploading = true
  try {
    const res = await fileService.uploadFile(file)
    if (res && res.success && res.data) {
      const fileData = Array.isArray(res.data) ? res.data[0] : res.data
      if (fileData && fileData.fileName) {
        items.value[idx].imageUrl = fileService.getFileUrl(fileData.fileName) || ''
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

    // TODO: Call update API
    console.log('Updating carousel widget:', widgetId)
    
    alert('Carousel widget updated successfully!')
    router.push('/widgets')
  } catch (error) {
    console.error('Error updating carousel widget:', error)
    alert('Failed to update carousel widget')
  } finally {
    isSubmitting.value = false
  }
}

function onCancel() {
  router.back()
}
</script>

<template>
  <div class="p-6 w-full">
    <div v-if="isLoading" class="text-center py-8">
      <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl text-primary mb-4" />
      <p class="text-gray-600">
        Loading widget data...
      </p>
    </div>
    <form v-else class="space-y-6" @submit.prevent="onUpdate">
      <div class="text-3xl font-light mb-8">
        Edit Carousel Widget
      </div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <label class="col-span-2 text-right pr-2">Widget ID</label>
        <div class="col-span-10 w-full">
          <UInput :value="widgetId" disabled class="w-full" />
        </div>
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
                      :src="item.image && item.imageUrl.startsWith('blob:') ? item.imageUrl : (fileService.getFileUrl(item.imageUrl) || '')"
                      alt="Preview"
                      class="w-full h-full object-cover"
                    >
                  </div>
                  <button
                    type="button"
                    @click="removeImage(idx)"
                    class="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-white/80 hover:bg-white text-red-500 rounded-full shadow group-hover:opacity-100 opacity-80 transition"
                    title="Xoá ảnh"
                  >
                    <UIcon name="i-lucide-x" class="w-4 h-4" />
                  </button>
                </div>
                <div v-else>
                  <UFileUpload
                    v-model="item.image"
                    class="w-full"
                    :multiple="false"
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
        <UButton
          icon="i-lucide-save"
          color="primary"
          type="submit"
          :loading="isSubmitting"
        >
          Update
        </UButton>
        <UButton color="neutral" variant="soft" @click="onCancel">
          Cancel
        </UButton>
      </div>
    </form>
  </div>
</template>
