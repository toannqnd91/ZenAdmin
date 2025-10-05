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

interface CreatedCustomerMinimal { id?: number | string; customerCode?: string }
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

const touched = ref({ firstName: false, lastName: false, phone: false })
const lastNameError = computed(() => (touched.value.firstName && !draft.value.lastName.trim() ? 'Họ là bắt buộc' : ''))
const firstNameError = computed(() => (touched.value.lastName && !draft.value.firstName.trim() ? 'Tên là bắt buộc' : ''))
const phoneError = computed(() => (touched.value.phone && !draft.value.phone.trim() ? 'SĐT là bắt buộc' : ''))
const hasErrors = computed(() => !!(firstNameError.value || lastNameError.value || phoneError.value))

async function save() {
  touched.value.firstName = true
  touched.value.lastName = true
  touched.value.phone = true
  error.value = ''
  if (hasErrors.value) return
  const first = draft.value.firstName.trim()
  const last = draft.value.lastName.trim()
  const phone = draft.value.phone.trim()
  try {
    const fullName = `${last} ${first}`.trim()
    const payload = {
      fullName,
      email: draft.value.email || null,
      phoneNumber: phone || null,
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
    const rData = (res as unknown as { data?: CreatedCustomerMinimal })?.data || (res as unknown as CreatedCustomerMinimal)
    const createdId = (rData && rData.id) ? rData.id : Date.now()
    const created = { id: createdId, name: fullName, phone, code: rData?.customerCode || '' }
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
</template>
