<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const widgetName = ref('')
const widgetZone = ref('')
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref(0)
const jsonData = ref('')
const isSubmitting = ref(false)

function validateJson(str: string) {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

async function onSave() {
  if (isSubmitting.value) return
  if (!widgetName.value.trim()) {
    alert('Widget Name is required')
    return
  }
  if (!widgetZone.value.trim()) {
    alert('Widget Zone is required')
    return
  }
  if (!jsonData.value.trim()) {
    alert('Custom Data (JSON) is required')
    return
  }
  if (!validateJson(jsonData.value)) {
    alert('Custom Data phải là JSON hợp lệ!')
    return
  }
  isSubmitting.value = true
  try {
    // TODO: Gọi API tạo widget custom-data
    // const response = await widgetsService.createCustomDataWidget(...)
    // if (response.success) { ... }
    alert('Custom Data Widget created! (Demo)')
    router.push('/widgets')
  } catch (e) {
    alert('Có lỗi khi tạo widget!')
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
              <UInput v-model="widgetZone" placeholder="Enter widget zone" class="w-full" />
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
          <UDivider label="Custom Data (JSON)" class="my-4" />
          <div class="grid grid-cols-12 gap-4 items-start mb-2">
            <label class="col-span-2 text-right pr-2 pt-2">Custom Data</label>
            <div class="col-span-10 w-full">
              <UTextarea v-model="jsonData" placeholder="Nhập dữ liệu JSON..." class="w-full font-mono min-h-[120px]" />
              <div v-if="jsonData && !validateJson(jsonData)" class="text-error text-xs mt-1">JSON không hợp lệ!</div>
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
