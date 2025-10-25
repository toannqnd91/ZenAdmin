<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import { useLocations, type LocationOption } from '@/composables/useLocations'

interface SupplierUpdatePayload {
  name: string
  code: string
  phone?: string | null
  country?: string | null
  region?: string | null
  ward?: string | null
  address?: string | null
  email?: string | null
  taxCode?: string | null
  website?: string | null
  fax?: string | null
  status?: 'active' | 'inactive'
}

interface Props {
  modelValue?: boolean
  value?: Partial<SupplierUpdatePayload>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  value: () => ({ name: '', code: '', phone: null, country: 'Vietnam', region: null, ward: null, address: null, email: null, taxCode: null, website: null, fax: null, status: 'active' })
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', value: SupplierUpdatePayload): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const form = ref<SupplierUpdatePayload>({
  name: '',
  code: '',
  phone: null,
  country: 'Vietnam',
  region: null,
  ward: null,
  address: null,
  email: null,
  taxCode: null,
  website: null,
  fax: null,
  status: 'active'
})

watch(() => props.modelValue, (v) => {
  if (v) {
    form.value = {
      name: props.value?.name ?? '',
      code: props.value?.code ?? '',
      phone: props.value?.phone ?? null,
      country: props.value?.country ?? 'Vietnam',
      region: props.value?.region ?? null,
      ward: props.value?.ward ?? null,
      address: props.value?.address ?? null,
      email: props.value?.email ?? null,
      taxCode: props.value?.taxCode ?? null,
      website: props.value?.website ?? null,
      fax: props.value?.fax ?? null,
      status: props.value?.status ?? 'active'
    }
  }
})

function onSave() {
  emit('save', { ...form.value })
  open.value = false
}

const showMore = ref(false)

// Locations integration
const { getProvinces, getWards } = useLocations()
const selectedProvince = ref<Record<string, unknown> | null>(null)
const selectedWard = ref<Record<string, unknown> | null>(null)

function castLocationItems(list: LocationOption[]): Record<string, unknown>[] {
  return list.map(it => ({ id: it.id, name: it.name, code: it.code, division_type: it.division_type }))
}
async function provinceFetch(search: string) {
  const list = await getProvinces(search)
  return castLocationItems(list)
}
async function wardFetch(search: string) {
  const province = selectedProvince.value as (Record<string, unknown> | null)
  const provinceCode = (province?.code as string | number | undefined) || (province?.id as string | number | undefined) || null
  const list = await getWards(search, provinceCode)
  return castLocationItems(list)
}

function getLocationKey(item: Record<string, unknown>): string | number {
  const keyed = item as { code?: string | number, id?: string | number }
  const v = keyed.code ?? keyed.id
  return typeof v === 'number' || typeof v === 'string' ? v : String(v ?? '')
}

watch(selectedProvince, (v) => {
  const keyed = v as { name?: string | number, code?: string | number, id?: string | number } | null
  form.value.region = v ? String(keyed?.name ?? keyed?.code ?? keyed?.id) : null
  // Reset ward when province changes
  selectedWard.value = null
  form.value.ward = null
})

watch(selectedWard, (w) => {
  const keyed = w as { name?: string | number, code?: string | number, id?: string | number } | null
  form.value.ward = w ? String(keyed?.name ?? keyed?.code ?? keyed?.id) : null
})
</script>

<template>
  <BaseModal v-model="open" title="Sửa nhà cung cấp" width-class="max-w-3xl">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Tên nhà cung cấp -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Tên nhà cung cấp<span class="text-error">*</span></label>
        <input
          v-model="form.name"
          type="text"
          class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Nhập tên nhà cung cấp"
        >
      </div>
      <!-- Mã nhà cung cấp -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Mã nhà cung cấp<span class="text-error">*</span></label>
        <input
          v-model="form.code"
          type="text"
          class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Nhập mã nhà cung cấp"
        >
      </div>

      <!-- Số điện thoại with country -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
        <div class="flex">
          <button type="button" class="h-[36px] px-2 inline-flex items-center gap-1 rounded-l-md border border-gray-300 bg-gray-50 text-sm text-gray-700">
            <span class="i-flag-vietnam w-5 h-5 bg-[url('/icons/flag-vn.svg')] bg-cover" />
            <span>+84</span>
            <svg
              class="w-4 h-4 text-gray-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <input
            v-model="form.phone"
            type="text"
            class="w-full px-3 h-[36px] text-sm rounded-r-md border border-l-0 border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Nhập số điện thoại"
          >
        </div>
      </div>

      <!-- Quốc gia -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Quốc gia</label>
        <select
          v-model="form.country"
          class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="Vietnam">
            Vietnam
          </option>
        </select>
      </div>

      <!-- Tỉnh/thành phố -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Tỉnh/thành phố</label>
        <RemoteSearchSelect
          v-model="selectedProvince"
          :fetch-fn="provinceFetch"
          label-field="name"
          :get-item-key="getLocationKey"
          placeholder="Chọn Tỉnh/thành"
          :clearable="true"
          :full-width="true"
        />
      </div>

      <!-- Phường xã -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Phường xã</label>
        <RemoteSearchSelect
          v-model="selectedWard"
          :fetch-fn="wardFetch"
          label-field="name"
          :get-item-key="getLocationKey"
          placeholder="Chọn Phường xã"
          :clearable="true"
          :full-width="true"
          :disabled="!selectedProvince"
        />
      </div>

      <!-- Địa chỉ cụ thể (full width) -->
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">Địa chỉ cụ thể</label>
        <input
          v-model="form.address"
          type="text"
          class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Nhập địa chỉ cụ thể"
        >
      </div>

      <!-- Thông tin thêm (disclosure) -->
      <div class="md:col-span-2">
        <button type="button" class="inline-flex items-center gap-1 text-primary-600 text-sm font-medium" @click="showMore = !showMore">
          <span>Thông tin thêm</span>
          <svg
            class="w-4 h-4 transition-transform"
            :class="showMore ? 'rotate-180' : 'rotate-0'"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      <template v-if="showMore">
        <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nhập email"
            >
          </div>
          <!-- Mã số thuế -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
            <input
              v-model="form.taxCode"
              type="text"
              class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nhập mã số thuế"
            >
          </div>
          <!-- Website -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              v-model="form.website"
              type="text"
              class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://"
            >
          </div>
          <!-- Số fax -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Số fax</label>
            <input
              v-model="form.fax"
              type="text"
              class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nhập số fax"
            >
          </div>
          <!-- Trạng thái nhà cung cấp -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Trạng thái nhà cung cấp</label>
            <select
              v-model="form.status"
              class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
      </template>
    </div>

    <template #footer>
      <button
        type="button"
        class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
        @click="open = false"
      >
        Hủy
      </button>
      <button
        type="button"
        class="h-9 px-4 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
        @click="onSave"
      >
        Lưu
      </button>
    </template>
  </BaseModal>
</template>
