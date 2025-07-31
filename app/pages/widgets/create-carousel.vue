<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const widgetName = ref('')
const widgetZone = ref('Home Featured')
const publishStart = ref()
const publishEnd = ref()
const displayOrder = ref()

const items = ref([
  { caption: '', subCaption: '', linkUrl: '', linkText: '', image: null }
])

function addItem() {
  items.value.push({ caption: '', subCaption: '', linkUrl: '', linkText: '', image: null })
}
function removeItem(idx: number) {
  items.value.splice(idx, 1)
}
function onFileChange(file: File | null, idx: number) {
  items.value[idx].image = file
}
function onSave() {
  // TODO: submit logic
  alert('Saved!')
}
function onCancel() {
  router.back()
}

const widgetZoneOptions = [
  { label: 'Home Featured', value: 'Home Featured' },
  { label: 'Home Banner', value: 'Home Banner' },
  { label: 'Home Bottom', value: 'Home Bottom' }
]
</script>
<template>
  <UDashboardPanel class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Create Carousel Widget">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UCard class="w-full mt-6">
        <UForm @submit="onSave" class="space-y-6">
          <div class="text-3xl font-light mb-8">Create Carousel Widget</div>
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
            <div class="col-span-2"></div>
            <div class="col-span-10 text-xs text-gray-400">Định dạng: dd/MM/yyyy HH:mm (ví dụ: 31/07/2025 15:30)</div>
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
                  <div class="col-span-8 w-full">
                    <UInput v-model="item.caption" placeholder="Caption" class="w-full" />
                  </div>
                  <div class="col-span-2 flex justify-end">
                    <UButton
                      v-if="items.length > 1"
                      icon="i-lucide-x"
                      color="error"
                      variant="soft"
                      size="xs"
                      @click="() => removeItem(idx)"
                      title="Remove item"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Sub Caption</label>
                  <div class="col-span-8 w-full">
                    <UInput v-model="item.subCaption" placeholder="Sub Caption" class="w-full" />
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Link Url</label>
                  <div class="col-span-8 w-full">
                    <UInput v-model="item.linkUrl" placeholder="https://..." class="w-full" />
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Link Text</label>
                  <div class="col-span-8 w-full">
                    <UInput v-model="item.linkText" placeholder="Link Text" class="w-full" />
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center mb-2">
                  <label class="col-span-2 text-right pr-2">Image</label>
                  <div class="col-span-8 w-full">
                    <UFileUpload v-model="item.image" @update:model-value="file => onFileChange(file, idx)" class="w-full" />
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
            <UButton icon="i-lucide-check" color="primary" type="submit">Save</UButton>
            <UButton color="neutral" variant="soft" @click="onCancel">Cancel</UButton>
          </div>
        </UForm>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
