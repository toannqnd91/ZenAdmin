<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const TinyMCESelfHost = defineAsyncComponent(() => import('@/components/TinyMCESelfHost.vue'))

const router = useRouter()
const route = useRoute()

const widgetId = route.params.id as string

const widgetName = ref('')
const widgetZone = ref<string | undefined>(undefined)
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref(0)
const htmlContent = ref('')
const isSubmitting = ref(false)
const isLoading = ref(true)

onMounted(async () => {
  try {
    isLoading.value = true
    // Mock data
    widgetName.value = 'Sample HTML Widget'
    widgetZone.value = 'Footer'
    htmlContent.value = '<div><h3>Welcome to our store!</h3><p>Check out our latest products.</p></div>'
    publishStart.value = '01/08/2025 09:00'
    publishEnd.value = '31/12/2025 23:59'
    displayOrder.value = 3
  } catch (error) {
    console.error('Error loading widget data:', error)
  } finally {
    isLoading.value = false
  }
})

async function onUpdate() {
  if (isSubmitting.value) return

  try {
    isSubmitting.value = true

    if (!widgetName.value.trim()) {
      alert('Widget Name is required')
      return
    }

    if (!htmlContent.value.trim()) {
      alert('HTML Content is required')
      return
    }

    alert('HTML widget updated successfully!')
    router.push('/widgets')
  } catch (error) {
    console.error('Error updating HTML widget:', error)
    alert('Failed to update HTML widget')
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
      <UDashboardNavbar title="Edit HTML Widget">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="p-6 w-full">
        <div v-if="isLoading" class="text-center py-8">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl text-primary mb-4" />
          <p class="text-gray-600">
            Loading widget data...
          </p>
        </div>

        <form v-else class="space-y-6" @submit.prevent="onUpdate">
          <div class="text-3xl font-light mb-8">
            Edit HTML Widget
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
              <UInput v-model="widgetZone" placeholder="Widget zone" class="w-full" />
            </div>
          </div>

          <div class="grid grid-cols-12 gap-4 items-start mb-2">
            <label class="col-span-2 text-right pr-2 pt-2">HTML Content</label>
            <div class="col-span-10 w-full">
              <TinyMCESelfHost
                v-model="htmlContent"
                placeholder="Enter HTML content"
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
  </UDashboardPanel>
</template>
