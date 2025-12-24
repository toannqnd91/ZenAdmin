<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { localizationService } from '~/services/localization.service'
import { widgetsService } from '~/services/widgets.service'

const router = useRouter()
const route = useRoute()

const widgetId = parseInt(route.params.id as string)
const entityType = 'WidgetInstanceDTO'

const isLoading = ref(false)
const isSaving = ref(false)
const isMounted = ref(false)

// Widget metadata (read-only)
const widgetName = ref('')
const widgetZone = ref('')
const displayOrder = ref(0)
const publishStart = ref('')
const publishEnd = ref('')

// Vietnamese data (read-only for reference)
const vnSlides = ref<any[]>([])

// English translation data
const enSlides = ref<Array<{
    Caption: string
    SubCaption: string
    Description: string
    LinkText: string
    SortOrder: number
}>>([])

onMounted(async () => {
    isMounted.value = true
    await loadData()
})

async function loadData() {
    isLoading.value = true
    try {
        // Load widget data (Vietnamese)
        const widgetResponse = await widgetsService.getWidgetInstance(widgetId)
        if (widgetResponse && widgetResponse.success && widgetResponse.data) {
            const data = widgetResponse.data

            // Load widget metadata
            widgetName.value = data.name || ''
            widgetZone.value = data.widgetZone || ''
            displayOrder.value = data.displayOrder || 0
            publishStart.value = data.publishStart || ''
            publishEnd.value = data.publishEnd || ''

            // Parse Vietnamese carousel data
            const jsonDataString = data.data || data.htmlData
            if (jsonDataString) {
                const jsonData = typeof jsonDataString === 'string' ? JSON.parse(jsonDataString) : jsonDataString
                vnSlides.value = Array.isArray(jsonData) ? jsonData : []

                // Initialize English slides structure based on Vietnamese slides
                enSlides.value = vnSlides.value.map((slide, idx) => ({
                    Caption: '',
                    SubCaption: '',
                    Description: '',
                    LinkText: '',
                    SortOrder: slide.SortOrder ?? idx
                }))
            }
        }

        // Load existing English translation
        const result = await localizationService.getTranslation(entityType, widgetId, 'en-US')

        if (result && result.success && result.data) {
            // Parse Data field if it exists (might be JSON string)
            let translationData = result.data
            if (result.data.Data) {
                try {
                    const parsedData = typeof result.data.Data === 'string'
                        ? JSON.parse(result.data.Data)
                        : result.data.Data
                    translationData = { ...parsedData, ...result.data }
                } catch (e) {
                    console.error('Error parsing Data field:', e)
                }
            }

            // Load translation data
            if (translationData.Data) {
                const translatedSlides = typeof translationData.Data === 'string'
                    ? JSON.parse(translationData.Data)
                    : translationData.Data

                if (Array.isArray(translatedSlides)) {
                    translatedSlides.forEach((enSlide: any, idx: number) => {
                        if (enSlides.value[idx]) {
                            enSlides.value[idx].Caption = enSlide.Caption || ''
                            enSlides.value[idx].SubCaption = enSlide.SubCaption || ''
                            enSlides.value[idx].Description = enSlide.Description || ''
                            enSlides.value[idx].LinkText = enSlide.LinkText || ''
                        }
                    })
                }
            }
        }
    } catch (error) {
        console.error('Error loading data:', error)
    } finally {
        isLoading.value = false
    }
}

function addSlide() {
    const newSortOrder = enSlides.value.length > 0
        ? Math.max(...enSlides.value.map(s => s.SortOrder)) + 1
        : 0
    enSlides.value.push({
        Caption: '',
        SubCaption: '',
        Description: '',
        LinkText: '',
        SortOrder: newSortOrder
    })
}

function removeSlide(idx: number) {
    if (enSlides.value.length <= 1) return
    enSlides.value.splice(idx, 1)
}

async function handleSubmit() {
    isSaving.value = true
    try {
        // Build complete carousel data combining English translations with Vietnamese non-translatable fields
        const carouselData = enSlides.value.map((enSlide, idx) => {
            const vnSlide = vnSlides.value[idx] || {}
            return {
                ImageUrl: vnSlide.ImageUrl || '',
                Caption: enSlide.Caption || '',
                SubCaption: enSlide.SubCaption || '',
                Description: enSlide.Description || null,
                LinkText: enSlide.LinkText || '',
                TargetUrl: vnSlide.TargetUrl || '',
                SortOrder: enSlide.SortOrder
            }
        })

        // Send as single Data field with JSON string
        const payload = {
            Data: JSON.stringify(carouselData)
        }


        const result = await localizationService.updateTranslation(
            entityType,
            widgetId,
            'en-US',
            payload as any
        )

        if (result && result.success) {
            alert('Translation saved successfully!')
            router.push('/widgets')
        } else {
            alert('Failed to save translation: ' + (result?.message || 'Unknown error'))
        }
    } catch (error) {
        console.error('Error saving translation:', error)
        alert('Failed to save translation')
    } finally {
        isSaving.value = false
    }
}

function handleCancel() {
    router.push('/widgets')
}

function formatDate(isoString: string): string {
    if (!isoString) return ''
    try {
        const date = new Date(isoString)
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch {
        return ''
    }
}
</script>

<template>
    <Teleport to="#navbar-actions" v-if="isMounted">
        <div class="flex items-center gap-2">
            <UButton label="Lưu thay đổi" icon="i-lucide-save" color="primary" :loading="isSaving"
                @click="handleSubmit" />
        </div>
    </Teleport>

    <div class="w-full max-w-6xl mx-auto px-4 lg:px-6 py-6">
        <div v-if="isLoading" class="text-center py-20">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl text-primary mb-4" />
            <p class="text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</p>
        </div>

        <div v-else class="flex flex-col lg:flex-row gap-6">
            <!-- Left Column: Translation Content -->
            <div class="flex-1 space-y-6">
                <!-- Slides -->
                <UPageCard title="Slides - English Translation" variant="soft" class="bg-white rounded-lg">
                    <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                        <div v-for="(slide, idx) in enSlides" :key="idx"
                            class="py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 relative">
                            <div class="absolute top-4 right-0">
                                <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs"
                                    title="Xoá slide" @click="() => removeSlide(idx)"
                                    :disabled="enSlides.length <= 1" />
                            </div>

                            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Slide #{{ idx + 1 }}
                            </h3>

                            <!-- Image Preview -->
                            <div v-if="vnSlides[idx]?.ImageUrl" class="mb-4">
                                <label
                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image</label>
                                <img :src="vnSlides[idx].ImageUrl" alt="Slide image"
                                    class="w-full max-w-md h-48 object-cover rounded border border-gray-200 dark:border-gray-700" />
                            </div>

                            <div class="space-y-3">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Caption
                                        <span class="text-xs text-gray-500 ml-2" v-if="vnSlides[idx]">
                                            (VN: {{ vnSlides[idx].Caption }})
                                        </span>
                                    </label>
                                    <input v-model="slide.Caption" type="text" placeholder="Enter English caption"
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Sub Caption
                                        <span class="text-xs text-gray-500 ml-2" v-if="vnSlides[idx]">
                                            (VN: {{ vnSlides[idx].SubCaption }})
                                        </span>
                                    </label>
                                    <input v-model="slide.SubCaption" type="text"
                                        placeholder="Enter English sub caption"
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description (Optional)
                                    </label>
                                    <div v-if="vnSlides[idx]?.Description"
                                        class="mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                        <p class="text-xs text-gray-500 dark:text-gray-400">VN: {{
                                            vnSlides[idx].Description
                                            }}</p>
                                    </div>
                                    <textarea v-model="slide.Description" rows="2"
                                        placeholder="Enter English description"
                                        class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Link Text (Optional)
                                        <span class="text-xs text-gray-500 ml-2" v-if="vnSlides[idx]?.LinkText">
                                            (VN: {{ vnSlides[idx].LinkText }})
                                        </span>
                                    </label>
                                    <input v-model="slide.LinkText" type="text" placeholder="Enter English link text"
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-end pt-2">
                            <UButton label="Thêm Slide" icon="i-lucide-plus" variant="soft" @click="addSlide" />
                        </div>
                    </div>
                </UPageCard>
            </div>
            <!-- End Left Column -->

            <!-- Right Column: Widget Metadata (Read-only) -->
            <div class="w-full lg:w-80 space-y-6">
                <UPageCard title="Thông tin widget" variant="soft" class="bg-white rounded-lg">
                    <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tên
                                Widget</label>
                            <input :value="widgetName" disabled
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vị trí
                                (Zone)</label>
                            <input :value="widgetZone" disabled
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thứ tự hiển
                                thị</label>
                            <input :value="displayOrder" disabled
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Widget
                                ID</label>
                            <input :value="widgetId" disabled
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                        </div>
                    </div>
                </UPageCard>

                <UPageCard title="Thời gian xuất bản" variant="soft" class="bg-white rounded-lg">
                    <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngày bắt
                                đầu</label>
                            <input :value="formatDate(publishStart)" disabled
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngày kết
                                thúc</label>
                            <input :value="formatDate(publishEnd)" disabled
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                        </div>
                    </div>
                </UPageCard>
            </div>
            <!-- End Right Column -->
        </div>
    </div>
</template>
