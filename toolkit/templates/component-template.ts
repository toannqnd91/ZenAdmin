/**
 * Component Templates
 */

export const modalTemplate = `<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '{{ComponentName}}'
})

const emit = defineEmits<{
  submit: []
  cancel: []
}>()

const isOpen = ref(false)
const loading = ref(false)

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

async function handleSubmit() {
  loading.value = true
  try {
    emit('submit')
    close()
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  emit('cancel')
  close()
}

defineExpose({ open, close })
</script>

<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">{{ title }}</h3>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            @click="close"
          />
        </div>
      </template>

      <div class="space-y-4">
        <slot />
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="handleCancel">
            Cancel
          </UButton>
          <UButton :loading="loading" @click="handleSubmit">
            Submit
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
`

export const formTemplate = `<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  modelValue?: any
  mode?: 'create' | 'edit'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create'
})

const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const form = ref({
  // Add form fields here
})

const loading = ref(false)
const errors = ref<Record<string, string>>({})

function validate(): boolean {
  errors.value = {}
  // Add validation logic here
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  
  loading.value = true
  try {
    emit('submit', form.value)
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="{{component-name}}-form">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Add form fields here -->
      <slot :form="form" :errors="errors" />
    </div>

    <div class="flex justify-end gap-2 mt-6">
      <button
        type="button"
        class="px-6 h-10 rounded-md font-semibold text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        @click="handleCancel">
        Cancel
      </button>
      <button
        type="button"
        class="px-6 h-10 rounded-md font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition shadow bg-primary-600 text-white hover:bg-primary-700"
        :disabled="loading"
        @click="handleSubmit">
        <span v-if="!loading">{{ mode === 'create' ? 'Create' : 'Update' }}</span>
        <span v-else class="flex items-center gap-2">
          <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="4" class="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke-width="4" class="opacity-75" stroke-linecap="round" />
          </svg>
          Saving...
        </span>
      </button>
    </div>
  </div>
</template>
`

export const listTemplate = `<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '{{ComponentName}}'
})

const emit = defineEmits<{
  select: [item: any]
  delete: [id: number]
}>()

const items = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)
const searchQuery = ref('')

const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'isActive', label: 'Status' },
  { key: 'actions', label: 'Actions' }
]

async function loadData() {
  loading.value = true
  try {
    // Load data logic here
  } finally {
    loading.value = false
  }
}

function handleSelect(item: any) {
  emit('select', item)
}

function handleDelete(id: number) {
  emit('delete', id)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="{{component-name}}-list">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-semibold">{{ title }}</h3>
      <UInput
        v-model="searchQuery"
        placeholder="Search..."
        @input="loadData"
      />
    </div>

    <UTable
      :rows="items"
      :loading="loading"
      :columns="columns"
    >
      <template #actions-data="{ row }">
        <div class="flex gap-2">
          <UButton size="xs" @click="handleSelect(row)">View</UButton>
          <UButton size="xs" variant="outline" color="red" @click="handleDelete(row.id)">Delete</UButton>
        </div>
      </template>
    </UTable>

    <div v-if="totalPages > 1" class="flex justify-center mt-4">
      <UPagination
        v-model="currentPage"
        :total="totalItems"
        :page-size="pageSize"
        @update:model-value="loadData"
      />
    </div>
  </div>
</template>
`
