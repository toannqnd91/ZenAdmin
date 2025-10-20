<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { widgetsService } from '~/services/widgets.service'
import type { WidgetZone } from '~/services/widgets.service'
import { useNewsService } from '@/composables/useNewsService'
import type { NewsItem as NewsServiceItem } from '@/composables/useNews'

interface NewsItem {
  id: number
  name: string
  isPublished: boolean
  selected: boolean
}

const router = useRouter()
const route = useRoute()
const widgetId = computed(() => Number(route.params.id))

const widgetName = ref('')
const widgetZone = ref<string | undefined>(undefined)
const widgetZones = ref<WidgetZone[]>([])
const widgetZoneItems = ref<string[]>([])
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref('0')
const products = ref<NewsItem[]>([])
const isNewsModalOpen = ref(false)
const loading = ref(true)

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

const modalNews = ref<NewsItem[]>([])

onMounted(async () => {
  try {
    // Lấy danh sách zone
    const zoneRes = await widgetsService.getWidgetZones()
    if (zoneRes.success && zoneRes.data) {
      widgetZones.value = zoneRes.data
      widgetZoneItems.value = zoneRes.data.map((zone: WidgetZone) => zone.name)
    }
    // Lấy dữ liệu widget hiện tại qua service
    const widgetRes = await widgetsService.getSimpleNewsWidget(widgetId.value)
    if (widgetRes.success && widgetRes.data) {
      const w = widgetRes.data
      widgetName.value = w.name
      widgetZone.value = widgetZones.value.find(z => z.id === w.widgetZoneId)?.name || undefined
      publishStart.value = w.publishStart ? new Date(w.publishStart).toISOString().slice(0, 16) : ''
      publishEnd.value = w.publishEnd ? new Date(w.publishEnd).toISOString().slice(0, 16) : ''
      displayOrder.value = String(w.displayOrder ?? '0')
      products.value = (w.news || []).map(n => ({
        id: n.id,
        name: n.name,
        isPublished: n.isPublished,
        selected: true
      }))
    }
  } catch (err) {
    alert('Không thể tải dữ liệu widget!')
  } finally {
    loading.value = false
  }
})

function manageNews() {
  // Sync selected state với products
  const currentNews = allNews.value.map(news => ({ ...news }))
  currentNews.forEach((news) => {
    news.selected = products.value.some(p => p.id === news.id)
  })
  modalNews.value = currentNews
  isNewsModalOpen.value = true
}

function confirmNewsSelection() {
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

async function onSave() {
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
  const selectedZone = widgetZones.value.find(zone => zone.name === widgetZone.value)
  if (!selectedZone) {
    alert('Widget Zone không hợp lệ')
    return
  }
  function toISO(val: string) {
    if (!val) return new Date().toISOString()
    try {
      return new Date(val).toISOString()
    } catch {
      return new Date().toISOString()
    }
  }
  const payload = {
    id: widgetId.value,
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
    const res = await widgetsService.updateSimpleNewsWidget(widgetId.value, payload)
    if (res && (res.success || res.code === 'SUCCESS')) {
      alert('Cập nhật widget thành công!')
      router.push('/widgets')
    } else {
      alert('Lỗi: ' + (res?.message || 'Unknown error'))
    }
  } catch (err) {
    alert('Lỗi khi gọi API!')
  }
}

function onCancel() {
  router.back()
}
</script>

<template>
  <UCard class="w-full mt-6">
    <UForm
      :state="{
        widgetName,
        widgetZone,
        publishStart,
        publishEnd,
        displayOrder,
        products
      }"
      class="space-y-6"
      @submit="onSave"
    >
      <div class="text-3xl font-light mb-8">
        Edit Simple News Widget
      </div>
      <div v-if="loading" class="p-4 text-gray-500">
        Đang tải dữ liệu...
      </div>
      <div v-else>
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
            Lưu
          </UButton>
          <UButton color="neutral" variant="soft" @click="onCancel">
            Hủy
          </UButton>
        </div>
      </div>
    </UForm>
  </UCard>

  <!-- News Selection Modal -->
  <UModal
    v-model:open="isNewsModalOpen"
    title="Select News"
    description="Choose news items for your widget"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="max-h-96 overflow-y-auto">
        <div v-if="newsLoading" class="p-4 text-gray-500">
          Đang tải tin tức...
        </div>
        <div v-else-if="newsError" class="p-4 text-error">
          {{ newsError }}
        </div>
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
