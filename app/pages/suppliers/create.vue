<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseCardHeader from '@/components/BaseCardHeader.vue'

interface SupplierForm {
  name: string
  code: string
  phone: string
  taxCode: string
  email: string
  website: string
  fax: string
  country: string
  region: string
  ward: string
  address: string
  manager: string
  tagsInput: string
  tags: string[]
}

const router = useRouter()

const form = ref<SupplierForm>({
  name: '',
  code: '',
  phone: '',
  taxCode: '',
  email: '',
  website: 'https://',
  fax: '',
  country: 'Vietnam',
  region: '',
  ward: '',
  address: '',
  manager: 'Phạm Văn Toàn',
  tagsInput: '',
  tags: []
})

const submitting = ref(false)
const touchedName = ref(false)

const nameError = computed(() => {
  if (!touchedName.value) return ''
  if (!form.value.name.trim()) return 'Tên nhà cung cấp là bắt buộc'
  return ''
})

const isValid = computed(() => !nameError.value && form.value.name.trim().length > 0)

function onSubmit() {
  touchedName.value = true
  if (!isValid.value) return
  submitting.value = true
  // TODO: Gọi API tạo mới nhà cung cấp (chưa có endpoint create trong service)
  setTimeout(() => {
    submitting.value = false
    router.push('/suppliers')
  }, 800)
}

function addTagFromInput() {
  const raw = form.value.tagsInput.trim()
  if (!raw) return
  if (!form.value.tags.includes(raw)) form.value.tags.push(raw)
  form.value.tagsInput = ''
}

function removeTag(i: number) { form.value.tags.splice(i, 1) }

function goBack() { router.back() }
</script>

<template>
  <div class="w-full max-w-screen-xl mx-auto px-6 py-6">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <button
        type="button"
        class="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-600"
        @click="goBack"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-lg font-semibold">Thêm mới nhà cung cấp</h1>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Left Column -->
      <div class="flex-1 flex flex-col gap-6">
        <!-- Thông tin chung -->
        <div class="bg-white rounded-md border border-gray-200 p-6">
          <div class="text-sm font-semibold mb-4">Thông tin chung</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Tên -->
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-600 mb-1">Tên nhà cung cấp<span class="text-red-500">*</span></label>
              <input
                v-model="form.name"
                @blur="touchedName = true"
                type="text"
                class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                :class="nameError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'"
                placeholder="Nhập tên nhà cung cấp"
              >
              <p v-if="nameError" class="text-xs text-red-500 mt-1">{{ nameError }}</p>
            </div>
            <!-- Mã -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Mã nhà cung cấp</label>
              <input v-model="form.code" type="text" placeholder="Nhập mã nhà cung cấp" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
            <!-- Phone -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
              <div class="flex">
                <div class="relative">
                  <select class="h-9 pl-2 pr-7 text-sm rounded-l-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none">
                    <option value="VN">🇻🇳 +84</option>
                  </select>
                  <span class="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg>
                  </span>
                </div>
                <input v-model="form.phone" type="text" placeholder="Nhập số điện thoại" class="flex-1 h-9 px-3 rounded-r-md border-t border-r border-b border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
            </div>
            <!-- Email -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input v-model="form.email" type="email" placeholder="Nhập email" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
            <!-- Mã số thuế -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Mã số thuế</label>
              <input v-model="form.taxCode" type="text" placeholder="Nhập mã số thuế" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
            <!-- Website -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Website</label>
              <input v-model="form.website" type="text" placeholder="https://" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
            <!-- Fax -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Số fax</label>
              <input v-model="form.fax" type="text" placeholder="Nhập số fax" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
          </div>
        </div>

        <!-- Địa chỉ -->
        <div class="bg-white rounded-md border border-gray-200 p-6">
          <div class="text-sm font-semibold mb-4">Địa chỉ</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Quốc gia</label>
              <select v-model="form.country" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option>Vietnam</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Khu vực</label>
              <select v-model="form.region" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="" disabled>Chọn khu vực</option>
                <option>Hà Nội</option>
                <option>Hồ Chí Minh</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-600 mb-1">Phường xã</label>
              <select v-model="form.ward" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="" disabled>Chọn Phường xã</option>
                <option>Phường 1</option>
                <option>Phường 2</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-600 mb-1">Địa chỉ cụ thể</label>
              <input v-model="form.address" type="text" placeholder="Nhập địa chỉ cụ thể" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="w-full lg:w-80 flex flex-col gap-6 flex-shrink-0">
        <!-- Nhân viên phụ trách -->
        <div class="bg-white rounded-md border border-gray-200 p-6">
          <div class="text-sm font-semibold mb-4">Nhân viên phụ trách</div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Nhân viên phụ trách</label>
            <select v-model="form.manager" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>Phạm Văn Toàn</option>
              <option>Nguyễn Văn B</option>
            </select>
          </div>
        </div>
        <!-- Tag -->
        <div class="bg-white rounded-md border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="text-sm font-semibold">Tag</div>
            <a href="#" class="text-primary-600 text-xs font-medium hover:underline">Danh sách tag</a>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Tag</label>
            <input
              v-model="form.tagsInput"
              @keydown.enter.prevent="addTagFromInput"
              type="text"
              class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Tìm kiếm hoặc thêm mới tag"
            >
            <div v-if="form.tags.length" class="flex flex-wrap gap-2 mt-3">
              <div
                v-for="(t,i) in form.tags"
                :key="t+i"
                class="px-2 h-7 rounded-full bg-primary-50 text-primary-700 text-xs inline-flex items-center gap-1"
              >
                <span>{{ t }}</span>
                <button type="button" class="text-primary-500 hover:text-primary-700" @click="removeTag(i)">×</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Submit -->
    <div class="flex justify-end mt-8 mb-4">
      <button
        type="button"
        class="px-6 h-10 rounded-md font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm bg-primary-600 text-white hover:bg-primary-700"
        :disabled="!isValid || submitting"
        @click="onSubmit"
      >
        <span v-if="!submitting">Thêm mới</span>
        <span v-else class="flex items-center gap-2">
          <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="4" class="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke-width="4" class="opacity-75" stroke-linecap="round" /></svg>
          Đang lưu...
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
select { background-position: right 0.4rem center; }
</style>
