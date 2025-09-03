<script setup lang="ts">

import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { widgetsService } from '~/services/widgets.service'
import type { WidgetZone, CreateSimpleNewsWidgetRequest } from '~/services/widgets.service'
import { useNewsService } from '@/composables/useNewsService'
import type { NewsItem as NewsServiceItem } from '@/composables/useNews'

interface NewsItem {
  id: number
  name: string
  isPublished: boolean
  selected: boolean
}

interface FormData {
  widgetName: string
  widgetZone: string
  publishStart: string
  publishEnd: string
  displayOrder: string
}

const router = useRouter()

const widgetName = ref('')
const widgetZone = ref<string | undefined>(undefined)
const widgetZones = ref<WidgetZone[]>([])
const widgetZoneItems = ref<string[]>([])
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref('0')
const products = ref<NewsItem[]>([])
const isNewsModalOpen = ref(false)

const formData = reactive<FormData>({
  widgetName: '',
  widgetZone: 'Home Main Content',
  publishStart: '',
  publishEnd: '',
  displayOrder: '0'
})

// Lấy danh sách tin tức từ service như trang /news
const {
  filteredNews,
  loading: newsLoading,
  error: newsError
} = await useNewsService()

const allNews = computed<NewsItem[]>(() =>
  filteredNews.value.map((item: NewsServiceItem) => ({
    id: item.id,
    name: item.title,
    isPublished: !!item.published,
    selected: false
  }))
)

onMounted(async () => {
  try {
    const response = await widgetsService.getWidgetZones()
    if (response.success && response.data) {
      widgetZones.value = response.data
      widgetZoneItems.value = response.data.map((zone: WidgetZone) => zone.name)
      if (response.data.length > 0) {
        widgetZone.value = response.data[0]?.name || undefined
      }
    } else {
      console.error('Failed to load widget zones:', response.message)
    }
  } catch (error) {
    console.error('Error loading widget zones:', error)
  }
})


async function onSave() {
  // Validate required fields
  if (!widgetName.value.trim()) {
    alert('Widget Name is required')
    return
  }
  if (!widgetZone.value) {
    alert('Widget Zone is required')
    return
  }
  if (!products.value.length) {
    alert('Vui lòng chọn ít nhất 1 tin tức')
    return
  }

  // Tìm zone object để lấy id
  const selectedZone = widgetZones.value.find(zone => zone.name === widgetZone.value)
  if (!selectedZone) {
    alert('Widget Zone không hợp lệ')
    return
  }

  // Format ngày về ISO
  function toISO(val: string) {
    if (!val) return new Date().toISOString()
    try {
      return new Date(val).toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  // Chuẩn bị dữ liệu gửi API
  const payload: CreateSimpleNewsWidgetRequest = {
    id: 0,
    name: widgetName.value,
    widgetZoneId: selectedZone.id,
    publishStart: toISO(publishStart.value),
    publishEnd: toISO(publishEnd.value),
    displayOrder: Number(displayOrder.value) || 0,
    news: products.value.map(n => ({
      id: n.id,
      name: n.name,
      isPublished: n.isPublished
    }))
  }

  try {
    const data = await widgetsService.createSimpleNewsWidget(payload)
    if (data.success) {
      alert('Tạo widget thành công!')
      router.push('/widgets')
    } else {
      alert('Lỗi: ' + (data.message || 'Unknown error'))
    }
  } catch {
    alert('Lỗi khi gọi API!')
  }
}

function onCancel() {
  router.back()
}

function manageNews() {
  // Sync selected state with current products
  // allNews là computed nên cần tạo bản sao để chỉnh selected
  const currentNews = allNews.value.map(news => ({ ...news }))
  currentNews.forEach((news) => {
    news.selected = products.value.some(p => p.id === news.id)
  })
  // Gán lại cho modal
  modalNews.value = currentNews
  isNewsModalOpen.value = true
}

const modalNews = ref<NewsItem[]>([])

function confirmNewsSelection() {
  // Update products with selected news
  products.value = modalNews.value.filter(news => news.selected).map(news => ({
    id: news.id,
    name: news.name,
    isPublished: news.isPublished,
    selected: news.selected
  }))
  isNewsModalOpen.value = false
}

function removeNews(idx: number) {
  products.value.splice(idx, 1)
}
</script>

<template>
  <UDashboardPanel class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Create Simple News Widget">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UCard class="w-full mt-6">
        <UForm
          :state="formData"
          class="space-y-6"
          @submit="onSave"
        >
          <div class="text-3xl font-light mb-8">
            Create Simple News Widget
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
            <label class="col-span-2 text-right pr-2">News</label>
            <div class="col-span-10 w-full">
              <UButton color="primary" variant="outline" @click="manageNews">
                Manage News
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
                  <th class="px-4 py-2 text-left font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!products.length">
                  <td colspan="3" class="px-4 py-2 text-gray-400">
                    No news selected
                  </td>
                </tr>
                <tr v-for="(prod, idx) in products" :key="idx">
                  <td class="px-4 py-2">
                    {{ prod.name }}
                  </td>
                  <td class="px-4 py-2">
                    {{ prod.isPublished ? 'Yes' : 'No' }}
                  </td>
                  <td class="px-4 py-2">
                    <UButton
                      icon="i-lucide-trash"
                      color="error"
                      variant="soft"
                      size="sm"
                      title="Remove"
                      @click="removeNews(idx)"
                    />
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

  <!-- News Selection Modal -->
  <UModal
    v-model:open="isNewsModalOpen"
    title="Select News"
    description="Choose news items for your widget"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="max-h-96 overflow-y-auto">
        <div v-if="newsLoading" class="p-4 text-gray-500">Đang tải tin tức...</div>
        <div v-else-if="newsError" class="p-4 text-error">{{ newsError }}</div>
        <div v-else>
          <div
            v-for="news in modalNews"
            :key="news.id"
            class="flex items-center space-x-3 py-2"
          >
            <input
              v-model="news.selected"
              type="checkbox"
              class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            >
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ news.name }}
              </p>
              <p class="text-xs text-gray-500">
                {{ news.isPublished ? 'Published' : 'Not Published' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        color="neutral"
        variant="outline"
        @click="close"
      >
        Cancel
      </UButton>
      <UButton
        color="primary"
        @click="confirmNewsSelection"
      >
        Confirm Selection
      </UButton>
    </template>
  </UModal>
</template>
