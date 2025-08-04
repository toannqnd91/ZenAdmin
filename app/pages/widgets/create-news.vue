<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { widgetsService, type WidgetZone } from '~/services/widgets.service'
import { NewsService } from '~/services/news.service'

const router = useRouter()

const widgetName = ref('')
const widgetZone = ref<string | undefined>(undefined)
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref('')

const category = ref(0)
const numberOfNews = ref(4)
const isFeaturedOnly = ref(false)

const categoryOptions = ref<{ label: string, value: string | number }[]>([])
const orderByOptions = [
  { label: 'Newest', value: 0 },
  { label: 'Most Viewed', value: 1 },
  { label: 'Most Commented', value: 2 }
]

const orderBy = ref(0)


const widgetZones = ref<WidgetZone[]>([])
const widgetZoneItems = ref<string[]>([])
onMounted(async () => {
  try {
    // Widget Zones
    const response = await widgetsService.getWidgetZones()
    if (response.success && response.data) {
      widgetZones.value = response.data
      widgetZoneItems.value = response.data.map((zone: WidgetZone) => zone.name)
      if (response.data.length > 0) {
        widgetZone.value = response.data[0]?.name || undefined
      }
    }
    // News Categories
    const newsService = new NewsService()
    const catRes = await newsService.getCategories()
    if (catRes && catRes.data) {
      categoryOptions.value = [
        { label: 'Tất cả danh mục', value: 0 },
        ...catRes.data.map((cat: any) => ({ label: cat.name, value: cat.id }))
      ]
      category.value = 0
    }
  } catch (error) {
    console.error('Error loading widget zones or categories:', error)
  }
})
const productOptions = [
  { label: 'Cordyceps Capsule', value: 'Cordyceps Capsule' },
  { label: 'Cordyceps Tea', value: 'Cordyceps Tea' },
  { label: 'Cordyceps Extract', value: 'Cordyceps Extract' }
]

function onSave() {
  // Submit logic, orderBy là int
  const payload = {
    // ...other fields
    orderBy: orderBy.value,
  }
  alert('Saved! orderBy: ' + orderBy.value)
}
function onCancel() {
  router.back()
}
</script>
<template>
  <UDashboardPanel class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Create News Widget">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UCard class="w-full mt-6">
        <UForm @submit="onSave" class="space-y-6">
          <div class="text-3xl font-light mb-8">Create News Widget</div>
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
              <UInput v-model="publishStart" type="datetime-local" class="w-full" />
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <label class="col-span-2 text-right pr-2">Publish End</label>
            <div class="col-span-10 w-full">
              <UInput v-model="publishEnd" type="datetime-local" class="w-full" />
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <label class="col-span-2 text-right pr-2">Display Order</label>
            <div class="col-span-10 w-full">
              <UInput v-model="displayOrder" type="number" min="0" placeholder="0" class="w-full" />
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <label class="col-span-2 text-right pr-2">Category</label>
            <div class="col-span-10 w-full">
              <USelect v-model="category" :items="categoryOptions" placeholder="Select category" class="w-full" />
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <label class="col-span-2 text-right pr-2">Number of News</label>
            <div class="col-span-10 w-full">
              <UInput v-model="numberOfNews" type="number" min="1" class="w-full" />
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <label class="col-span-2 text-right pr-2">Order By</label>
            <div class="col-span-10 w-full">
              <USelect v-model="orderBy" :items="orderByOptions" placeholder="Select order" class="w-full" />
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <div class="col-span-2"></div>
            <div class="col-span-10 w-full flex items-center">
              <UCheckbox v-model="isFeaturedOnly" class="mr-2" />
              <span>Is Featured News Only</span>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <UButton icon="i-lucide-check" color="primary" type="submit">Save</UButton>
            <UButton color="neutral" variant="soft" @click="onCancel">Cancel</UButton>
          </div>
        </UForm>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
