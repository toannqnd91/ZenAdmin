<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const widgetName = ref('')
const widgetZone = ref('Home Main Content')
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref('0')
const products = ref([])

const widgetZoneOptions = [
  { label: 'Home Main Content', value: 'Home Main Content' },
  { label: 'Home Featured', value: 'Home Featured' },
  { label: 'Home Banner', value: 'Home Banner' },
  { label: 'Home Bottom', value: 'Home Bottom' }
]

function onSave() {
  // TODO: submit logic
  alert('Saved!')
}
function onCancel() {
  router.back()
}
function manageProducts() {
  // TODO: open modal/select products
  alert('Open product manager!')
}
</script>

<template>
  <UDashboardPanel class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Create Simple Product Widget">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UCard class="w-full mt-6">
        <UForm class="space-y-6" @submit="onSave">
          <div class="text-3xl font-light mb-8">
            Create Simple Product Widget
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
            <label class="col-span-2 text-right pr-2">Products</label>
            <div class="col-span-10 w-full">
              <UButton color="primary" variant="outline" @click="manageProducts">
                Manage Products
              </UButton>
            </div>
          </div>
          <!-- Table -->
          <div class="col-span-12 w-full">
            <table class="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr class="bg-gray-50">
                  <th class="px-4 py-2 text-left font-semibold">
                    Name
                  </th>
                  <th class="px-4 py-2 text-left font-semibold">
                    Is Published
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!products.length">
                  <td colspan="2" class="px-4 py-2 text-gray-400">
                    No products selected
                  </td>
                </tr>
                <tr v-for="(prod, idx) in products" :key="idx">
                  <td class="px-4 py-2">
                    {{ prod.name }}
                  </td>
                  <td class="px-4 py-2">
                    {{ prod.isPublished ? 'Yes' : 'No' }}
                  </td>
                </tr>
              </tbody>
            </table>
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
