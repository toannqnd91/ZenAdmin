<script setup lang="ts">

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { widgetsService } from '@/services/widgets.service'

const router = useRouter()

const widgetName = ref('')
const widgetZone = ref<string | undefined>(undefined)
const widgetZones = ref<{ id: number; name: string; description: string | null }[]>([])
const widgetZoneItems = ref<{ label: string; value: string }[]>([])
onMounted(async () => {
  const response = await widgetsService.getWidgetZones()
  if (response.success && response.data) {
    widgetZones.value = response.data
    widgetZoneItems.value = response.data.map(zone => ({ label: zone.name, value: zone.name }))
    if (!widgetZone.value && widgetZoneItems.value.length > 0) {
      widgetZone.value = widgetZoneItems.value[0].value
    }
  }
})
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref(0)
const items = ref([
  { caption: '', subCaption: '', imageUrl: '', linkText: '', targetUrl: '', sortOrder: 0 }
])
const isSubmitting = ref(false)

function validateJson(str: string) {
  return true // Không dùng nữa
}

async function onSave() {
  if (isSubmitting.value) return
  if (!widgetName.value.trim()) {
    alert('Widget Name is required')
    return
  }
  if (!widgetZone.value) {
    alert('Widget Zone is required')
    return
  }
  // Không cần validate jsonData nữa
  isSubmitting.value = true
  try {
    // Chuẩn hóa dữ liệu gửi lên API
    const payload = {
      id: 0,
      name: widgetName.value,
      widgetZoneId: (() => {
        const selectedZone = widgetZones.value.find(zone => zone.name === widgetZone.value)
        return selectedZone ? selectedZone.id : 1
      })(),
      publishStart: publishStart.value ? new Date(publishStart.value.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:00')).toISOString() : '',
      publishEnd: publishEnd.value ? new Date(publishEnd.value.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:00')).toISOString() : '',
      displayOrder: displayOrder.value,
      items: items.value
    }
    const response = await widgetsService.createCustomDataWidget(payload)
    if (response.success) {
      alert('Custom Data Widget created!')
      router.push('/widgets')
    } else {
      alert('Tạo widget thất bại: ' + (response.message || 'Unknown error'))
    }
  } catch (e) {
    alert('Có lỗi khi tạo widget!')
  } finally {
    isSubmitting.value = false
  }
}

function onCancel() {
  router.back()
}

function handleFileChange(e: Event, idx: number) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    const reader = new FileReader()
    reader.onload = function(ev) {
      items.value[idx].imageUrl = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}
</script>
<template>
  <UDashboardPanel class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Create Custom Data Widget">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UCard class="w-full mt-6">
        <form @submit.prevent="onSave" class="space-y-6">
          <div class="text-3xl font-light mb-8">Create Custom Data Widget</div>
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
              <UInput v-model="publishStart" placeholder="dd/MM/yyyy HH:mm" class="w-full" />
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <label class="col-span-2 text-right pr-2">Publish End</label>
            <div class="col-span-10 w-full">
              <UInput v-model="publishEnd" placeholder="dd/MM/yyyy HH:mm" class="w-full" />
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
              <UInput v-model="displayOrder" type="number" min="0" placeholder="0" class="w-full" />
            </div>
          </div>
          <UDivider label="Items" class="my-4" />
          <div class="grid grid-cols-12 gap-4 items-start mb-2">
            <label class="col-span-2 text-right pr-2 pt-2">Items</label>
            <div class="col-span-10 w-full">
              <div v-for="(item, idx) in items" :key="idx" class="mb-4 border-b pb-4">
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Caption</label>
                  <div class="col-span-10 w-full">
                    <UInput v-model="item.caption" placeholder="Caption" class="w-full" />
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Sub Caption</label>
                  <div class="col-span-10 w-full">
                    <UInput v-model="item.subCaption" placeholder="Sub Caption" class="w-full" />
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Image URL</label>
                  <div class="col-span-10 w-full">
                    <UInput type="file" class="w-full" @change="(e) => handleFileChange(e, idx)" />
                    <div v-if="item.imageUrl" class="mt-2 text-xs text-gray-500">{{ item.imageUrl }}</div>
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Link Text</label>
                  <div class="col-span-10 w-full">
                    <UInput v-model="item.linkText" placeholder="Link Text" class="w-full" />
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Target URL</label>
                  <div class="col-span-10 w-full">
                    <UInput v-model="item.targetUrl" placeholder="Target URL" class="w-full" />
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Sort Order</label>
                  <div class="col-span-10 w-full">
                    <UInput v-model="item.sortOrder" type="number" min="0" placeholder="0" class="w-full" />
                  </div>
                </div>
                <div class="flex justify-end mb-2">
                  <UButton v-if="items.length > 1" icon="i-lucide-x" color="error" variant="soft" size="xs" title="Remove item" @click="(e) => { items.splice(idx, 1) }" />
                </div>
              </div>
              <UButton icon="i-lucide-plus" color="primary" variant="ghost" size="xs" class="mt-2" @click="(e) => { items.push({ caption: '', subCaption: '', imageUrl: '', linkText: '', targetUrl: '', sortOrder: items.length }) }">Add more</UButton>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <UButton icon="i-lucide-check" color="primary" type="submit" :loading="isSubmitting">Save</UButton>
            <UButton color="neutral" variant="soft" @click="onCancel">Cancel</UButton>
          </div>
        </form>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
