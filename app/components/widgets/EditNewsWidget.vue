<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { widgetsService } from '~/services/widgets.service'
import { NewsService } from '~/services/news.service'
import type { WidgetZone, CreateNewsWidgetRequest } from '~/services/widgets.service'

const router = useRouter()
const route = useRoute()

const widgetId = Number(route.params.id)

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
  { label: 'Mới nhất', value: 0 },
  { label: 'Xem nhiều', value: 1 },
  { label: 'Bình luận nhiều', value: 2 }
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
    }
    // News Categories
    const newsService = new NewsService()
    const catRes = await newsService.getCategories()
    if (catRes && catRes.data) {
      categoryOptions.value = [
        { label: 'Tất cả danh mục', value: 0 },
        ...catRes.data.map((cat: any) => ({ label: cat.name, value: cat.id }))
      ]
    }
    // Load widget data
    const widgetRes = await widgetsService.getNewsWidget(widgetId)
    if (widgetRes.success && widgetRes.data) {
      const w = widgetRes.data
      widgetName.value = w.name
      widgetZone.value = widgetZones.value.find(z => z.id === w.widgetZoneId)?.name
      publishStart.value = w.publishStart || ''
      publishEnd.value = w.publishEnd || ''
      displayOrder.value = String(w.displayOrder)
      
      // Lấy setting từ API response
      if (w.setting) {
        numberOfNews.value = w.setting.numberOfNews
        category.value = w.setting.categoryId ?? 0
        orderBy.value = w.setting.orderBy
        isFeaturedOnly.value = w.setting.featuredOnly
      }
    }
  } catch (error) {
    console.error('Lỗi tải dữ liệu widget:', error)
  }
})

async function onUpdateNewsWidget() {
  try {
    const selectedZone = widgetZones.value.find(zone => zone.name === widgetZone.value)
    if (!selectedZone) {
      alert('Vui lòng chọn vị trí widget')
      return
    }
    const payload: CreateNewsWidgetRequest = {
      id: widgetId,
      name: widgetName.value,
      widgetZoneId: selectedZone.id,
      publishStart: publishStart.value || null,
      publishEnd: publishEnd.value || null,
      displayOrder: parseInt(displayOrder.value) || 0,
      setting: {
        numberOfNews: numberOfNews.value,
        categoryId: category.value === 0 ? null : category.value,
        orderBy: orderBy.value,
        featuredOnly: isFeaturedOnly.value
      }
    }
    const response = await widgetsService.updateNewsWidget(widgetId, payload)
    if (response.success) {
      alert('Cập nhật widget thành công!')
      router.back()
    } else {
      alert('Cập nhật thất bại: ' + response.message)
    }
  } catch (error: unknown) {
    console.error('Lỗi cập nhật widget:', error)
    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định'
    alert('Lỗi cập nhật widget: ' + errorMessage)
  }
}
function onCancel() {
  router.back()
}
</script>

<template>
  <UCard class="w-full mt-6">
    <form @submit.prevent="onUpdateNewsWidget" class="space-y-6">
      <div class="text-3xl font-light mb-8">Cập nhật News Widget</div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <label class="col-span-2 text-right pr-2">Tên Widget</label>
        <div class="col-span-10 w-full">
          <UInput v-model="widgetName" placeholder="Nhập tên widget" class="w-full" />
        </div>
      </div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <label class="col-span-2 text-right pr-2">Vị trí Widget</label>
        <div class="col-span-10 w-full">
          <USelect
            v-model="widgetZone"
            :items="widgetZoneItems"
            placeholder="Chọn vị trí widget"
            class="w-full"
          />
        </div>
      </div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <label class="col-span-2 text-right pr-2">Thời gian bắt đầu</label>
        <div class="col-span-10 w-full">
          <UInput v-model="publishStart" type="datetime-local" class="w-full" />
        </div>
      </div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <label class="col-span-2 text-right pr-2">Thời gian kết thúc</label>
        <div class="col-span-10 w-full">
          <UInput v-model="publishEnd" type="datetime-local" class="w-full" />
        </div>
      </div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <label class="col-span-2 text-right pr-2">Thứ tự hiển thị</label>
        <div class="col-span-10 w-full">
          <UInput v-model="displayOrder" type="number" min="0" placeholder="0" class="w-full" />
        </div>
      </div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <label class="col-span-2 text-right pr-2">Danh mục</label>
        <div class="col-span-10 w-full">
          <USelect v-model="category" :items="categoryOptions" placeholder="Chọn danh mục" class="w-full" />
        </div>
      </div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <label class="col-span-2 text-right pr-2">Số lượng tin</label>
        <div class="col-span-10 w-full">
          <UInput v-model="numberOfNews" type="number" min="1" class="w-full" />
        </div>
      </div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <label class="col-span-2 text-right pr-2">Sắp xếp theo</label>
        <div class="col-span-10 w-full">
          <USelect v-model="orderBy" :items="orderByOptions" placeholder="Chọn kiểu sắp xếp" class="w-full" />
        </div>
      </div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <div class="col-span-2"></div>
        <div class="col-span-10 w-full flex items-center">
          <UCheckbox v-model="isFeaturedOnly" class="mr-2" />
          <span>Chỉ lấy tin nổi bật</span>
        </div>
      </div>
      <div class="flex gap-2 mt-4">
        <UButton icon="i-lucide-check" color="primary" type="submit">Cập nhật</UButton>
        <UButton color="neutral" variant="soft" @click="onCancel">Hủy</UButton>
      </div>
    </form>
  </UCard>
</template>
