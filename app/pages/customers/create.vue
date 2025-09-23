<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseCardHeader from '~/components/BaseCardHeader.vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import { locationService } from '@/services/location.service'
import { customersService } from '@/services/customers.service'

interface CustomerForm {
  fullName: string
  code: string
  phone: string
  email: string
  gender: 'male' | 'female' | 'other' | ''
  birthday: string
  group: string
  country: string
  province: string
  district: string
  ward: string
  address: string
  note: string
  manager: string
  tagsInput: string
  tags: string[]
}

const router = useRouter()

const form = ref<CustomerForm>({
  fullName: '',
  code: '',
  phone: '',
  email: '',
  gender: '',
  birthday: '',
  group: '',
  country: 'Vietnam',
  province: '',
  district: '',
  ward: '',
  address: '',
  note: '',
  manager: 'Phạm Văn Toàn',
  tagsInput: '',
  tags: []
})

// Location selections (Province & Ward)
type GenericItem = Record<string, unknown>
const selectedProvince = ref<GenericItem | null>(null)
const selectedWard = ref<GenericItem | null>(null)
const selectedProvinceCode = computed(() => {
  const code = selectedProvince.value?.code
  return (typeof code === 'string' || typeof code === 'number') ? code : null
})

async function fetchProvinces(search: string) {
  try {
    const res = await locationService.getProvinces()
    const list = Array.isArray(res?.data) ? res.data : []
    const q = (search || '').toLowerCase()
    const mapped = list.map(p => ({ id: p.id, name: p.name, code: p.code, division_type: p.division_type }))
    return q ? mapped.filter(x => String(x.name).toLowerCase().includes(q)) : mapped
  } catch {
    return []
  }
}

async function fetchWards(search: string) {
  try {
    const pcode = selectedProvinceCode.value
    if (!pcode) return []
    const res = await locationService.getWardsByProvinceCode(pcode as number | string)
    const list = Array.isArray(res?.data) ? res.data : []
    const q = (search || '').toLowerCase()
    const mapped = list.map(w => ({ id: w.id, name: w.name, code: w.code, division_type: w.division_type }))
    return q ? mapped.filter(x => String(x.name).toLowerCase().includes(q)) : mapped
  } catch {
    return []
  }
}

function onSelectProvince(item: GenericItem) {
  selectedProvince.value = item
  form.value.province = String(item?.name ?? '')
  // Reset dependent ward when province changes
  selectedWard.value = null
  form.value.ward = ''
}

function onClearProvince() {
  selectedProvince.value = null
  form.value.province = ''
  selectedWard.value = null
  form.value.ward = ''
}

function onSelectWard(item: GenericItem) {
  selectedWard.value = item
  form.value.ward = String(item?.name ?? '')
}

function onClearWard() {
  selectedWard.value = null
  form.value.ward = ''
}

const submitting = ref(false)
const touchedName = ref(false)

const nameError = computed(() => {
  if (!touchedName.value) return ''
  if (!form.value.fullName.trim()) return 'Tên khách hàng là bắt buộc'
  return ''
})

const isValid = computed(() => !nameError.value && form.value.fullName.trim().length > 0)

function toBirthDateISO(dateStr: string): string | null {
  // Accepts yyyy-MM-dd or dd/MM/yyyy
  const s = (dateStr || '').trim()
  if (!s) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(s + 'T00:00:00').toISOString()
  }
  const parts = s.split('/')
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts as [string, string, string]
    const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T00:00:00`
    const d = new Date(iso)
    return isNaN(d.getTime()) ? null : d.toISOString()
  }
  return null
}

function mapGenderToNumber(g: CustomerForm['gender']): number | null {
  if (g === 'male') return 1
  if (g === 'female') return 2
  if (g === 'other') return 3
  return null
}

async function onSubmit() {
  touchedName.value = true
  if (!isValid.value) return
  submitting.value = true
  try {
    const payload = {
      fullName: form.value.fullName.trim(),
      email: form.value.email || null,
      phoneNumber: form.value.phone || null,
      birthDate: toBirthDateISO(form.value.birthday),
      gender: mapGenderToNumber(form.value.gender),
      note: form.value.note || null,
      customerCode: form.value.code || null,
      customerGroupId: null, // can be null per spec
      ownerUserId: null, // can be null per spec
      tags: form.value.tags.length ? form.value.tags : [],
      countryId: 'VN', // default VN per spec
      stateOrProvinceId: selectedProvince.value?.id as number ?? null,
      districtId: null,
      wardId: selectedWard.value?.id as number ?? null,
      addressLine1: form.value.address || null,
      addressLine2: null,
      zipCode: null,
      contactName: null,
      avatarUrl: null
    }
    await customersService.createCustomer(payload)
    router.push('/customers')
  } catch (e) {
    console.error('Create customer failed:', e)
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
  <UDashboardPanel id="customers-create" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <UDashboardSidebarCollapse />
            <div class="text-lg font-semibold">
              Thêm mới khách hàng
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
                      Tên khách hàng
                      <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="form.fullName"
                      type="text"
                      class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      :class="nameError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'"
                      placeholder="Nhập tên khách hàng"
                      @blur="touchedName = true"
                    >
                    <p v-if="nameError" class="text-xs text-red-500 mt-1">
                      {{ nameError }}
                    </p>
                  </div>

                  <!-- Số điện thoại -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
                    <div class="flex">
                      <div class="relative">
                        <select
                          class="h-9 pl-2 pr-7 text-sm rounded-l-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                        >
                          <option value="VN">
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

                  <!-- Giới tính -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Giới tính</label>
                    <select
                      v-model="form.gender"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">
                        Không xác định
                      </option>
                      <option value="male">
                        Nam
                      </option>
                      <option value="female">
                        Nữ
                      </option>
                      <option value="other">
                        Khác
                      </option>
                    </select>
                  </div>

                  <!-- Ngày sinh -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Ngày sinh</label>
                    <input
                      v-model="form.birthday"
                      type="date"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                  </div>

                  <!-- Mã KH -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Mã khách hàng</label>
                    <input
                      v-model="form.code"
                      type="text"
                      placeholder="VD: C0001"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                  </div>

                  <!-- Nhóm KH -->
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Nhóm khách hàng</label>
                    <select
                      v-model="form.group"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">
                        Chưa phân nhóm
                      </option>
                      <option value="retail">
                        Bán lẻ
                      </option>
                      <option value="vip">
                        VIP
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
                    <label class="block text-xs font-medium text-gray-600 mb-1">Tỉnh/Thành phố</label>
                    <RemoteSearchSelect
                      v-model="selectedProvince"
                      :fetch-fn="fetchProvinces"
                      placeholder="Chọn Tỉnh/Thành phố"
                      label-field="name"
                      clearable
                      searchable
                      :dropdown-max-height="320"
                      search-in-trigger
                      @select="onSelectProvince"
                      @clear="onClearProvince"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Phường/Xã</label>
                    <RemoteSearchSelect
                      v-model="selectedWard"
                      :fetch-fn="fetchWards"
                      :disabled="!selectedProvince"
                      placeholder="Chọn Phường/Xã"
                      label-field="name"
                      clearable
                      searchable
                      :dropdown-max-height="320"
                      search-in-trigger
                      @select="onSelectWard"
                      @clear="onClearWard"
                    />
                  </div>
                  <div>
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

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Ghi chú</BaseCardHeader>
              <div class="-mx-6 px-6">
                <textarea
                  v-model="form.note"
                  rows="4"
                  class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Nhập ghi chú cho khách hàng"
                />
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
          <button
            type="button"
            class="px-6 h-10 rounded-md font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition shadow sm bg-primary-600 text-white hover:bg-primary-700"
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
