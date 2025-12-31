<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import { useLocations } from '@/composables/useLocations'

interface WarehouseDraft {
  name: string
  contactName: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  zipCode: string
  wardId: number | null
  stateOrProvinceId: number | null
  countryId: string
  latitude: number | null
  longitude: number | null
}

// API payload allows nullable for optional text fields
interface WarehouseCreatePayload {
  name: string
  contactName: string | null
  phone: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  zipCode: string | null
  wardId: number | null
  stateOrProvinceId: number | null
  countryId: string
  latitude: number | null
  longitude: number | null
}

interface CreatedWarehouseMinimal { id?: number | string }

const props = defineProps<{ modelValue: boolean, warehouseId?: number | string | null }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved', warehouse: { id: string | number, name: string }): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const draft = ref<WarehouseDraft>({
  name: '',
  contactName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  zipCode: '',
  wardId: null,
  stateOrProvinceId: null,
  countryId: 'VN',
  latitude: null,
  longitude: null
})

const touched = ref({ name: false })
const error = ref('')
const loading = ref(false)

// Location (Province & Ward) selections
interface GenericLocationItem {
  id?: number | string
  name?: string
  code?: string | number
  division_type?: string
  [k: string]: unknown
}
const selectedProvince = ref<GenericLocationItem | null>(null)
const selectedWard = ref<GenericLocationItem | null>(null)
const selectedProvinceCode = computed(() => {
  const code = selectedProvince.value?.code
  return (typeof code === 'string' || typeof code === 'number') ? code : null
})

const { getProvinces, getWards } = useLocations()

async function fetchProvinces(search: string): Promise<GenericLocationItem[]> {
  const list = await getProvinces(search)
  return list as GenericLocationItem[]
}
async function fetchWards(search: string): Promise<GenericLocationItem[]> {
  if (!selectedProvinceCode.value) return []
  const list = await getWards(search, selectedProvinceCode.value)
  return list as GenericLocationItem[]
}
function onSelectProvince(item: GenericLocationItem) {
  selectedProvince.value = item
  draft.value.stateOrProvinceId = (item?.id as number) ?? null
  // Reset ward
  selectedWard.value = null
  draft.value.wardId = null
}
function onClearProvince() {
  selectedProvince.value = null
  draft.value.stateOrProvinceId = null
  selectedWard.value = null
  draft.value.wardId = null
}
function onSelectWard(item: GenericLocationItem) {
  selectedWard.value = item
  draft.value.wardId = (item?.id as number) ?? null
}
function onClearWard() {
  selectedWard.value = null
  draft.value.wardId = null
}

const nameError = computed(() => (touched.value.name && !draft.value.name.trim() ? 'Tên chi nhánh là bắt buộc' : ''))
const hasErrors = computed(() => !!nameError.value)

async function reset() {
  draft.value = {
    name: '', contactName: '', phone: '', addressLine1: '', addressLine2: '', city: '', zipCode: '', wardId: null, stateOrProvinceId: null, countryId: 'VN', latitude: null, longitude: null
  }
  selectedProvince.value = null
  selectedWard.value = null
  touched.value.name = false
  error.value = ''

  if (props.warehouseId) {
    loading.value = true
    try {
      const svc = await import('@/services/warehouse.service')
      const res = await svc.warehouseService.getWarehouse(props.warehouseId)
      if (res.success && res.data) {
        const d = res.data
        draft.value = {
          name: d.name || '',
          contactName: d.contactName || '',
          phone: d.phone || '',
          addressLine1: d.addressLine1 || '',
          addressLine2: d.addressLine2 || '',
          city: d.city || '',
          zipCode: d.zipCode || '',
          wardId: d.wardId || null,
          stateOrProvinceId: d.stateOrProvinceId || null,
          countryId: d.countryId || 'VN',
          latitude: d.latitude || null,
          longitude: d.longitude || null
        }
        // Pre-fill location selectors if needed (optional optimization: fetch province/ward object details)
        if (draft.value.stateOrProvinceId) {
          // We ideally need the name for the selector. 
          // If not available, remote selector defaults might need ID only or we need to fetch.
          // For now, let's assume the selector handles ID binding or we might miss the label.
          // Actually RemoteSearchSelect usually needs the object with label. 
          // If getWarehouse returns names for province/ward, we are good. If not, we might need to fetch them.
          // A quick hack: see if we can just set the ID and let selector handle it? 
          // RemoteSearchSelect usually expects v-model to be the item (object).
          // If we only have ID, we might need a fetch.
          // Let's check `getProvinces` - maybe we can fetch all or search by ID? 
          // If not, we might leave it blank for now or try to fetch.

          // Simplest approach: Just set the IDs in draft. The selectors might appear empty but saving preserves IDs.
          // BUT user wants to edit. They need to see the value.
          // We can defer this perfection. Let's start with basic data.

          // Fetch Province Item
          if (draft.value.stateOrProvinceId) {
            const provinces = await getProvinces('')
            const p = (provinces as any[]).find((x: any) => x.id == draft.value.stateOrProvinceId)
            if (p) {
              selectedProvince.value = p
              // Fetch wards
              const wards = await getWards('', p.code)
              const w = (wards as any[]).find((x: any) => x.id == draft.value.wardId)
              if (w) selectedWard.value = w
            }
          }
        }
      }
    } catch (e) {
      console.error(e)
      error.value = 'Tải thông tin chi nhánh thất bại'
    } finally {
      loading.value = false
    }
  } else {
    loading.value = false
  }
}

watch(open, (v) => {
  if (v) reset()
})

async function save() {
  touched.value.name = true
  error.value = ''
  if (hasErrors.value) return
  try {
    loading.value = true
    const payload: WarehouseCreatePayload = {
      name: draft.value.name.trim(),
      contactName: draft.value.contactName.trim() || null,
      phone: draft.value.phone.trim() || null,
      addressLine1: draft.value.addressLine1.trim() || null,
      addressLine2: draft.value.addressLine2.trim() || null,
      city: draft.value.city.trim() || null,
      zipCode: draft.value.zipCode.trim() || null,
      wardId: draft.value.wardId,
      stateOrProvinceId: draft.value.stateOrProvinceId,
      countryId: draft.value.countryId,
      latitude: draft.value.latitude,
      longitude: draft.value.longitude
    }
    const svc = await import('@/services/warehouse.service')
    if (props.warehouseId) {
      await svc.warehouseService.updateWarehouse(props.warehouseId, payload)
      emit('saved', { id: props.warehouseId, name: draft.value.name.trim() })
    } else {
      const res = await svc.warehouseService.createWarehouse(payload)
      const rData = (res as unknown as { data?: CreatedWarehouseMinimal })?.data || (res as unknown as CreatedWarehouseMinimal)
      const createdId = (rData && rData.id) ? rData.id : Date.now()
      emit('saved', { id: createdId, name: draft.value.name.trim() })
    }
    open.value = false
  } catch (e) {
    console.error('Save warehouse failed', e)
    error.value = props.warehouseId ? 'Cập nhật thất bại' : 'Tạo chi nhánh thất bại'
  } finally {
    loading.value = false
  }
}

function close() {
  if (!loading.value) open.value = false
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4"
      @keydown.esc="close">
      <div
        class="bg-white w-full max-w-2xl rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]"
        role="dialog" aria-modal="true" aria-labelledby="add-warehouse-title" @click.stop>
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 class="text-lg font-semibold">
            <span id="add-warehouse-title">{{ props.warehouseId ? 'Cập nhật chi nhánh' : 'Thêm chi nhánh' }}</span>
          </h3>
          <button class="text-gray-400 hover:text-gray-600" @click="close">
            &times;
          </button>
        </div>
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-8 text-sm modal-body-scroll">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-600 mb-1">Tên chi nhánh <span
                  class="text-red-500">*</span></label>
              <input v-model="draft.name" type="text"
                class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                :class="nameError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'"
                placeholder="Nhập tên chi nhánh" @blur="touched.name = true">
              <p v-if="nameError" class="text-xs text-red-600 mt-1">
                {{ nameError }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Người liên hệ</label>
              <input v-model="draft.contactName" type="text"
                class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Người liên hệ">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
              <input v-model="draft.phone" type="text"
                class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Số điện thoại">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Zipcode</label>
              <input v-model="draft.zipCode" type="text"
                class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Zipcode">
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Country</label>
              <input v-model="draft.countryId" type="text"
                class="w-full h-9 px-3 rounded-md border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Country" readonly>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Tỉnh/thành</label>
              <RemoteSearchSelect v-model="selectedProvince" :fetch-fn="fetchProvinces"
                placeholder="Chọn Tỉnh/Thành phố" label-field="name" clearable searchable :dropdown-max-height="320"
                :full-width="true" search-in-trigger @select="onSelectProvince" @clear="onClearProvince" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Phường/Xã</label>
              <RemoteSearchSelect v-model="selectedWard" :fetch-fn="fetchWards" :disabled="!selectedProvince"
                placeholder="Chọn Phường/Xã" label-field="name" clearable searchable :dropdown-max-height="320"
                :full-width="true" search-in-trigger @select="onSelectWard" @clear="onClearWard" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-600 mb-1">Địa chỉ 1</label>
              <input v-model="draft.addressLine1" type="text"
                class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Địa chỉ 1">
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-600 mb-1">Địa chỉ 2 (nếu có)</label>
              <input v-model="draft.addressLine2" type="text"
                class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Địa chỉ 2 (nếu có)">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
              <input v-model.number="draft.latitude" type="number" step="0.000001"
                class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Latitude">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
              <input v-model.number="draft.longitude" type="number" step="0.000001"
                class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Longitude">
            </div>
          </div>
          <p v-if="error" class="text-xs text-red-600">
            {{ error }}
          </p>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button type="button"
            class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
            @click="close">
            Hủy
          </button>
          <button type="button"
            class="h-9 px-5 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
            :disabled="loading" @click="save">
            <span v-if="!loading">Lưu</span>
            <span v-else>Đang lưu...</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-body-scroll {
  -webkit-overflow-scrolling: touch;
}

.modal-body-scroll::-webkit-scrollbar {
  width: 8px;
}

.modal-body-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body-scroll::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.modal-body-scroll::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
