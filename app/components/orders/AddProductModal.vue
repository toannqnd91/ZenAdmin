<script setup lang="ts">
import { ref, computed } from 'vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import BaseNumberInput from '@/components/base/BaseNumberInput.vue'
import { z } from 'zod'
import { productService } from '@/services'
import type { ApiResponse } from '@/types/common'
import { useProductsCategoriesService } from '@/composables/useProductsCategoriesService'
import type { ProductCategory } from '@/composables/useProductsCategoriesService'

const schema = z.object({
  name: z.string().min(1, 'Tên sản phẩm là bắt buộc'),
  description: z.string().min(1, 'Mô tả là bắt buộc'),
  barcode: z.string().optional(),
  content: z.string().min(1, 'Nội dung là bắt buộc'),
  price: z.number().min(0, 'Giá phải lớn hơn hoặc bằng 0').optional(),
  sku: z.string().optional(),
  cost: z.number().min(0).optional(),
  stock: z.number().min(0).optional(),
  unit: z.string().optional()
})

type Schema = z.output<typeof schema>

type GroupItem = { id?: number | string, name?: string }

const props = withDefaults(defineProps<{ open?: boolean }>(), { open: false })
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'created', product: unknown): void
}>()

const open = computed({
  get: () => !!props.open,
  set: (v: boolean) => emit('update:open', v)
})

const loading = ref(false)
const form = ref<Schema>({ name: '', description: '', barcode: '', content: '', price: undefined, sku: '', cost: undefined, stock: undefined, unit: '' })
const toast = useToast()

// Use the same data source as /products/create for consistency
const { data: categoriesData, loading: categoriesPending } = useProductsCategoriesService()

// Flatten categories with indentation markers for child levels
// Level 0: "Tên"
// Level 1: "--- Tên"
// Level 2: "------ Tên" (and so on)
function flattenCategories(list: ProductCategory[] | undefined | null): GroupItem[] {
  const out: GroupItem[] = []
  const dfs = (arr: ProductCategory[] | undefined | null, level: number) => {
    if (!Array.isArray(arr)) return
    for (const c of arr) {
      if ((c as { isDeleted?: boolean }).isDeleted) continue
      const prefix = level > 0 ? `${'--- '.repeat(level)}` : ''
      out.push({ id: c.id, name: `${prefix}${c.name}` })
      const children = [
        ...((Array.isArray(c.categories) ? c.categories : []) as ProductCategory[]),
        ...((Array.isArray(c.children) ? c.children : []) as ProductCategory[])
      ]
      if (children.length) dfs(children, level + 1)
    }
  }
  dfs(list || [], 0)
  return out
}

// RemoteSearchSelect fetch fn: ensure we return children too and wait briefly if still loading
async function fetchGroups(q = ''): Promise<GroupItem[]> {
  // If data not ready yet but loading, wait a short time (poll) so first open has results
  let attempts = 0
  while (attempts < 10 && (!categoriesData.value?.length) && (categoriesPending.value)) {
    await new Promise(r => setTimeout(r, 60))
    attempts++
  }
  const raw = categoriesData.value as ProductCategory[]
  const all = flattenCategories(raw)
  const term = (q || '').trim().toLowerCase()
  if (!term) return all
  return all.filter(it => String(it.name || '').toLowerCase().includes(term))
}

// (optional) expose loading if needed later; prefix underscore to satisfy lint if unused
const _categoriesLoading = computed(() => !!categoriesPending.value)

const selectedGroup = ref<GroupItem | null>(null)

// Image upload local state (simple preview-only implementation)
const fileInput = ref<HTMLInputElement | null>(null)
const imagePreviews = ref<string[]>([])
const isUploading = ref(false)

function handleImageFiles(files: FileList | null) {
  if (!files) return
  isUploading.value = true
  const readers: Promise<void>[] = []
  for (let i = 0; i < files.length; i++) {
    const f = files.item(i)
    if (!f) continue
    const p = new Promise<void>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string | ArrayBuffer | null
        if (typeof result === 'string') imagePreviews.value.push(result)
        resolve()
      }
      reader.onerror = () => resolve()
      reader.readAsDataURL(f)
    })
    readers.push(p)
  }
  Promise.all(readers).finally(() => (isUploading.value = false))
}

function onFileChange(e: Event) {
  const el = e.target as HTMLInputElement
  handleImageFiles(el.files)
  // reset input so same file can be selected again
  if (el) el.value = ''
}

function removeImage(idx: number) {
  imagePreviews.value.splice(idx, 1)
}

function openFileDialog() {
  fileInput.value?.click()
}

async function onSubmit() {
  loading.value = true
  try {
    // Build productImages array from previews (simulate upload)
    const productImages = imagePreviews.value.map(url => ({
      id: 0,
      caption: '',
      mediaUrl: url
    }))
    const payload = {
      name: form.value.name,
      sku: form.value.sku || '',
      gtin: '',
      barcode: form.value.barcode || '',
      price: form.value.price ?? 0,
      costPrice: form.value.cost ?? 0,
      unitName: form.value.unit || '',
      categoryId: selectedGroup.value?.id ? Number(selectedGroup.value.id) : null,
      thumbnailImageUrl: (imagePreviews.value[0] && imagePreviews.value[0].endsWith('.jpg')) ? imagePreviews.value[0] : (imagePreviews.value[0] ? imagePreviews.value[0] + '.jpg' : ''),
      stock: form.value.stock ?? 0,
      warehouseId: null,
      productImages
    }
    const response = (await productService.createQuickProduct(payload)) as ApiResponse<{ id?: number }>
    if (response.success && response.data && response.data.id) {
      toast.add({ title: 'Thành công', description: 'Sản phẩm đã được tạo thành công' })
      // Emit full product info for parent to add to orderProducts
      emit('created', {
        id: response.data.id,
        name: payload.name,
        sku: payload.sku,
        price: payload.price,
        stockQuantity: payload.stock,
        thumbnailImageUrl: payload.thumbnailImageUrl
      })
      form.value = { name: '', description: '', content: '', price: undefined, sku: '', cost: undefined, stock: undefined, unit: '' }
      imagePreviews.value = []
      open.value = false
    } else {
      throw new Error(response.message || 'Tạo sản phẩm thất bại')
    }
  } catch (err) {
    console.error(err)
    const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo sản phẩm'
    toast.add({ title: 'Lỗi', description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4"
      @keydown.esc="open = false"
    >
      <div
        class="bg-white w-full max-w-3xl rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-product-title"
        @click.stop
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 class="text-lg font-semibold">
            <span id="add-product-title">Thêm sản phẩm mới</span>
          </h3>
          <button
            class="text-gray-400 hover:text-gray-600"
            @click="open = false"
          >
            &times;
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-sm modal-body-scroll">
          <UForm :schema="schema" :state="form" @submit="onSubmit">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Left column (codes, barcode, name, group) -->
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Mã hàng</label>
                  <input
                    v-model="form.sku"
                    type="text"
                    placeholder="Mã hàng tự động"
                    class="w-full h-9 px-3 rounded-md border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    :disabled="true"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Mã vạch</label>
                  <input
                    v-model="form.barcode"
                    type="text"
                    placeholder=""
                    class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Tên hàng</label>
                  <input
                    v-model="form.name"
                    type="text"
                    placeholder="Nhập tên"
                    class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Danh mục</label>
                  <RemoteSearchSelect
                    v-model="selectedGroup"
                    placeholder="---Lựa chọn---"
                    :fetch-fn="fetchGroups"
                    label-field="name"
                    clearable
                    searchable
                    :full-width="true"
                    :append-to-body="true"
                  />
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Giá vốn</label>
                  <div class="relative">
                    <BaseNumberInput
                      v-model="form.cost"
                      :allow-decimal="false"
                      decimal-separator="."
                      placeholder="0"
                      class="w-full h-9 px-3 pr-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">đ</span>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Giá bán</label>
                  <div class="relative">
                    <BaseNumberInput
                      v-model="form.price"
                      :allow-decimal="false"
                      decimal-separator="."
                      placeholder="0"
                      class="w-full h-9 px-3 pr-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">đ</span>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Tồn kho</label>
                  <BaseNumberInput
                    v-model="form.stock"
                    :allow-decimal="false"
                    decimal-separator="."
                    placeholder="0"
                    class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Đơn vị cơ bản</label>
                  <input
                    v-model="form.unit"
                    type="text"
                    placeholder="Đơn vị"
                    class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                </div>
              </div>

              <!-- Images row spanning both columns: upload area and previews -->
              <div class="md:col-span-2 mt-2">
                <!-- hidden file input -->
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*,video/*,model/*"
                  multiple
                  class="hidden"
                  @change="onFileChange"
                >

                <div v-if="imagePreviews.length === 0" class="border-dashed border-2 border-gray-200 rounded-md p-4 flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="w-28 h-20 rounded-md bg-gray-50 flex items-center justify-center text-gray-300">
                      <svg
                        class="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3l-4 4m0 0L8 3m4 4V3"
                        />
                      </svg>
                    </div>
                    <div>
                      <div class="text-sm font-medium">
                        Kéo thả hoặc tải ảnh lên
                      </div>
                      <div class="text-xs text-gray-500">
                        Chấp nhận hình ảnh, video hoặc mô hình 3D
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
                      @click="openFileDialog"
                    >
                      Upload new
                    </button>
                    <button
                      type="button"
                      class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
                    >
                      Select existing
                    </button>
                  </div>
                </div>

                <div v-else class="grid grid-cols-5 gap-4">
                  <div
                    v-for="(src, idx) in imagePreviews"
                    :key="idx"
                    class="relative w-full aspect-square rounded-md overflow-hidden"
                  >
                    <img
                      :src="src"
                      alt="preview"
                      class="object-cover w-full h-full"
                    >
                    <button
                      type="button"
                      class="absolute top-2 right-2 bg-white/70 rounded-md p-1 text-gray-600"
                      @click="removeImage(idx)"
                    >
                      &times;
                    </button>
                  </div>

                  <!-- add more tile -->
                  <div class="w-full aspect-square rounded-md border-dashed border-2 border-gray-200 flex items-center justify-center text-gray-300">
                    <button
                      type="button"
                      class="w-full h-full flex items-center justify-center"
                      @click="openFileDialog"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p v-if="false" class="text-xs text-red-600">
              &nbsp;
            </p>
          </UForm>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
            @click="open = false"
          >
            Hủy
          </button>
          <button
            type="button"
            class="h-9 px-5 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
            @click="onSubmit"
          >
            Tạo sản phẩm
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
