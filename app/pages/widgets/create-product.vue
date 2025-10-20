<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const widgetName = ref('')
const widgetZone = ref('Home Featured')
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref('')

const category = ref('')
const numberOfProducts = ref(4)
const orderBy = ref('Newest')
const isFeaturedOnly = ref(false)

const categoryOptions = [
  { label: '@Localizer["All Categories"]', value: '' },
  { label: 'Cordyceps', value: 'cordyceps' },
  { label: 'Tea', value: 'tea' },
  { label: 'Extract', value: 'extract' }
]
const orderByOptions = [
  { label: 'Newest', value: 'Newest' },
  { label: 'Oldest', value: 'Oldest' },
  { label: 'Price: Low to High', value: 'PriceAsc' },
  { label: 'Price: High to Low', value: 'PriceDesc' }
]

const widgetZoneOptions = [
  { label: 'Home Featured', value: 'Home Featured' },
  { label: 'Home Banner', value: 'Home Banner' },
  { label: 'Home Bottom', value: 'Home Bottom' }
]
const productOptions = [
  { label: 'Cordyceps Capsule', value: 'Cordyceps Capsule' },
  { label: 'Cordyceps Tea', value: 'Cordyceps Tea' },
  { label: 'Cordyceps Extract', value: 'Cordyceps Extract' }
]

function onSave() {
  // TODO: submit logic
  alert('Saved!')
}
function onCancel() {
  router.back()
}
</script>

<template>
  <UDashboardPanel class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Create Product Widget">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UCard class="w-full mt-6">
        <UForm class="space-y-6" @submit="onSave">
          <div class="text-3xl font-light mb-8">
            Create Product Widget
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
              <USelect v-model="widgetZone" :options="widgetZoneOptions" class="w-full" />
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
              <UInput
                v-model="displayOrder"
                type="number"
                min="0"
                placeholder="0"
                class="w-full"
              />
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <label class="col-span-2 text-right pr-2">Category</label>
            <div class="col-span-10 w-full">
              <USelect v-model="category" :options="categoryOptions" class="w-full" />
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <label class="col-span-2 text-right pr-2">Number of Products</label>
            <div class="col-span-10 w-full">
              <UInput
                v-model="numberOfProducts"
                type="number"
                min="1"
                class="w-full"
              />
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <label class="col-span-2 text-right pr-2">Order By</label>
            <div class="col-span-10 w-full">
              <USelect v-model="orderBy" :options="orderByOptions" class="w-full" />
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 items-center mb-2">
            <div class="col-span-2" />
            <div class="col-span-10 w-full flex items-center">
              <UCheckbox v-model="isFeaturedOnly" class="mr-2" />
              <span>Is Featured Products Only</span>
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
        </UForm>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
