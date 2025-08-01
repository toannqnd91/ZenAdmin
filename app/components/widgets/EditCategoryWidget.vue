<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const widgetId = route.params.id as string

const widgetName = ref('')
const widgetZone = ref<string | undefined>(undefined)
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref(0)
const selectedCategory = ref<string | undefined>(undefined)
const isSubmitting = ref(false)
const isLoading = ref(true)

const categories = ref([
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports'
])

onMounted(async () => {
  try {
    isLoading.value = true
    console.log('Loading category widget data for ID:', widgetId)
    
    // Mock data
    widgetName.value = 'Sample Category Widget'
    widgetZone.value = 'Sidebar'
    selectedCategory.value = 'Electronics'
    publishStart.value = '01/08/2025 09:00'
    publishEnd.value = '31/12/2025 23:59'
    displayOrder.value = 2
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

    if (!selectedCategory.value) {
      alert('Category is required')
      return
    }

    console.log('Updating category widget:', widgetId)
    alert('Category widget updated successfully!')
    router.push('/widgets')
  } catch (error) {
    console.error('Error updating category widget:', error)
    alert('Failed to update category widget')
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
      <UDashboardNavbar title="Edit Category Widget">
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
            Edit Category Widget
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
          
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <label class="col-span-2 text-right pr-2">Category</label>
            <div class="col-span-10 w-full">
              <USelect
                v-model="selectedCategory"
                :items="categories"
                placeholder="Select category"
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
