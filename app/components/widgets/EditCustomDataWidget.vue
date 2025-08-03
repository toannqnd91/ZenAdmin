<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { widgetsService, type WidgetZone } from '@/services/widgets.service'

const router = useRouter()
const route = useRoute()

const widgetId = route.params.id as string
const widgetType = route.params.widgetType as string

const name = ref('')
const widgetZone = ref<string | undefined>(undefined)
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref(0)
const isSubmitting = ref(false)
const isLoading = ref(true)
const widgetZones = ref<WidgetZone[]>([])
const widgetZoneItems = ref<string[]>([])
const items = ref([
  { caption: '', subCaption: '', imageUrl: '', linkText: '', targetUrl: '', sortOrder: 0 }
])

// Helper function to convert ISO string to yyyy-MM-dd HH:mm format
function formatDateTimeForInput(isoString: string): string {
  if (!isoString) return ''
  
  try {
    const date = new Date(isoString)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch {
    return ''
  }
}

async function fetchWidget() {
  try {
    isLoading.value = true
    
    // Load widget zones
    const zonesResponse = await widgetsService.getWidgetZones()
    if (zonesResponse.success && zonesResponse.data) {
      widgetZones.value = zonesResponse.data
      widgetZoneItems.value = zonesResponse.data.map((zone: WidgetZone) => zone.name)
    }
    
    // Load widget data
    const response = await widgetsService.getCustomDataWidget(Number(widgetId))
    if (response.success && response.data) {
      const data = response.data
      name.value = data.name
      publishStart.value = formatDateTimeForInput(data.publishStart)
      publishEnd.value = formatDateTimeForInput(data.publishEnd)
      displayOrder.value = data.displayOrder
      items.value = data.items || []
      
      // Find widget zone name by ID
      const selectedZone = widgetZones.value.find(zone => zone.id === data.widgetZoneId)
      widgetZone.value = selectedZone?.name
    }
  } catch (e) {
    alert('Không lấy được dữ liệu widget!')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchWidget)

async function onUpdate() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    const payload = {
      id: Number(widgetId),
      name: name.value,
      widgetZoneId: widgetZones.value.find(z => z.name === widgetZone.value)?.id || 1,
      publishStart: publishStart.value ? new Date(publishStart.value.replace(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/, '$1-$2-$3T$4:$5:00')).toISOString() : '',
      publishEnd: publishEnd.value ? new Date(publishEnd.value.replace(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/, '$1-$2-$3T$4:$5:00')).toISOString() : '',
      displayOrder: displayOrder.value,
      items: items.value
    }
    const response = await widgetsService.updateCustomDataWidget(Number(widgetId), payload)
    if (response.success) {
      alert('Custom Data Widget updated!')
      router.push('/widgets')
    } else {
      alert('Cập nhật thất bại: ' + (response.message || 'Unknown error'))
    }
  } catch (e) {
    alert('Có lỗi khi cập nhật widget!')
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
      <div class="text-3xl font-light mb-8">Edit Custom Data Widget</div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <label class="col-span-2 text-right pr-2">Widget ID</label>
        <div class="col-span-10 w-full">
          <UInput :value="widgetId" disabled class="w-full" />
        </div>
      </div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <label class="col-span-2 text-right pr-2">Name</label>
        <div class="col-span-10 w-full">
          <UInput v-model="name" placeholder="Widget name" class="w-full" />
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
          <UInput v-model="publishStart" placeholder="yyyy-MM-dd HH:mm" class="w-full" />
        </div>
      </div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <label class="col-span-2 text-right pr-2">Publish End</label>
        <div class="col-span-10 w-full">
          <UInput v-model="publishEnd" placeholder="yyyy-MM-dd HH:mm" class="w-full" />
        </div>
      </div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <label class="col-span-2 text-right pr-2">Display Order</label>
        <div class="col-span-10 w-full">
          <UInput v-model="displayOrder" type="number" min="0" class="w-full" />
        </div>
      </div>
      <div class="my-4">
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
                  <UButton v-if="items.length > 1" icon="i-lucide-x" color="error" variant="soft" size="xs" title="Remove item" @click="(e) => { items.splice(idx, 1) }" />
                </div>
              </div>
              <div class="grid grid-cols-12 gap-2 items-center mb-2">
                <label class="col-span-2 text-right pr-2">Sub Caption</label>
                <div class="col-span-10 w-full ml-0">
                  <UInput v-model="item.subCaption" placeholder="Sub Caption" class="w-full" />
                </div>
              </div>
              <div class="grid grid-cols-12 gap-2 items-center mb-2">
                <label class="col-span-2 text-right pr-2">Image URL</label>
                <div class="col-span-10 w-full ml-0">
                  <UInput v-model="item.imageUrl" placeholder="Image URL" class="w-full" />
                </div>
              </div>
              <div class="grid grid-cols-12 gap-2 items-center mb-2">
                <label class="col-span-2 text-right pr-2">Link Text</label>
                <div class="col-span-10 w-full ml-0">
                  <UInput v-model="item.linkText" placeholder="Link Text" class="w-full" />
                </div>
              </div>
              <div class="grid grid-cols-12 gap-2 items-center mb-2">
                <label class="col-span-2 text-right pr-2">Target URL</label>
                <div class="col-span-10 w-full ml-0">
                  <UInput v-model="item.targetUrl" placeholder="Target URL" class="w-full" />
                </div>
              </div>
              <div class="grid grid-cols-12 gap-2 items-center mb-2">
                <label class="col-span-2 text-right pr-2">Sort Order</label>
                <div class="col-span-10 w-full ml-0">
                  <UInput v-model="item.sortOrder" type="number" min="0" class="w-full" />
                </div>
              </div>
            </div>
            <UButton icon="i-lucide-plus" color="primary" variant="ghost" size="xs" class="mt-2" @click="(e) => { items.push({ caption: '', subCaption: '', imageUrl: '', linkText: '', targetUrl: '', sortOrder: items.length }) }">Add more</UButton>
          </div>
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
