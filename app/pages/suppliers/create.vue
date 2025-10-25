<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseCardHeader from '~/components/BaseCardHeader.vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import { useLocations } from '@/composables/useLocations'
import { supplierService, type CreateSupplierRequest } from '@/services/supplier.service'

interface SupplierForm {
  name: string
  code: string
  phoneCountryCode: string
  phone: string
  taxCode: string
  email: string
  website: string
  fax: string
  country: string
  region: string | null
  provinceId: number | null
  wardId: number | null
  address: string
  status: 'active' | 'inactive'
  manager: string
  tagsInput: string
  tags: string[]
}

const router = useRouter()

const form = ref<SupplierForm>({
  name: '',
  code: '',
  phoneCountryCode: '+84',
  phone: '',
  taxCode: '',
  email: '',
  website: 'https://',
  fax: '',
  country: 'Vietnam',
  region: null,
  provinceId: null,
  wardId: null,
  address: '',
  status: 'active',
  manager: 'Phạm Văn Toàn',
  tagsInput: '',
  tags: []
})

const submitting = ref(false)
const touchedName = ref(false)
const apiError = ref<string | null>(null)

const nameError = computed(() => {
  if (!touchedName.value) return ''
  if (!form.value.name.trim()) return 'Tên nhà cung cấp là bắt buộc'
  return ''
})

const isValid = computed(() => !nameError.value && form.value.name.trim().length > 0)

// Locations composable for province/ward
const { getProvinces, getWards } = useLocations()
const selectedProvince = ref<Record<string, unknown> | null>(null)
const selectedWard = ref<Record<string, unknown> | null>(null)

type LocationGeneric = { id?: number | string, name?: string, code?: number | string, division_type?: string }
function castLocationItems(list: unknown): Record<string, unknown>[] {
  const arr = Array.isArray(list) ? (list as LocationGeneric[]) : []
  return arr.map(it => ({ id: it.id, name: it.name, code: it.code, division_type: it.division_type }))
}
async function provinceFetch(search: string) {
  const list = await getProvinces(search)
  return castLocationItems(list)
}
async function wardFetch(search: string) {
  const p = selectedProvince.value as { code?: string | number, id?: string | number } | null
  const provinceCode = p?.code ?? p?.id ?? null
  const list = await getWards(search, provinceCode as string | number | undefined)
  return castLocationItems(list)
}

watch(selectedProvince, (v) => {
  const keyed = v as { id?: number, code?: number | string, name?: string } | null
  form.value.region = v ? String(keyed?.name ?? keyed?.code ?? keyed?.id ?? '') : null
  form.value.provinceId = typeof keyed?.id === 'number' ? keyed?.id : null
  selectedWard.value = null
  form.value.wardId = null
})
watch(selectedWard, (w) => {
  const keyed = w as { id?: number } | null
  form.value.wardId = typeof keyed?.id === 'number' ? keyed?.id : null
})

async function onSubmit() {
  touchedName.value = true
  if (!isValid.value || submitting.value) return
  submitting.value = true
  apiError.value = null
  try {
    const payload: CreateSupplierRequest = {
      name: form.value.name.trim(),
      code: form.value.code.trim() ? form.value.code.trim() : null,
      phoneCountryCode: form.value.phoneCountryCode || null,
      phone: form.value.phone.trim() ? form.value.phone.trim() : null,
      email: form.value.email.trim() ? form.value.email.trim() : null,
      address: form.value.address.trim() ? form.value.address.trim() : null,
      country: form.value.country || null,
      region: form.value.region,
      provinceId: form.value.provinceId,
      wardId: form.value.wardId,
      taxCode: form.value.taxCode.trim() ? form.value.taxCode.trim() : null,
      website: form.value.website.trim() ? form.value.website.trim() : null,
      fax: form.value.fax.trim() ? form.value.fax.trim() : null,
      status: form.value.status
    }
    const res = await supplierService.createSupplier(payload)
    if (!res?.success) throw new Error(res?.message || 'Tạo nhà cung cấp thất bại')
    {
      const created = res?.data as unknown as { code?: string } | undefined
      const createdCode = created?.code || payload.code
      if (createdCode) router.push(`/suppliers/${createdCode}`)
      else router.push('/suppliers')
    }
  } catch (e) {
    apiError.value = e instanceof Error ? e.message : 'Lỗi không xác định'
  } finally {
    submitting.value = false
  }
}

function addTagFromInput() {
  const raw = form.value.tagsInput.trim()
  if (!raw) return
  if (!form.value.tags.includes(raw)) form.value.tags.push(raw)
  form.value.tagsInput = ''
}

function removeTag(i: number) {
  form.value.tags.splice(i, 1)
}

function goBack() {
  router.back()
}
</script>

<template>
  <UDashboardPanel id="suppliers-create" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <UDashboardSidebarCollapse />
            <div class="text-lg font-semibold">
              Thêm mới nhà cung cấp
            </div>
          </div>
        </template>
        <template #right>
          <button
            type="button"
            class="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
            @click="goBack"
          >
            Quay lại
          </button>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-screen-xl mx-auto px-6 py-6">
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Left Column -->
          <div class="flex-1 flex flex-col gap-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Thông tin chung</BaseCardHeader>
              <div class="-mx-6 px-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Tên -->
                  <div class="md:col-span-2">
                    <label class="block text-xs font-medium text-gray-600 mb-1">
                      Tên nhà cung cấp
                      <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="form.name"
                      type="text"
                      class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      :class="nameError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'"
                      placeholder="Nhập tên nhà cung cấp"
                      @blur="touchedName = true"
                    >
                    <p v-if="nameError" class="text-xs text-red-500 mt-1">
                      {{ nameError }}
                    </p>
                  </div>

                  <!-- Mã -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Mã nhà cung cấp</label>
                    <input
                      v-model="form.code"
                      type="text"
                      placeholder="Nhập mã nhà cung cấp"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                  </div>

                  <!-- Phone -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
                    <div class="flex">
                      <div class="relative">
                        <select v-model="form.phoneCountryCode" class="h-9 pl-2 pr-7 text-sm rounded-l-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none">
                          <option value="+84">
                            🇻🇳 +84
                          </option>
                        </select>
                        <span class="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="w-3 h-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </span>
                      </div>
                      <input
                        v-model="form.phone"
                        type="text"
                        placeholder="Nhập số điện thoại"
                        class="flex-1 h-9 px-3 rounded-r-md border-t border-r border-b border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                    </div>
                  </div>

                  <!-- Email -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input
                      v-model="form.email"
                      type="email"
                      placeholder="Nhập email"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                  </div>

                  <!-- Mã số thuế -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Mã số thuế</label>
                    <input
                      v-model="form.taxCode"
                      type="text"
                      placeholder="Nhập mã số thuế"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                  </div>

                  <!-- Website -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Website</label>
                    <input
                      v-model="form.website"
                      type="text"
                      placeholder="https://"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                  </div>

                  <!-- Fax -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Số fax</label>
                    <input
                      v-model="form.fax"
                      type="text"
                      placeholder="Nhập số fax"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                  </div>
                  <!-- Trạng thái -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Trạng thái</label>
                    <select
                      v-model="form.status"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="active">
                        Đang hoạt động
                      </option>
                      <option value="inactive">
                        Ngưng hoạt động
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Địa chỉ</BaseCardHeader>
              <div class="-mx-6 px-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Quốc gia</label>
                    <select
                      v-model="form.country"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option>
                        Vietnam
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Tỉnh/thành phố</label>
                    <RemoteSearchSelect
                      v-model="selectedProvince"
                      :fetch-fn="provinceFetch"
                      label-field="name"
                      :get-item-key="item => (item.code ?? item.id) as (string | number)"
                      placeholder="Chọn Tỉnh/thành"
                      :clearable="true"
                      :full-width="true"
                    />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-xs font-medium text-gray-600 mb-1">Phường xã</label>
                    <RemoteSearchSelect
                      v-model="selectedWard"
                      :fetch-fn="wardFetch"
                      label-field="name"
                      :get-item-key="item => (item.code ?? item.id) as (string | number)"
                      placeholder="Chọn Phường xã"
                      :clearable="true"
                      :full-width="true"
                      :disabled="!selectedProvince"
                    />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-xs font-medium text-gray-600 mb-1">Địa chỉ cụ thể</label>
                    <input
                      v-model="form.address"
                      type="text"
                      placeholder="Nhập địa chỉ cụ thể"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                  </div>
                </div>
              </div>
            </UPageCard>
          </div>

          <!-- Right Column -->
          <div class="w-full lg:w-80 flex flex-col gap-6 flex-shrink-0">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Nhân viên phụ trách</BaseCardHeader>
              <div class="-mx-6 px-6">
                <label class="block text-xs font-medium text-gray-600 mb-1">Nhân viên phụ trách</label>
                <select
                  v-model="form.manager"
                  class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option>
                    Phạm Văn Toàn
                  </option>
                  <option>
                    Nguyễn Văn B
                  </option>
                </select>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Tag
                <template #actions>
                  <a href="#" class="text-primary-600 text-xs font-medium hover:underline">Danh sách tag</a>
                </template>
              </BaseCardHeader>
              <div class="-mx-6 px-6">
                <label class="block text-xs font-medium text-gray-600 mb-1">Tag</label>
                <input
                  v-model="form.tagsInput"
                  type="text"
                  class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tìm kiếm hoặc thêm mới tag"
                  @keydown.enter.prevent="addTagFromInput"
                >
                <div v-if="form.tags.length" class="flex flex-wrap gap-2 mt-3">
                  <div
                    v-for="(t, i) in form.tags"
                    :key="t+i"
                    class="px-2 h-7 rounded-full bg-primary-50 text-primary-700 text-xs inline-flex items-center gap-1"
                  >
                    <span>{{ t }}</span>
                    <button
                      type="button"
                      class="text-primary-500 hover:text-primary-700"
                      @click="removeTag(i)"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </UPageCard>
          </div>
        </div>

        <!-- Submit -->
        <div class="flex justify-end mt-8 mb-4">
          <div v-if="apiError" class="text-error text-sm mr-4 self-center">
            {{ apiError }}
          </div>
          <button
            type="button"
            class="px-6 h-10 rounded-md font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm bg-primary-600 text-white hover:bg-primary-700"
            :disabled="!isValid || submitting"
            @click="onSubmit"
          >
            <span v-if="!submitting">Thêm mới</span>
            <span v-else class="flex items-center gap-2">
              <svg
                class="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke-width="4"
                  class="opacity-25"
                />
                <path
                  d="M4 12a8 8 0 018-8"
                  stroke-width="4"
                  class="opacity-75"
                  stroke-linecap="round"
                />
              </svg>
              Đang lưu...
            </span>
          </button>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
select { background-position: right 0.4rem center; }
</style>
