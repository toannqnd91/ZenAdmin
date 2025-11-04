<script setup lang="ts">
import { ref, computed } from 'vue'
import { warehouseService, type WarehouseItem } from '@/services/warehouse.service'

interface Props {
  modelValue: WarehouseItem | WarehouseItem[] | null
  placeholder?: string
  multiple?: boolean
  clearable?: boolean
  fullWidth?: boolean
  disabled?: boolean
  borderless?: boolean
  autoWidth?: boolean
  dropdownMaxHeight?: number | string
  triggerClass?: string
}
const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Chọn chi nhánh',
  multiple: false,
  clearable: false,
  fullWidth: true,
  disabled: false,
  borderless: false,
  autoWidth: false
})
const emit = defineEmits<{
  (e: 'update:modelValue' | 'select', v: WarehouseItem | WarehouseItem[] | null): void
  (e: 'clear'): void
}>()

// Local cache of branches
const branches = ref<WarehouseItem[]>([])
const branchesLoading = ref(false)

async function ensureBranches() {
  if (branches.value.length || branchesLoading.value) return
  branchesLoading.value = true
  try {
    const res = await warehouseService.getWarehousesCached({
      onUpdated: (data) => {
        branches.value = Array.isArray(data) ? data : []
      }
    })
    branches.value = Array.isArray(res.data) ? res.data : []
    if (res.refreshPromise) {
      res.refreshPromise
        .catch(() => {})
        .finally(() => {
          branchesLoading.value = false
        })
    } else {
      branchesLoading.value = false
    }
  } catch {
    branchesLoading.value = false
  }
}

// RemoteSearchSelect expects Record<string, unknown>[] items
const fetchFn: (q: string) => Promise<Record<string, unknown>[]> = async (q: string) => {
  await ensureBranches()
  const term = (q || '').toLowerCase().trim()
  const src = branches.value
  const list = term ? src.filter(b => (b.name || '').toLowerCase().includes(term)) : src
  return list as unknown as Record<string, unknown>[]
}

// Bridge modelValue to RemoteSearchSelect's generic model type
const innerValue = computed<
  Record<string, unknown> | Record<string, unknown>[] | null
>({
  get() {
    return props.modelValue as unknown as Record<string, unknown> | Record<string, unknown>[] | null
  },
  set(v) {
    emit('update:modelValue', v as unknown as WarehouseItem | WarehouseItem[] | null)
    emit('select', v as unknown as WarehouseItem | WarehouseItem[] | null)
  }
})
</script>

<template>
  <AsyncSelect
    v-model="innerValue"
    :fetch-fn="fetchFn"
    label-field="name"
    :get-item-key="it => String((it as any).id)"
    :placeholder="props.placeholder"
    :clearable="props.clearable"
    :full-width="props.fullWidth"
    :multiple="props.multiple"
    :disabled="props.disabled"
    :borderless="props.borderless"
    :auto-width="props.autoWidth"
    :dropdown-max-height="props.dropdownMaxHeight as any"
    :trigger-class="props.triggerClass"
  />
</template>

<style scoped>
</style>
