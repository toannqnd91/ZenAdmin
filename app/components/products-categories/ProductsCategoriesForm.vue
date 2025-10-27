<script setup lang="ts">
import TinyMCESelfHost from '@/components/TinyMCESelfHost.vue'
import { productService } from '@/services/product.service'

// Form state
const form = reactive({
  name: '',
  description: '',
  // Optional fields for UI only (not sent for now)
  channels: { pos: true, web: true },
  imageUrl: '' as string | null,
  theme: 'collection',
  attachToMenu: false,
  conditionMode: 'manual' as 'manual' | 'auto'
})

const submitting = ref(false)
const toast = useToast()
const router = useRouter()

const canSubmit = computed(() => form.name.trim().length > 0)

async function onSubmit() {
  if (!canSubmit.value) {
    toast.add({ title: 'Thiếu thông tin', description: 'Vui lòng nhập Tên danh mục', color: 'error' })
    return
  }
  submitting.value = true
  try {
    await productService.createCategory({
      name: form.name.trim(),
      description: form.description || '',
      parentId: undefined,
      sortOrder: undefined
    })
    toast.add({ title: 'Thành công', description: 'Đã tạo danh mục sản phẩm', color: 'success' })
    router.push('/products-categories')
  } catch (e) {
    console.error('Create category failed', e)
    toast.add({ title: 'Lỗi', description: 'Không thể tạo danh mục, vui lòng thử lại', color: 'error' })
  } finally {
    submitting.value = false
  }
}

function cancel() {
  navigateTo('/products-categories')
}
</script>

<template>
  <UDashboardPanel id="product-category-create">
    <template #header>
      <UDashboardNavbar :title="'Thêm danh mục sản phẩm'">
        <template #leading>
          <UDashboardSidebarCollapse />
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
              :label="'Lưu'"
              :loading="submitting"
              @click="() => onSubmit()"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-6xl mx-auto px-4 lg:px-6">
        <!-- Breadcrumb -->
        <nav class="mb-6" aria-label="Breadcrumb">
          <ol class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <NuxtLink to="/products-categories" class="hover:text-primary-600 dark:hover:text-primary-400">Quản lý danh mục sản phẩm</NuxtLink>
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-900 dark:text-white font-medium">Thêm danh mục sản phẩm</span>
            </li>
          </ol>
        </nav>

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
                    :class="{ 'border-red-500': !canSubmit }"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ảnh (URL)</label>
                  <input
                    v-model="form.imageUrl"
                    type="text"
                    placeholder="Dán URL ảnh (tùy chọn)"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
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
