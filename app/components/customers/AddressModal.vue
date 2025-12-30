<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import { locationService } from '@/services/location.service'

interface AddressDraft {
    firstName: string
    lastName: string
    company: string
    phone: string
    zipcode: string
    country: string
    province: string
    ward: string
    address: string
}

interface GenericLocationItem {
    id?: number | string
    name?: string
    code?: string | number
    division_type?: string
    [k: string]: unknown
}

interface Props {
    modelValue: boolean
    address?: any // Existing address to edit
}

const props = withDefaults(defineProps<Props>(), {
    address: null
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'saved', address: AddressDraft): void
}>()

const open = computed({
    get: () => props.modelValue,
    set: v => emit('update:modelValue', v)
})

const draft = ref<AddressDraft>({
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    zipcode: '',
    country: 'Vietnam',
    province: '',
    ward: '',
    address: ''
})

const selectedProvince = ref<GenericLocationItem | null>(null)
const selectedWard = ref<GenericLocationItem | null>(null)

const selectedProvinceCode = computed(() => {
    const code = selectedProvince.value?.code
    return (typeof code === 'string' || typeof code === 'number') ? code : null
})

async function fetchProvinces(search: string): Promise<GenericLocationItem[]> {
    try {
        const res = await locationService.getProvinces()
        const list = Array.isArray(res?.data) ? res.data : []
        const q = (search || '').toLowerCase()
        const mapped = list.map((p: any) => ({ id: p.id, name: p.name, code: p.code, division_type: p.division_type }))
        return q ? mapped.filter((x: any) => String(x.name).toLowerCase().includes(q)) : mapped
    } catch {
        return []
    }
}

async function fetchWards(search: string): Promise<GenericLocationItem[]> {
    try {
        const pcode = selectedProvinceCode.value
        if (!pcode) return []
        const res = await locationService.getWardsByProvinceCode(pcode as number | string)
        const list = Array.isArray(res?.data) ? res.data : []
        const q = (search || '').toLowerCase()
        const mapped = list.map((w: any) => ({ id: w.id, name: w.name, code: w.code, division_type: w.division_type }))
        return q ? mapped.filter((x: any) => String(x.name).toLowerCase().includes(q)) : mapped
    } catch {
        return []
    }
}

function onSelectProvince(item: GenericLocationItem) {
    selectedProvince.value = item
    draft.value.province = String(item?.name ?? '')
    selectedWard.value = null
    draft.value.ward = ''
}

function onClearProvince() {
    selectedProvince.value = null
    draft.value.province = ''
    selectedWard.value = null
    draft.value.ward = ''
}

function onSelectWard(item: GenericLocationItem) {
    selectedWard.value = item
    draft.value.ward = String(item?.name ?? '')
}

function onClearWard() {
    selectedWard.value = null
    draft.value.ward = ''
}

function reset() {
    if (props.address) {
        // Edit mode - populate with existing data
        draft.value = {
            firstName: props.address.contactName?.split(' ').slice(1).join(' ') || '',
            lastName: props.address.contactName?.split(' ')[0] || '',
            company: '',
            phone: props.address.phoneNumber || '',
            zipcode: props.address.zipCode || '',
            country: 'Vietnam',
            province: props.address.stateOrProvinceName || '',
            ward: props.address.wardName || '',
            address: props.address.addressLine1 || ''
        }

        // Set selected province/ward from address data
        if (props.address.stateOrProvinceId && props.address.stateOrProvinceName) {
            // Initial placeholder to show name immediately
            selectedProvince.value = {
                id: props.address.stateOrProvinceId,
                name: props.address.stateOrProvinceName,
                code: props.address.stateOrProvinceId // Temporary fallback
            }

            // Async lookup to get full province object with correct 'code' for ward fetching
            fetchProvinces(props.address.stateOrProvinceName).then(list => {
                const match = list.find((p: any) =>
                    p.id == props.address.stateOrProvinceId ||
                    String(p.name).toLowerCase() === String(props.address.stateOrProvinceName).toLowerCase()
                )
                if (match) {
                    selectedProvince.value = match
                }
            })
        }

        if (props.address.wardId && props.address.wardName) {
            selectedWard.value = {
                id: props.address.wardId,
                name: props.address.wardName,
                code: props.address.wardId
            }
        }
    } else {
        // Add new mode
        draft.value = {
            firstName: '',
            lastName: '',
            company: '',
            phone: '',
            zipcode: '',
            country: 'Vietnam',
            province: '',
            ward: '',
            address: ''
        }
        selectedProvince.value = null
        selectedWard.value = null
    }
    touched.value = { firstName: false, lastName: false }
}

watch(open, (v) => { if (v) reset() })

const touched = ref({ firstName: false, lastName: false })
const lastNameError = computed(() => (touched.value.lastName && !draft.value.lastName.trim() ? 'Họ là bắt buộc' : ''))
const firstNameError = computed(() => (touched.value.firstName && !draft.value.firstName.trim() ? 'Tên là bắt buộc' : ''))
const hasErrors = computed(() => !!(firstNameError.value || lastNameError.value))

function save() {
    touched.value.firstName = true
    touched.value.lastName = true
    if (hasErrors.value) return

    // Include IDs from selected location items and address ID if editing
    const dataToSave = {
        ...draft.value,
        addressId: props.address?.id || null,
        wardId: selectedWard.value?.id || null,
        provinceId: selectedProvince.value?.id || null
    }

    emit('saved', dataToSave)
    open.value = false
}

function close() {
    open.value = false
}
</script>

<template>
    <Teleport to="body">
        <div v-if="open" class="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4"
            @keydown.esc="close">
            <div class="bg-white w-full max-w-2xl rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]"
                role="dialog" aria-modal="true" aria-labelledby="address-modal-title" @click.stop
                style="overflow: visible;">
                <!-- Header -->
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                    <h3 class="text-lg font-semibold">
                        <span id="address-modal-title">{{ address ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới' }}</span>
                    </h3>
                    <button class="text-gray-400 hover:text-gray-600 text-2xl leading-none" @click="close">
                        &times;
                    </button>
                </div>

                <!-- Form Content -->
                <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm" style="overflow-x: visible;">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6" style="overflow: visible;">
                        <!-- Họ -->
                        <div style="overflow: visible;">
                            <label class="block text-xs font-medium text-gray-600 mb-1">Họ <span
                                    class="text-red-500">*</span></label>
                            <input v-model="draft.lastName" type="text"
                                class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                :class="lastNameError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'"
                                placeholder="Nhập họ" @blur="touched.lastName = true">
                            <p v-if="lastNameError" class="text-xs text-red-600 mt-1">
                                {{ lastNameError }}
                            </p>
                        </div>

                        <!-- Tên -->
                        <div style="overflow: visible;">
                            <label class="block text-xs font-medium text-gray-600 mb-1">Tên <span
                                    class="text-red-500">*</span></label>
                            <input v-model="draft.firstName" type="text"
                                class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                :class="firstNameError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'"
                                placeholder="Nhập tên" @blur="touched.firstName = true">
                            <p v-if="firstNameError" class="text-xs text-red-600 mt-1">
                                {{ firstNameError }}
                            </p>
                        </div>

                        <!-- Công ty -->
                        <div style="overflow: visible;">
                            <label class="block text-xs font-medium text-gray-600 mb-1">Công ty</label>
                            <input v-model="draft.company" type="text"
                                class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Nhập tên công ty">
                        </div>

                        <!-- Số điện thoại -->
                        <div style="overflow: visible;">
                            <label class="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
                            <input v-model="draft.phone" type="text"
                                class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Nhập số điện thoại">
                        </div>

                        <!-- Postal/Zipcode -->
                        <div style="overflow: visible;">
                            <label class="block text-xs font-medium text-gray-600 mb-1">Postal/Zipcode</label>
                            <input v-model="draft.zipcode" type="text"
                                class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Nhập Postal/Zipcode">
                        </div>

                        <!-- Quốc gia -->
                        <div style="overflow: visible;">
                            <label class="block text-xs font-medium text-gray-600 mb-1">Quốc gia</label>
                            <input v-model="draft.country" type="text"
                                class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-100 cursor-not-allowed"
                                readonly>
                        </div>

                        <!-- Tỉnh/Thành phố -->
                        <div style="overflow: visible; position: relative; z-index: 10;">
                            <label class="block text-xs font-medium text-gray-600 mb-1">Tỉnh/Thành phố</label>
                            <RemoteSearchSelect v-model="selectedProvince" :fetch-fn="fetchProvinces"
                                placeholder="Chọn Tỉnh/Thành phố" label-field="name" clearable searchable
                                :dropdown-max-height="320" :full-width="true" search-in-trigger :append-to-body="true"
                                @select="onSelectProvince" @clear="onClearProvince" />
                        </div>

                        <!-- Phường/Xã -->
                        <div style="overflow: visible; position: relative; z-index: 10;">
                            <label class="block text-xs font-medium text-gray-600 mb-1">Phường/Xã</label>
                            <RemoteSearchSelect v-model="selectedWard" :fetch-fn="fetchWards"
                                :disabled="!selectedProvince" placeholder="Chọn Phường/Xã" label-field="name" clearable
                                searchable :dropdown-max-height="320" :full-width="true" search-in-trigger
                                :append-to-body="true" @select="onSelectWard" @clear="onClearWard" />
                        </div>

                        <!-- Địa chỉ cụ thể -->
                        <div class="md:col-span-2" style="overflow: visible;">
                            <label class="block text-xs font-medium text-gray-600 mb-1">Địa chỉ cụ thể</label>
                            <input v-model="draft.address" type="text"
                                class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Nhập địa chỉ cụ thể">
                        </div>
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
                    <button type="button"
                        class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
                        @click="close">
                        Hủy
                    </button>
                    <button type="button"
                        class="h-9 px-5 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
                        @click="save">
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
/* Ensure dropdowns render above modal content */
:deep(.dropdown-menu),
:deep([role="listbox"]),
:deep(.select-dropdown) {
    z-index: 9999 !important;
    position: fixed !important;
}
</style>
