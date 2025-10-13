<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import { customersService } from '@/services/customers.service'
import { useLocations } from '@/composables/useLocations'
import BaseModal from '~/components/base/BaseModal.vue'

interface CustomerDraft {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  shipFirstName: string
  shipLastName: string
  shipCompany: string
  shipPhone: string
  shipProvince: string
  shipWard: string
  shipAddress: string
  country: string
  zipcode: string
}

interface SavedCustomerPayload { id: string | number; name: string; phone: string; code: string }
interface GenericLocationItem { id?: number | string; name?: string; code?: string | number; division_type?: string; [k: string]: unknown }

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved', customer: SavedCustomerPayload): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const draft = ref<CustomerDraft>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  shipFirstName: '',
  shipLastName: '',
  shipCompany: '',
  shipPhone: '',
  shipProvince: '',
  shipWard: '',
  shipAddress: '',
  country: 'Vietnam',
  zipcode: ''
})
const showExtraInfo = ref(false)
const error = ref('')

const selectedProvince = ref<GenericLocationItem | null>(null)
const selectedWard = ref<GenericLocationItem | null>(null)

const selectedProvinceCode = computed(() => {
  const code = selectedProvince.value?.code
  return (typeof code === 'string' || typeof code === 'number') ? code : null
})

const { getProvinces, getWards } = useLocations()

async function fetchProvinces(search: string): Promise<GenericLocationItem[]> {
  return getProvinces(search) as Promise<GenericLocationItem[]>
}
async function fetchWards(search: string): Promise<GenericLocationItem[]> {
  if (!selectedProvinceCode.value) return []
  return getWards(search, selectedProvinceCode.value) as Promise<GenericLocationItem[]>
}

function onSelectProvince(item: GenericLocationItem) {
  selectedProvince.value = item
  draft.value.shipProvince = String(item?.name ?? '')
  selectedWard.value = null
  draft.value.shipWard = ''
}
function onClearProvince() {
  selectedProvince.value = null
  draft.value.shipProvince = ''
  selectedWard.value = null
  draft.value.shipWard = ''
}
function onSelectWard(item: GenericLocationItem) {
  selectedWard.value = item
  draft.value.shipWard = String(item?.name ?? '')
}
function onClearWard() {
  selectedWard.value = null
  draft.value.shipWard = ''
}

function reset() {
  draft.value = {
    firstName: '', lastName: '', email: '', phone: '', company: '',
    shipFirstName: '', shipLastName: '', shipCompany: '', shipPhone: '',
    shipProvince: '', shipWard: '', shipAddress: '', country: 'Vietnam', zipcode: ''
  }
  selectedProvince.value = null
  selectedWard.value = null
  showExtraInfo.value = false
  error.value = ''
}

watch(open, (v) => { if (v) reset() })

// ❌ Bỏ bắt buộc nhập số điện thoại
const touched = ref({ firstName: false, lastName: false })
const lastNameError = computed(() => (touched.value.firstName && !draft.value.lastName.trim() ? 'Họ là bắt buộc' : ''))
const firstNameError = computed(() => (touched.value.lastName && !draft.value.firstName.trim() ? 'Tên là bắt buộc' : ''))
const hasErrors = computed(() => !!(firstNameError.value || lastNameError.value))

async function save() {
  touched.value.firstName = true
  touched.value.lastName = true
  error.value = ''
  if (hasErrors.value) return

  const first = draft.value.firstName.trim()
  const last = draft.value.lastName.trim()
  const phone = draft.value.phone?.trim() || null

  try {
    const fullName = `${last} ${first}`.trim()
    const payload = {
      fullName,
      email: draft.value.email || null,
      phoneNumber: phone,
      birthDate: null,
      gender: null,
      note: null,
      customerCode: null,
      customerGroupId: null,
      ownerUserId: null,
      tags: [],
      countryId: 'VN',
      stateOrProvinceId: null,
      districtId: null,
      wardId: null,
      addressLine1: draft.value.shipAddress || null,
      addressLine2: null,
      zipCode: draft.value.zipcode || null,
      contactName: null,
      avatarUrl: null
    }
      const res = await customersService.createCustomer(payload)
      const rData = (res as unknown as { data?: { customerId?: string, customerCode?: string } })?.data || null
      const createdId = rData?.customerId || String(Date.now())
      const created = { id: createdId, name: fullName, phone: phone || '', code: rData?.customerCode || '' }
    emit('saved', created)
    open.value = false
  } catch (e) {
    console.error('Create customer failed', e)
    error.value = 'Tạo khách hàng thất bại'
  }
}

function close() { open.value = false }
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4"
      @keydown.esc="close"
    >
      <div
        class="bg-white w-full max-w-3xl rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-customer-title"
        @click.stop
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 class="text-lg font-semibold">
            <span id="add-customer-title">Thêm mới khách hàng</span>
          </h3>
          <button class="text-gray-400 hover:text-gray-600" @click="close">&times;</button>
        </div>

        <!-- Nội dung form -->
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-8 text-sm modal-body-scroll">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Họ -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Họ <span class="text-red-500">*</span></label>
              <input
                v-model="draft.lastName"
                type="text"
                class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                :class="lastNameError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'"
                placeholder="Nhập họ"
                @blur="touched.firstName = true"
              >
              <p v-if="lastNameError" class="text-xs text-red-600 mt-1">{{ lastNameError }}</p>
            </div>

            <!-- Tên -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Tên <span class="text-red-500">*</span></label>
              <input
                v-model="draft.firstName"
                type="text"
                class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                :class="firstNameError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'"
                placeholder="Nhập tên"
                @blur="touched.lastName = true"
              >
              <p v-if="firstNameError" class="text-xs text-red-600 mt-1">{{ firstNameError }}</p>
            </div>

            <!-- Email -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                v-model="draft.email"
                type="email"
                class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nhập email"
              >
            </div>

            <!-- SĐT (Không bắt buộc) -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
              <div class="flex items-center gap-2">
                <input
                  v-model="draft.phone"
                  type="text"
                  class="flex-1 h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border-gray-300 bg-white"
                  placeholder="Nhập số điện thoại (không bắt buộc)"
                >
                <div class="h-9 px-2 flex items-center rounded-md border border-gray-300 bg-gray-50 text-xs">VN</div>
              </div>
            </div>
          </div>

          <!-- Thông tin thêm -->
          <div>
            <button type="button" class="text-primary-600 text-sm font-medium flex items-center gap-1" @click="showExtraInfo=!showExtraInfo">
              <span v-if="!showExtraInfo">Thông tin thêm</span>
              <span v-else>Ẩn thông tin thêm</span>
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path :d="showExtraInfo ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'" />
              </svg>
            </button>
            <div v-if="showExtraInfo" class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Công ty</label>
                <input
                  v-model="draft.company"
                  type="text"
                  class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nhập tên công ty"
                >
              </div>
            </div>
          </div>

          <!-- Địa chỉ nhận hàng -->
          <div>
            <h4 class="text-base font-semibold mb-4">Địa chỉ nhận hàng</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Họ</label>
                <input v-model="draft.shipLastName" type="text" class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nhập họ">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Tên</label>
                <input v-model="draft.shipFirstName" type="text" class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nhập tên">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Công ty</label>
                <input v-model="draft.shipCompany" type="text" class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nhập tên công ty">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
                <input v-model="draft.shipPhone" type="text" class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nhập số điện thoại">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Postal/Zipcode</label>
                <input v-model="draft.zipcode" type="text" class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nhập Postal/Zipcode">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Quốc gia</label>
                <input v-model="draft.country" type="text" class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-100 cursor-not-allowed" readonly>
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
                  :full-width="true"
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
                  :full-width="true"
                  search-in-trigger
                  @select="onSelectWard"
                  @clear="onClearWard"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-gray-600 mb-1">Địa chỉ cụ thể</label>
                <input v-model="draft.shipAddress" type="text" class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nhập địa chỉ cụ thể">
              </div>
            </div>
          </div>

          <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
        </div>

        <!-- Nút hành động -->
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button type="button" class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50" @click="close">Hủy</button>
          <button type="button" class="h-9 px-5 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700" @click="save">Lưu</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
