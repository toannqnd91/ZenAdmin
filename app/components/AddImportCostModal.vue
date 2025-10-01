<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface ImportCostDraft { name: string; value: number | string }
interface ImportCostPayload { name: string; value: number }

const props = withDefaults(defineProps<{
  modelValue: boolean
  initialCosts?: ImportCostPayload[]
}>(), {
  initialCosts: () => []
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved', costs: ImportCostPayload[]): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const drafts = ref<ImportCostDraft[]>([])
const touched = ref<boolean[]>([])

function reset() {
  drafts.value = props.initialCosts.length
    ? props.initialCosts.map(c => ({ name: c.name, value: c.value }))
    : [{ name: '', value: '' }]
  touched.value = drafts.value.map(() => false)
}

watch(() => props.modelValue, (v) => { if (v) reset() })

function addRow() {
  drafts.value.push({ name: '', value: '' })
  touched.value.push(false)
}
function removeRow(idx: number) {
  if (drafts.value.length === 1) return
  drafts.value.splice(idx, 1)
  touched.value.splice(idx, 1)
}

function rowErrorName(idx: number) {
  const d = drafts.value[idx]
  if (!touched.value[idx]) return ''
  return d.name.trim() ? '' : 'Tên chi phí bắt buộc'
}
function rowErrorValue(idx: number) {
  const d = drafts.value[idx]
  if (!touched.value[idx]) return ''
  const num = Number(d.value)
  if (d.value === '') return '' // optional value -> treat as 0
  if (!Number.isFinite(num) || num < 0) return 'Giá trị không hợp lệ'
  return ''
}

const hasErrors = computed(() => drafts.value.some((_, i) => rowErrorName(i) || rowErrorValue(i)))
const total = computed(() => drafts.value.reduce((s, d) => s + (Number(d.value) > 0 ? Number(d.value) : 0), 0))

function apply() {
  // mark touched
  touched.value = touched.value.map(() => true)
  if (hasErrors.value) return
  const cleaned: ImportCostPayload[] = drafts.value
    .filter(d => d.name.trim())
    .map(d => ({ name: d.name.trim(), value: Math.max(0, Number(d.value) || 0) }))
  emit('saved', cleaned)
  open.value = false
}
function close() { open.value = false }
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4" @keydown.esc="close">
      <div
        class="bg-white w-full max-w-3xl rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-import-cost-title"
        @click.stop
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 class="text-lg font-semibold">
            <span id="add-import-cost-title">Thêm chi phí nhập hàng</span>
          </h3>
          <button class="text-gray-400 hover:text-gray-600" @click="close">&times;</button>
        </div>
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm modal-body-scroll">
          <div class="space-y-4">
            <div v-for="(row, idx) in drafts" :key="idx" class="grid grid-cols-12 gap-4">
              <div class="col-span-6">
                <label class="block text-xs font-medium text-gray-600 mb-1">
                  Tên chi phí <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="row.name"
                  type="text"
                  class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  :class="rowErrorName(idx) ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'"
                  placeholder="Nhập tên chi phí"
                  @blur="touched[idx] = true"
                >
                <p
                  v-if="rowErrorName(idx)"
                  class="text-xs text-red-600 mt-1"
                >
                  {{ rowErrorName(idx) }}
                </p>
              </div>
              <div class="col-span-5">
                <label class="block text-xs font-medium text-gray-600 mb-1">
                  Giá trị
                </label>
                <div class="relative">
                  <input
                    v-model="row.value"
                    type="number"
                    min="0"
                    class="w-full h-9 px-3 pr-7 rounded-md border text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                    :class="rowErrorValue(idx) ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'"
                    placeholder="0"
                    @blur="touched[idx] = true"
                  >
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">₫</span>
                </div>
                <p
                  v-if="rowErrorValue(idx)"
                  class="text-xs text-red-600 mt-1"
                >
                  {{ rowErrorValue(idx) }}
                </p>
              </div>
              <div class="col-span-1 flex flex-col items-center">
                <span class="block text-xs font-medium mb-1">&nbsp;</span>
                <button
                  v-if="drafts.length > 1"
                  type="button"
                  class="text-gray-400 hover:text-gray-600 flex items-center justify-center h-9 w-9 rounded focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  aria-label="Xóa dòng chi phí"
                  @click="removeRow(idx)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-5 h-5"
                  >
                    <path d="M6 7h12" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 7V5h6v2" />
                    <path d="M8 7v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7" />
                  </svg>
                </button>
              </div>
            </div>
            <button
              type="button"
              class="flex items-center text-primary-600 text-sm font-medium"
              @click="addRow"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Thêm chi phí
            </button>
          </div>
          <div class="bg-blue-50 rounded-lg px-5 py-4 flex items-center justify-between">
            <span class="font-medium text-sm">Tổng chi phí</span>
            <span class="font-semibold text-base">{{ total.toLocaleString() }}₫</span>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
            @click="close"
          >
            Hủy
          </button>
          <button
            type="button"
            class="h-9 px-5 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            :disabled="hasErrors"
            @click="apply"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-body-scroll { -webkit-overflow-scrolling: touch; }
.modal-body-scroll::-webkit-scrollbar { width: 8px; }
.modal-body-scroll::-webkit-scrollbar-track { background: transparent; }
.modal-body-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
.modal-body-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>
