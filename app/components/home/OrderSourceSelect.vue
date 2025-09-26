<script setup lang="ts">
import type { OrderSourceItem } from '@/services/order-source.service'
import { useOrderSources } from '@/composables/useOrderSources'

interface AllSourceOption {
  id: null
  name: string
  code: string
}
type SourceOption = OrderSourceItem | AllSourceOption

const props = defineProps<{ includeAll?: boolean, required?: boolean, autoSelectPos?: boolean, placeholder?: string }>()
// includeAll only honored when not required
const includeAll = computed(() => props.required ? false : (props.includeAll !== false)) // default true if not required

const model = defineModel<SourceOption | null>({ required: true })

const { ensure, filter, loading } = useOrderSources()

// Define 'Tất cả' option early so items can reference it safely
const allOption = computed<AllSourceOption>(() => ({ id: null, name: 'Tất cả', code: 'ALL' }))
const isAll = computed(() => !!model.value && model.value.id === null && model.value.code === 'ALL')

// Items including synthetic ALL (guaranteed first) using composable's includeAll flag
const items = computed<SourceOption[]>(() => filter('', includeAll.value) as SourceOption[])
// Open state for custom dropdown
const open = ref(false)

function closeOnOutside(e: MouseEvent) {
  const root = rootEl.value
  if (!root) return
  if (!root.contains(e.target as Node)) open.value = false
}

const rootEl = ref<HTMLElement | null>(null)

onMounted(async () => {
  await ensure()
  // Auto select POS if requested and no current selection
  if (!model.value && props.autoSelectPos) {
    const pos = (items.value || []).find(it => (it.code || '').toLowerCase() === 'pos' || (it.name || '').toLowerCase() === 'pos')
    if (pos && pos.id !== null) {
      model.value = pos
    }
  }
  // If still no model and includeAll allowed, default to All
  if (!model.value && includeAll.value) {
    model.value = allOption.value
  }
  document.addEventListener('mousedown', closeOnOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', closeOnOutside)
})

function labelOf(item: SourceOption | null) {
  if (!item) return ''
  return (item as SourceOption).name || ''
}

// (moved above)

function clearToAll() {
  if (!includeAll.value) return
  model.value = allOption.value
  // keep dropdown closed after clear
  open.value = false
}
</script>

<template>
  <div ref="rootEl" class="relative w-full">
    <div
      role="button"
      tabindex="0"
      class="h-9 w-full px-3 rounded-md text-sm font-normal flex items-center justify-between gap-2 bg-transparent hover:bg-gray-50 transition border border-transparent outline-none data-[open=true]:bg-elevated cursor-pointer"
      :data-open="open || null"
      @click="open = !open"
      @keydown.enter.prevent="open = !open"
      @keydown.space.prevent="open = !open"
    >
      <span class="truncate text-left">
        {{ model ? labelOf(model) : (includeAll ? 'Tất cả' : (props.placeholder || 'Chọn nguồn')) }}
      </span>
      <span class="flex items-center gap-1">
        <button
          v-if="includeAll && !isAll"
          type="button"
          class="text-gray-400 hover:text-gray-600 p-0.5 rounded-sm hover:bg-gray-100 transition"
          :title="'Đặt lại'"
          @click.stop="clearToAll()"
        >
          <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
        </button>
        <UIcon
          name="i-lucide-chevron-down"
          class="w-4 h-4 transition-transform duration-200"
          :class="{ 'rotate-180': open, 'opacity-0 w-0': includeAll && !isAll }"
        />
      </span>
    </div>
    <div
      v-if="open"
      class="absolute left-0 top-full z-50 mt-1 w-full min-w-[180px] rounded-md border border-gray-200 bg-white shadow-md py-1 text-sm"
    >
      <div class="text-sm">
        <button
          v-for="it in items"
          :key="(it.id ?? 'all') + ':' + it.code"
          class="w-full text-left px-3 py-1.5 rounded hover:bg-gray-50 flex items-center justify-between"
          :class="{ 'bg-primary-50 text-primary-700': model && model.code === it.code }"
          @click="model = it; open = false"
        >
          <span class="truncate">{{ labelOf(it) }}</span>
          <UIcon v-if="model && model.code === it.code" name="i-lucide-check" class="w-4 h-4" />
        </button>
        <div v-if="!loading && items.length === 0" class="text-xs text-gray-500 px-3 py-2">
          Không có dữ liệu
        </div>
        <div v-if="loading" class="text-xs text-gray-500 px-3 py-2">
          Đang tải...
        </div>
      </div>
    </div>
  </div>
</template>
