<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import { useLocations, type LocationOption } from '@/composables/useLocations'
import { supplierService, type UpdateSupplierRequest, type SupplierByIdData } from '@/services/supplier.service'

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
  supplierId?: number | string | null
  slug?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  value: () => ({ name: '', code: '', phone: null, country: 'Vietnam', region: null, ward: null, address: null, email: null, taxCode: null, website: null, fax: null, status: 'active' }),
  supplierId: null,
  slug: null
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
    if (props.supplierId !== null && props.supplierId !== undefined) {
      void loadSupplierDetail()
    }
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
  // If no supplierId, fallback to emitting only (UI-only save)
  if (!props.supplierId && props.supplierId !== 0) {
    emit('save', { ...form.value })
    open.value = false
    return
  }
  void submit()
}

const showMore = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)
const loadingDetail = ref(false)
const loadError = ref<string | null>(null)

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

async function loadSupplierDetail() {
  try {
    loadingDetail.value = true
    loadError.value = null
    const resp = await supplierService.getSupplierById(props.supplierId as number | string)
    if (!resp?.success) throw new Error(resp?.message || 'Tải dữ liệu nhà cung cấp thất bại')
    const d = resp.data as SupplierByIdData

    form.value = {
      name: d.name || '',
      code: d.code || '',
      phone: d.phone || null,
      country: d.country || 'Vietnam',
      region: d.region || null,
      ward: null,
      address: d.address || null,
      email: d.email || null,
      taxCode: d.taxCode || null,
      website: d.website || null,
      fax: d.fax || null,
      status: (d.status as 'active' | 'inactive') || (d.statusEnum === 0 ? 'active' : 'inactive')
    }

    // Select province and ward if we have ids
    if (d.provinceId != null) {
      const provinces = await getProvinces('')
      const p = (provinces || []).find((it: LocationOption) => Number(it.id) === Number(d.provinceId))
      if (p) {
        selectedProvince.value = { id: p.id, code: p.code, name: p.name, division_type: p.division_type } as unknown as Record<string, unknown>
        if (d.wardId != null) {
          const wards = await getWards('', p.code || p.id)
          const w = (wards || []).find((it: LocationOption) => Number(it.id) === Number(d.wardId))
          if (w) {
            selectedWard.value = { id: w.id, code: w.code, name: w.name, division_type: w.division_type } as unknown as Record<string, unknown>
          }
        }
      }
    }
  } catch (e: unknown) {
    loadError.value = e instanceof Error ? e.message : 'Không thể tải dữ liệu'
  } finally {
    loadingDetail.value = false
  }
}

async function submit() {
  if (saving.value) return
  saving.value = true
  saveError.value = null
  try {
    // Derive ids for province/ward if selected
    const provinceObj = selectedProvince.value as (Record<string, unknown> | null)
    const wardObj = selectedWard.value as (Record<string, unknown> | null)
    const provinceId = provinceObj ? Number((provinceObj.id as number | string | undefined) ?? (provinceObj.code as number | string | undefined) ?? NaN) : null
    const wardId = wardObj ? Number((wardObj.id as number | string | undefined) ?? (wardObj.code as number | string | undefined) ?? NaN) : null

    const payload: UpdateSupplierRequest = {
      name: form.value.name,
      code: form.value.code || null,
      slug: props.slug ?? null,
      phoneCountryCode: '84',
      phone: form.value.phone || null,
      email: form.value.email || null,
      address: form.value.address || null,
      country: form.value.country || null,
      region: form.value.region || null,
      provinceId: Number.isNaN(provinceId as number) ? null : (provinceId as number),
      wardId: Number.isNaN(wardId as number) ? null : (wardId as number),
      taxCode: form.value.taxCode || null,
      website: form.value.website || null,
      fax: form.value.fax || null,
      status: form.value.status || null
    }

    await supplierService.updateSupplier(props.supplierId as number | string, payload)
    // Emit updated basic info back to parent to refresh local UI
    emit('save', { ...form.value })
    open.value = false
  } catch (e: unknown) {
    saveError.value = e instanceof Error ? e.message : 'Lưu thất bại'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal v-model="open" title="Sửa nhà cung cấp" width-class="max-w-3xl">
    <div v-if="loadingDetail" class="text-sm text-gray-500 mb-2">Đang tải dữ liệu...</div>
    <div v-if="loadError" class="text-sm text-error mb-2">{{ loadError }}</div>
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
          searchable
          search-in-trigger
          :dropdown-max-height="320"
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
          searchable
          search-in-trigger
          :dropdown-max-height="320"
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

      <!-- Thông tin thêm (disclosure) shown at top only when collapsed -->
      <div v-if="!showMore" class="md:col-span-2">
        <button type="button" class="inline-flex items-center gap-1 text-primary-600 text-sm font-medium" @click="showMore = true">
          <span>Thông tin thêm</span>
          <svg
            class="w-4 h-4 transition-transform rotate-0"
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
        <!-- Move the toggle to bottom when expanded -->
        <div class="md:col-span-2">
          <button type="button" class="inline-flex items-center gap-1 text-primary-600 text-sm font-medium" @click="showMore = false">
            <span>Thông tin thêm</span>
            <svg
              class="w-4 h-4 transition-transform rotate-180"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </template>
    </div>

    <template #footer>
      <div v-if="saveError" class="text-error text-sm mr-auto">
        {{ saveError }}
      </div>
      <button
        type="button"
        class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
        @click="open = false"
      >
        Hủy
      </button>
      <button
        type="button"
        class="h-9 px-4 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
        :disabled="saving"
        @click="onSave"
      >
        <span v-if="saving">Đang lưu...</span>
        <span v-else>Lưu</span>
      </button>
    </template>
  </BaseModal>
</template>
