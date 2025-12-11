<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { productService } from '@/services/product.service'
import { fileService } from '@/services'

const TinyMCESelfHost = defineAsyncComponent(() => import('@/components/TinyMCESelfHost.vue'))

interface Props {
  mode?: 'create' | 'update'
  // Optional: pass full category data
  category?: { id: number, name: string, description?: string, imageUrl?: string | null, slug?: string | null, includeInMenu?: boolean, isPublished?: boolean, displayOrder?: number | null } | null
  // Or pass only the id and let the form self-load in update mode
  categoryId?: number | null
}
const props = withDefaults(defineProps<Props>(), { mode: 'create', category: null, categoryId: null })

// Form state
const form = reactive({
  name: '',
  description: '',
  // Optional fields for UI only (not sent for now)
  channels: { pos: true, web: true },
  imageUrl: '' as string | null,
  theme: 'collection',
  attachToMenu: false,
  conditionMode: 'manual' as 'manual' | 'auto',
  slug: '',
  includeInMenu: false,
  isPublished: false,
  displayOrder: 0
})

const submitting = ref(false)
const toast = useToast()
const router = useRouter()
const isUpdate = computed(() => props.mode === 'update')

function goBack() {
  void router.push('/products-categories')
}

// Validation helpers
const nameTouched = ref(false) // set on first blur or input
const attemptedSubmit = ref(false)
const isNameInvalid = computed(() => form.name.trim().length === 0)
const canSubmit = computed(() => !isNameInvalid.value)

// Image upload (simplified single image similar to NewsForm UI)
const isUploadingImage = ref(false)
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>('')
const fileInput = ref<HTMLInputElement>()

// Helper to map backend data to form fields
function prefillFromCategory(cat: NonNullable<Props['category']>) {
  form.name = cat.name || ''
  form.description = cat.description || ''
  form.imageUrl = cat.imageUrl || ''
  form.slug = cat.slug || ''
  form.includeInMenu = !!cat.includeInMenu
  form.isPublished = !!cat.isPublished
  form.displayOrder = Number(cat.displayOrder || 0)
  // preview
  if (form.imageUrl) {
    const isAbsolute = /^https?:\/\//i.test(form.imageUrl)
    try {
      imagePreview.value = isAbsolute ? form.imageUrl : (fileService.getFileUrl(form.imageUrl) || '')
    } catch {
      imagePreview.value = isAbsolute ? form.imageUrl : ''
    }
  } else {
    imagePreview.value = ''
  }
}

// Prefill when given full category object
onMounted(() => {
  if (isUpdate.value && props.category) {
    prefillFromCategory(props.category)
  }
})

// Self-load when only categoryId is provided
const loadingCategory = ref(false)
async function loadCategoryById(id: number) {
  try {
    loadingCategory.value = true
    const res = await productService.getCategoryById(id)
    const hasData = (v: unknown): v is { data: unknown } => !!v && typeof v === 'object' && 'data' in (v as Record<string, unknown>)
    const raw = hasData(res) ? (res as { data: unknown }).data : res
    if (raw && typeof raw === 'object') {
      const o = raw as Record<string, unknown>
      const getStr = (obj: Record<string, unknown>, key: string): string | null => {
        const val = obj[key]
        return typeof val === 'string' ? val : null
      }
      const getNum = (obj: Record<string, unknown>, key: string): number | null => {
        const val = obj[key]
        return typeof val === 'number' ? val : null
      }
      const getBool = (obj: Record<string, unknown>, key: string): boolean => {
        const val = obj[key]
        return typeof val === 'boolean' ? val : false
      }
      const imageUrl = getStr(o, 'thumbnailImageUrl') || getStr(o, 'imageUrl') || getStr(o, 'thumbnailImage') || ''
      prefillFromCategory({
        id: Number((o.id as number | undefined) ?? id),
        name: String(o.name ?? ''),
        description: getStr(o, 'description') || '',
        imageUrl: imageUrl || '',
        slug: getStr(o, 'slug') || '',
        includeInMenu: getBool(o, 'includeInMenu'),
        isPublished: getBool(o, 'isPublished'),
        displayOrder: getNum(o, 'displayOrder') ?? 0
      })
    }
  } finally {
    loadingCategory.value = false
  }
}

watch(
  () => ({ isUpdate: isUpdate.value, id: props.categoryId, cat: props.category }),
  (st) => {
    if (st.isUpdate && !st.cat && typeof st.id === 'number' && !Number.isNaN(st.id)) {
      loadCategoryById(st.id)
    }
  },
  { immediate: true }
)

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    console.error('Vui lòng chọn file ảnh hợp lệ')
    target.value = ''
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    console.error('Ảnh tối đa 2MB')
    target.value = ''
    return
  }
  imageFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  try {
    isUploadingImage.value = true
    const res = await fileService.uploadFile(file, 'category')
    if (res?.success && res.data) {
      const fileData = Array.isArray(res.data) ? res.data[0] : res.data
      if (fileData?.fileName) {
        form.imageUrl = fileData.fileName
      }
    }
  } catch (err) {
    console.error('Upload ảnh thất bại', err)
  } finally {
    isUploadingImage.value = false
  }
}
function removeImage() {
  imageFile.value = null
  imagePreview.value = ''
  form.imageUrl = ''
  if (fileInput.value) fileInput.value.value = ''
}
function clickFileInput() {
  fileInput.value?.click()
}

async function onSubmit() {
  attemptedSubmit.value = true
  if (!canSubmit.value) {
    toast.add({ title: 'Thiếu thông tin', description: 'Vui lòng nhập Tên danh mục', color: 'error' })
    return
  }
  submitting.value = true
  try {
    if (isUpdate.value && (props.categoryId || props.category?.id)) {
      await productService.updateCategory({
        id: Number(props.categoryId || props.category!.id),
        name: form.name.trim(),
        description: form.description || '',
        parentId: undefined,
        sortOrder: undefined,
        slug: form.slug || slugify(form.name),
        includeInMenu: form.includeInMenu,
        isPublished: form.isPublished,
        displayOrder: form.displayOrder || 0,
        thumbnailImage: form.imageUrl || null
      })
      toast.add({ title: 'Thành công', description: 'Đã cập nhật danh mục', color: 'success' })
    } else {
      await productService.createCategory({
        name: form.name.trim(),
        description: form.description || '',
        parentId: undefined,
        sortOrder: undefined
      })
      toast.add({ title: 'Thành công', description: 'Đã tạo danh mục sản phẩm', color: 'success' })
    }
    router.push('/products-categories')
  } catch (e) {
    console.error('Save category failed', e)
    toast.add({ title: 'Lỗi', description: 'Không thể lưu danh mục, vui lòng thử lại', color: 'error' })
  } finally {
    submitting.value = false
  }
}

// Simple slugify helper (Vietnamese accents handled basic by remove diacritics)
function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

function cancel() {
  navigateTo('/products-categories')
}
</script>

<template>
  <UDashboardPanel :id="isUpdate ? 'product-category-update' : 'product-category-create'">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <button
              class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              @click="goBack"
            >
              <svg
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div class="text-lg font-semibold">
              {{ isUpdate ? 'Cập nhật danh mục' : 'Thêm danh mục sản phẩm' }}
            </div>
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              :label="'Hủy'"
              variant="ghost"
              color="neutral"
              @click="cancel"
            />
            <UButton
              :label="isUpdate ? 'Cập nhật' : 'Lưu'"
              :loading="submitting"
              @click="() => onSubmit()"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full mx-auto px-4 lg:px-6">
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Left column -->
          <div class="flex-1 space-y-6">
            <UPageCard :title="'Thông tin danh mục'" variant="soft" class="bg-white rounded-lg overflow-hidden">
              <form class="space-y-6" @submit.prevent="onSubmit">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tên danh mục <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.name"
                    type="text"
                    placeholder="Nhập tên danh mục"
                    :class="{ 'border-red-500': (nameTouched || attemptedSubmit) && isNameInvalid }"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    @input="nameTouched = true"
                    @blur="nameTouched = true"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mô tả</label>
                  <div class="rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800">
                    <TinyMCESelfHost v-model="form.description" />
                  </div>
                </div>
              </form>
            </UPageCard>

            <UPageCard :title="'Điều kiện'" variant="soft" class="bg-white rounded-lg">
              <div class="space-y-3">
                <URadioGroup
                  v-model="form.conditionMode"
                  :items="[
                    { label: 'Thủ công', value: 'manual' },
                    { label: 'Tự động', value: 'auto' }
                  ]"
                  class="space-y-2"
                />
                <p class="text-xs text-gray-500">
                  Thiết lập các điều kiện để tự động thêm sản phẩm vào danh mục (chưa hỗ trợ, chọn Thủ công).
                </p>
              </div>
            </UPageCard>
          </div>

          <!-- Right column -->
          <div class="w-full lg:w-80 space-y-6">
            <UPageCard title="Kênh bán hàng" variant="soft" class="bg-white rounded-lg">
              <div class="space-y-2">
                <UCheckbox v-model="form.channels.pos" label="POS" />
                <UCheckbox v-model="form.channels.web" label="Website" />
                <div class="text-xs text-gray-500">
                  Các kênh này hiện chỉ dùng cho hiển thị.
                </div>
              </div>
            </UPageCard>

            <UPageCard title="Ảnh danh mục" variant="soft" class="bg-white rounded-lg">
              <div class="space-y-4">
                <div v-if="imagePreview" class="relative">
                  <img
                    :src="imagePreview"
                    alt="Preview"
                    class="w-full h-48 object-cover rounded-lg border border-gray-200"
                  >
                  <button
                    type="button"
                    class="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                    @click="removeImage"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div
                  v-else
                  class="upload-area border border-dashed border-gray-300 rounded-xl p-6 text-center bg-white hover:border-primary-500 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500 transition-colors cursor-pointer"
                  @click="clickFileInput"
                >
                  <div class="space-y-2">
                    <svg
                      class="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <div class="text-sm text-gray-600">
                      <span class="font-medium text-primary-600">Click để tải lên ảnh danh mục</span>
                      <span> hoặc kéo thả vào đây</span>
                    </div>
                  </div>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleImageUpload"
                >
                <div
                  v-if="isUploadingImage"
                  class="text-center text-sm text-primary-600"
                >
                  Đang tải lên...
                </div>
                <p class="text-xs text-gray-500">
                  Bạn có thể cập nhật ảnh sau.
                </p>
              </div>
            </UPageCard>

            <UPageCard title="Khung giao diện" variant="soft" class="bg-white rounded-lg">
              <select
                v-model="form.theme"
                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="collection">
                  collection
                </option>
              </select>
            </UPageCard>

            <UPageCard title="Gắn lên menu" variant="soft" class="bg-white rounded-lg">
              <div class="space-y-2">
                <UCheckbox v-model="form.attachToMenu" label="Thêm danh mục vào menu" />
                <p class="text-xs text-gray-500">
                  Tùy chọn này chưa đồng bộ backend.
                </p>
              </div>
            </UPageCard>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
</style>
