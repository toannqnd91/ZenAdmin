<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import { warehouseService, type WarehouseItem } from '@/services/warehouse.service'

type Generic = Record<string, unknown>

export interface WarehouseOption {
  id: number | string | null
  name: string
  isDefault?: boolean
}

interface Props {
  modelValue: WarehouseOption | null
  placeholder?: string
  includeAll?: boolean
  clearable?: boolean
  borderless?: boolean
  autoWidth?: boolean
  fullWidth?: boolean
  dropdownMaxHeight?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Tất cả chi nhánh',
  includeAll: true,
  clearable: true,
  borderless: true,
  autoWidth: true,
  fullWidth: false,
  dropdownMaxHeight: 320
})
const emit = defineEmits<{
  (e: 'update:modelValue' | 'select', v: WarehouseOption | null): void
  (e: 'clear'): void
}>()

let cache: WarehouseItem[] | null = null
const loading = ref(false)

function mapItem(w: WarehouseItem): WarehouseOption {
  return { id: w.id, name: w.name, isDefault: !!w.isDefault }
}

async function fetchWarehouses(search: string): Promise<Generic[]> {
  try {
    loading.value = true
    if (!cache) {
      const res = await warehouseService.getWarehouses()
      cache = Array.isArray(res?.data) ? res.data : []
    }
    const list = (cache || []).map(mapItem)
    const lower = (search || '').toLowerCase()
    const filtered = lower ? list.filter(w => w.name.toLowerCase().includes(lower)) : list
    if (props.includeAll) {
      const all: WarehouseOption = { id: null, name: 'Tất cả chi nhánh' }
      return [all as unknown as Generic, ...filtered as unknown as Generic[]]
    }
    return filtered as unknown as Generic[]
  } catch {
    const all: WarehouseOption = { id: null, name: 'Tất cả chi nhánh' }
    return props.includeAll ? [all as unknown as Generic] : []
  } finally {
    loading.value = false
  }
}

function onUpdate(v: Generic | null) {
  emit('update:modelValue', (v as WarehouseOption | null))
}

// Persist selection to cookie so HTTP interceptor can attach WarehouseId header globally
const whId = useCookie<string | null>('warehouse_id')
const whName = useCookie<string | null>('warehouse_name')

watch(() => props.modelValue, (val: WarehouseOption | null) => {
  if (val && val.id !== undefined && val.id !== null) {
    whId.value = String(val.id)
    whName.value = String(val.name || '')
  } else {
    whId.value = null
    whName.value = null
  }
}, { immediate: true })

// Initialize from cookie if parent hasn't bound a value
onMounted(() => {
  if (!props.modelValue && whId.value) {
    const idStr = String(whId.value)
    const idNum = Number(idStr)
    const id = Number.isFinite(idNum) ? idNum : idStr
    emit('update:modelValue', { id, name: whName.value || 'Tất cả chi nhánh' })
  }
})
</script>

<template>
  <RemoteSearchSelect
    :model-value="modelValue as unknown as Generic"
    :fetch-fn="fetchWarehouses"
    :placeholder="placeholder"
    label-field="name"
    :clearable="clearable && !!modelValue && (modelValue as any)?.id !== null"
    :searchable="false"
    :dropdown-max-height="dropdownMaxHeight"
    :auto-width="autoWidth"
    :borderless="borderless"
    :full-width="fullWidth"
    trigger-class="min-w-[180px]"
    @update:model-value="onUpdate($event as any)"
    @clear="$emit('update:modelValue', includeAll ? { id: null, name: 'Tất cả chi nhánh' } : null); $emit('clear')"
  />
</template>
