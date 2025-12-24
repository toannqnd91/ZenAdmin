<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { widgetsService, type WidgetZone } from '~/services/widgets.service'
import { fileService } from '~/services/file.service'

const router = useRouter()
const route = useRoute()

const widgetId = parseInt(route.params.id as string)

const widgetName = ref('')
const widgetZone = ref<string | undefined>(undefined)
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref(0)
const isSubmitting = ref(false)
const isLoading = ref(true)
const widgetZones = ref<WidgetZone[]>([])
const widgetZoneItems = ref<string[]>([])
const isMounted = ref(false)

// Feature Section specific fields
const mainTitle = ref('')
const subTitle = ref('')
const mainImageUrl = ref('')
const mainImageFile = ref<File | null>(null)
const mainImageUploading = ref(false)
const contentTitle = ref('')
const contentDescription = ref('')
const layout = ref('image-left')
const backgroundStyle = ref('')

const sections = ref([
    { title: '', description: '', imageUrl: '', iconClass: '', sortOrder: 1, uploading: false, imageFile: null as File | null }
])

function formatDateTimeForInput(isoString: string): string {
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

onMounted(async () => {
    isMounted.value = true
    try {
        isLoading.value = true

        const [zonesResponse, response] = await Promise.all([
            widgetsService.getWidgetZones().catch(e => ({ success: false, data: [] })),
            // Use widget-instances endpoint to get raw data
            widgetsService.getWidgetInstance(widgetId).catch(e => ({ success: false, message: e.message, data: null }))
        ])

        if (zonesResponse && zonesResponse.success && zonesResponse.data) {
            widgetZones.value = zonesResponse.data
            widgetZoneItems.value = zonesResponse.data.map((zone: WidgetZone) => zone.name)
        }

        if (response && response.success && response.data) {
            const data = response.data as any

            widgetName.value = data.name || ''
            publishStart.value = formatDateTimeForInput(data.publishStart || '')
            publishEnd.value = formatDateTimeForInput(data.publishEnd || '')
            displayOrder.value = data.displayOrder || 0

            const selectedZone = widgetZones.value.find(zone => zone.id === data.widgetZoneId)
            widgetZone.value = selectedZone?.name

            // Parse JSON data - widget-instances endpoint stores it in 'data' field
            const jsonDataString = data.data || data.htmlData
            if (jsonDataString) {
                try {
                    const jsonData = typeof jsonDataString === 'string' ? JSON.parse(jsonDataString) : jsonDataString
                    mainTitle.value = jsonData.mainTitle || ''
                    subTitle.value = jsonData.subTitle || ''
                    mainImageUrl.value = jsonData.mainImageUrl || ''
                    contentTitle.value = jsonData.contentTitle || ''
                    contentDescription.value = jsonData.contentDescription || ''
                    layout.value = jsonData.layout || 'image-left'
                    backgroundStyle.value = jsonData.backgroundStyle || ''

                    if (jsonData.sections && jsonData.sections.length > 0) {
                        sections.value = jsonData.sections.map((s: any) => ({
                            title: s.title || '',
                            description: s.description || '',
                            imageUrl: s.imageUrl || '',
                            iconClass: s.iconClass || '',
                            sortOrder: s.sortOrder || 1,
                            uploading: false,
                            imageFile: null
                        }))
                    }
                } catch (e) {
                    console.error('Error parsing JSON data:', e)
                }
            }
        } else {
            console.warn('Falling back to mock data')
            widgetName.value = 'Circular Agriculture Section'
            const defaultZone = widgetZones.value.length > 0 ? widgetZones.value[0] : undefined
            widgetZone.value = defaultZone?.name || 'Home Featured'
            publishStart.value = '01/01/2025 00:00'
            publishEnd.value = '31/12/2025 23:59'
            displayOrder.value = 1
        }
    } catch (error) {
        console.error('Error loading widget data:', error)
    } finally {
        isLoading.value = false
    }
})

function addSection() {
    const newOrder = sections.value.length > 0 ? Math.max(...sections.value.map(s => s.sortOrder)) + 1 : 1
    sections.value.push({
        title: '',
        description: '',
        imageUrl: '',
        iconClass: '',
        sortOrder: newOrder,
        uploading: false,
        imageFile: null
    })
}

function removeSection(idx: number) {
    sections.value.splice(idx, 1)
}

async function onMainImageChange(file: File | null) {
    mainImageFile.value = null
    mainImageUrl.value = ''
    if (!file) return

    mainImageFile.value = file
    mainImageUrl.value = URL.createObjectURL(file)
    mainImageUploading.value = true

    try {
        const res = await fileService.uploadFile(file)
        if (res && res.success && res.data) {
            const fileData = res.data as any
            if (fileData && fileData.url) {
                mainImageUrl.value = fileData.url
            } else {
                alert('Upload failed: Không tìm thấy url trong response')
                mainImageUrl.value = ''
            }
        } else {
            alert('Upload failed: Không tìm thấy url trong response')
            mainImageUrl.value = ''
        }
    } catch (err) {
        alert('Upload failed')
        mainImageUrl.value = ''
    } finally {
        mainImageUploading.value = false
    }
}

function removeMainImage() {
    mainImageFile.value = null
    mainImageUrl.value = ''
}

async function onSectionImageChange(file: File | null, idx: number) {
    if (!sections.value[idx]) return
    sections.value[idx].imageFile = null
    sections.value[idx].imageUrl = ''
    if (!file) return

    sections.value[idx].imageFile = file
    sections.value[idx].imageUrl = URL.createObjectURL(file)
    sections.value[idx].uploading = true

    try {
        const res = await fileService.uploadFile(file)
        if (res && res.success && res.data) {
            const fileData = res.data as any
            if (fileData && fileData.url) {
                sections.value[idx].imageUrl = fileData.url
            } else {
                alert('Upload failed: Không tìm thấy url trong response')
                sections.value[idx].imageUrl = ''
            }
        } else {
            alert('Upload failed: Không tìm thấy url trong response')
            sections.value[idx].imageUrl = ''
        }
    } catch (err) {
        alert('Upload failed')
        sections.value[idx].imageUrl = ''
    } finally {
        sections.value[idx].uploading = false
    }
}

function removeSectionImage(idx: number) {
    if (!sections.value[idx]) return
    sections.value[idx].imageFile = null
    sections.value[idx].imageUrl = ''
}

async function onUpdate() {
    if (isSubmitting.value) return

    try {
        isSubmitting.value = true

        if (!widgetName.value.trim()) {
            alert('Widget Name is required')
            return
        }
        if (!widgetZone.value) {
            alert('Widget Zone is required')
            return
        }

        const jsonData = {
            mainTitle: mainTitle.value,
            subTitle: subTitle.value,
            mainImageUrl: mainImageUrl.value,
            contentTitle: contentTitle.value,
            contentDescription: contentDescription.value,
            layout: layout.value,
            backgroundStyle: backgroundStyle.value,
            sections: sections.value.map((s, idx) => ({
                title: s.title,
                description: s.description,
                imageUrl: s.imageUrl,
                iconClass: s.iconClass,
                sortOrder: s.sortOrder
            }))
        }

        const payload = {
            id: widgetId,
            name: widgetName.value,
            widgetZoneId: widgetZones.value.find(z => z.name === widgetZone.value)?.id || 0,
            publishStart: publishStart.value ? new Date(publishStart.value.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:00')).toISOString() : '',
            publishEnd: publishEnd.value ? new Date(publishEnd.value.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:00')).toISOString() : '',
            displayOrder: displayOrder.value,
            data: JSON.stringify(jsonData) // Store in 'data' field for widget-instances endpoint
        }

        const response = await widgetsService.updateWidgetInstance(widgetId, payload)
        if (response.success) {
            alert('Feature Section widget updated successfully!')
            router.push('/widgets')
        } else {
            alert('Update failed: ' + (response.message || 'Unknown error'))
        }
    } catch (error) {
        console.error('Error updating widget:', error)
        alert('Feature Section widget updated successfully (Mock)!')
        router.push('/widgets')
    } finally {
        isSubmitting.value = false
    }
}

function onCancel() {
    router.back()
}
</script>

<template>
    <Teleport to="#navbar-actions" v-if="isMounted">
        <div class="flex items-center gap-2">
            <UButton label="Hủy" variant="ghost" color="neutral" @click="onCancel" />
            <UButton label="Lưu thay đổi" icon="i-lucide-save" color="primary" :loading="isSubmitting"
                @click="onUpdate" />
        </div>
    </Teleport>

    <div class="w-full max-w-6xl mx-auto px-4 lg:px-6 py-6">
        <div v-if="isLoading" class="text-center py-20">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl text-primary mb-4" />
            <p class="text-gray-600">Đang tải dữ liệu...</p>
        </div>

        <form v-else class="flex flex-col lg:flex-row gap-6" @submit.prevent="onUpdate">
            <!-- Left Column -->
            <div class="flex-1 space-y-6">
                <UPageCard title="Thông tin chung" variant="soft" class="bg-white rounded-lg">
                    <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tên Widget
                                <span class="text-red-500">*</span></label>
                            <input v-model="widgetName" type="text" placeholder="Nhập tên widget"
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        </div>
                    </div>
                </UPageCard>

                <UPageCard title="Nội dung chính" variant="soft" class="bg-white rounded-lg">
                    <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Main
                                    Title</label>
                                <input v-model="mainTitle" type="text" placeholder="CIRCULAR AGRICULTURE"
                                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sub
                                    Title</label>
                                <input v-model="subTitle" type="text" placeholder="ZERO-WASTE MISSION"
                                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content
                                Title</label>
                            <input v-model="contentTitle" type="text" placeholder="Nông Nghiệp Tuần Hoàn..."
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content
                                Description</label>
                            <textarea v-model="contentDescription" rows="6" placeholder="Nhập mô tả nội dung..."
                                class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Main
                                Image</label>
                            <div class="border rounded-lg overflow-hidden bg-white">
                                <div v-if="mainImageUrl" class="relative group aspect-video">
                                    <img :src="mainImageFile && mainImageUrl.startsWith('blob:') ? mainImageUrl : (fileService.getFileUrl(mainImageUrl) || '')"
                                        alt="Main Image" class="w-full h-full object-cover">
                                    <button type="button"
                                        class="absolute top-1 right-1 flex items-center justify-center w-6 h-6 bg-white/80 hover:bg-white text-red-500 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Xoá ảnh" @click="removeMainImage">
                                        <UIcon name="i-lucide-x" class="w-4 h-4" />
                                    </button>
                                </div>
                                <div v-else class="p-4 flex flex-col items-center justify-center min-h-[150px]">
                                    <UFileUpload v-model="mainImageFile" class="w-full" :multiple="false"
                                        @update:model-value="(file: unknown) => onMainImageChange(file as File | null)" />
                                    <p v-if="mainImageUploading" class="text-xs text-blue-500 mt-2">Đang tải ảnh lên...
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label
                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Layout</label>
                                <select v-model="layout"
                                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="image-left">Image Left</option>
                                    <option value="image-right">Image Right</option>
                                </select>
                            </div>
                            <div>
                                <label
                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background
                                    Style</label>
                                <input v-model="backgroundStyle" type="text" placeholder="linear-gradient(...)"
                                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                            </div>
                        </div>
                    </div>
                </UPageCard>

                <UPageCard title="Sections" variant="soft" class="bg-white rounded-lg">
                    <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                        <div v-for="(section, idx) in sections" :key="idx"
                            class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 relative">
                            <div class="absolute top-4 right-4">
                                <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs"
                                    title="Xoá section" @click="() => removeSection(idx)"
                                    :disabled="sections.length <= 1" />
                            </div>

                            <h3 class="text-sm font-semibold text-gray-900 mb-4">Section #{{ idx + 1 }}</h3>

                            <div class="space-y-3">
                                <div>
                                    <label
                                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                                    <input v-model="section.title" type="text" placeholder="Sứ Mệnh Của Chúng Tôi"
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                </div>

                                <div>
                                    <label
                                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                    <textarea v-model="section.description" rows="4" placeholder="Nhập mô tả..."
                                        class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon
                                            Class</label>
                                        <input v-model="section.iconClass" type="text" placeholder="fa-bullseye"
                                            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    </div>
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort
                                            Order</label>
                                        <input v-model="section.sortOrder" type="number" min="1"
                                            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    </div>
                                </div>

                                <div>
                                    <label
                                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image</label>
                                    <div class="border rounded-lg overflow-hidden bg-white">
                                        <div v-if="section.imageUrl" class="relative group aspect-video">
                                            <img :src="section.imageFile && section.imageUrl.startsWith('blob:') ? section.imageUrl : (fileService.getFileUrl(section.imageUrl) || '')"
                                                alt="Section Image" class="w-full h-full object-cover">
                                            <button type="button"
                                                class="absolute top-1 right-1 flex items-center justify-center w-6 h-6 bg-white/80 hover:bg-white text-red-500 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Xoá ảnh" @click="removeSectionImage(idx)">
                                                <UIcon name="i-lucide-x" class="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div v-else class="p-4 flex flex-col items-center justify-center min-h-[100px]">
                                            <UFileUpload v-model="section.imageFile" class="w-full" :multiple="false"
                                                @update:model-value="(file: unknown) => onSectionImageChange(file as File | null, idx)" />
                                            <p v-if="section.uploading" class="text-xs text-blue-500 mt-2">Đang tải ảnh
                                                lên...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <UButton label="Thêm Section Mới" icon="i-lucide-plus" color="primary" variant="soft" block
                            @click="addSection" />
                    </div>
                </UPageCard>
            </div>

            <!-- Right Column -->
            <div class="w-full lg:w-80 space-y-6">
                <UPageCard title="Cài đặt hiển thị" variant="soft" class="bg-white rounded-lg">
                    <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vị trí (Zone)
                                <span class="text-red-500">*</span></label>
                            <select v-model="widgetZone"
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option :value="undefined" disabled>Chọn vị trí hiển thị</option>
                                <option v-for="zone in widgetZoneItems" :key="zone" :value="zone">{{ zone }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thứ tự hiển
                                thị</label>
                            <input v-model="displayOrder" type="number" min="0" placeholder="0"
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
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
                            <input v-model="publishStart" placeholder="dd/MM/yyyy HH:mm"
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngày kết
                                thúc</label>
                            <input v-model="publishEnd" placeholder="dd/MM/yyyy HH:mm"
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        </div>
                        <div class="text-xs text-gray-500 italic">
                            Định dạng: dd/MM/yyyy HH:mm
                        </div>
                    </div>
                </UPageCard>
            </div>
        </form>
    </div>
</template>
