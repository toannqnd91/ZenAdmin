<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const widgetName = ref('')
const widgetZone = ref('Home Main Content')
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref('')
const items = ref([
  { image: null, icon: '', title: '', description: '' }
])

const widgetZoneOptions = [
  { label: 'Home Main Content', value: 'Home Main Content' },
  { label: 'Home Featured', value: 'Home Featured' },
  { label: 'Home Banner', value: 'Home Banner' },
  { label: 'Home Bottom', value: 'Home Bottom' }
]

function addItem() {
  items.value.push({ image: null, icon: '', title: '', description: '' })
}
function removeItem(idx) {
  items.value.splice(idx, 1)
}
function onFileChange(file, idx) {
  items.value[idx].image = file
}
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
      <UDashboardNavbar title="Create SpaceBar Widget">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UCard class="w-full mt-6">
        <UForm class="space-y-6" @submit="onSave">
          <div class="text-3xl font-light mb-8">
            Create SpaceBar Widget
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
          <UDivider label="Items" class="my-4" />
          <div class="grid grid-cols-12 gap-4 items-start mb-2">
            <label class="col-span-2 text-right pr-2 pt-2">Items</label>
            <div class="col-span-10 w-full">
              <div v-for="(item, idx) in items" :key="idx" class="mb-4 border-b pb-4">
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Image</label>
                  <div class="col-span-8 w-full flex items-center gap-2">
                    <UFileUpload v-model="item.image" class="w-full" @update:model-value="file => onFileChange(file, idx)" />
                    <img
                      v-if="item.image && typeof item.image === 'string'"
                      :src="item.image"
                      alt="preview"
                      class="h-20 w-auto object-contain border"
                    >
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
                  <label class="col-span-2 text-right pr-2">Icon:</label>
                  <div class="col-span-10 w-full">
                    <UInput v-model="item.icon" placeholder="Icon" class="w-full" />
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Title:</label>
                  <div class="col-span-10 w-full">
                    <UInput v-model="item.title" placeholder="Title" class="w-full" />
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Description:</label>
                  <div class="col-span-10 w-full">
                    <UInput v-model="item.description" placeholder="Description" class="w-full" />
                  </div>
                </div>
              </div>
              <UButton
                icon="i-lucide-plus"
                color="primary"
                variant="ghost"
                size="2xs"
                class="mt-2"
                @click="addItem"
              >
                Add more
              </UButton>
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
