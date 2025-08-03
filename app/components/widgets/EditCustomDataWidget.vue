<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { widgetsService } from '@/services/widgets.service'

const router = useRouter()
const route = useRoute()

const widgetId = route.params.id as string
const widgetType = route.params.widgetType as string

const name = ref('')
const widgetZoneId = ref(1)
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref(0)
const items = ref([
  { caption: '', subCaption: '', imageUrl: '', linkText: '', targetUrl: '', sortOrder: 0 }
])
const isSubmitting = ref(false)

async function fetchWidget() {
  try {
    const response = await widgetsService.getCustomDataWidget(Number(widgetId))
    if (response.success && response.data) {
      const data = response.data
      name.value = data.name
      widgetZoneId.value = data.widgetZoneId
      publishStart.value = data.publishStart?.slice(0, 16).replace('T', ' ') || ''
      publishEnd.value = data.publishEnd?.slice(0, 16).replace('T', ' ') || ''
      displayOrder.value = data.displayOrder
      items.value = data.items || []
    }
  } catch (e) {
    alert('Không lấy được dữ liệu widget!')
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
      widgetZoneId: widgetZoneId.value,
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
    <form class="space-y-6" @submit.prevent="onUpdate">
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
        <label class="col-span-2 text-right pr-2">Widget Zone ID</label>
        <div class="col-span-10 w-full">
          <UInput v-model="widgetZoneId" type="number" min="1" class="w-full" />
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
