/**
 * Component Generator
 * Generates reusable components following project patterns
 */

export interface ComponentGeneratorOptions {
  name: string
  type: 'form' | 'modal' | 'list' | 'card' | 'generic'
  props?: Array<{
    name: string
    type: string
    required?: boolean
    default?: any
  }>
  emits?: string[]
  hasSlots?: boolean
}

export function generateComponent(options: ComponentGeneratorOptions): string {
  const { name, type, props = [], emits = [], hasSlots = false } = options

  const propsInterface = props.length > 0 ? `
interface Props {
${props.map(p => `  ${p.name}${p.required ? '' : '?'}: ${p.type}`).join('\n')}
}

const props = ${props.some(p => p.default !== undefined) ? 'withDefaults(' : ''}defineProps<Props>()${props.some(p => p.default !== undefined) ? `, {
${props.filter(p => p.default !== undefined).map(p => `  ${p.name}: ${JSON.stringify(p.default)}`).join(',\n')}
})` : ''}
` : ''

  const emitsDefinition = emits.length > 0 ? `
const emit = defineEmits<{
${emits.map(e => `  ${e}: []`).join('\n')}
}>()
` : ''

  let template = ''
  
  if (type === 'modal') {
    template = `<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">${name}</h3>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            @click="isOpen = false"
          />
        </div>
      </template>

      <div class="space-y-4">
        ${hasSlots ? '<slot />' : '<!-- Modal content -->'}
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="isOpen = false">
            Cancel
          </UButton>
          <UButton @click="handleSubmit">
            Submit
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>`
  } else if (type === 'form') {
    template = `<template>
  <UForm :state="form" @submit="handleSubmit">
    <div class="space-y-4">
      ${hasSlots ? '<slot :form="form" />' : '<!-- Form fields -->'}
    </div>

    <div class="flex justify-end gap-2 mt-6">
      <UButton type="button" variant="outline" @click="handleCancel">
        Cancel
      </UButton>
      <UButton type="submit" :loading="loading">
        Submit
      </UButton>
    </div>
  </UForm>
</template>`
  } else if (type === 'list') {
    template = `<template>
  <div class="space-y-4">
    <UTable
      :rows="items"
      :loading="loading"
      :columns="columns"
    >
      ${hasSlots ? '<slot name="row" />' : ''}
    </UTable>

    <div v-if="totalPages > 1" class="flex justify-center">
      <UPagination
        v-model="currentPage"
        :total="totalItems"
        :page-size="pageSize"
      />
    </div>
  </div>
</template>`
  } else if (type === 'card') {
    template = `<template>
  <UPageCard variant="soft" class="bg-white rounded-lg">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold">${name}</h3>
        ${hasSlots ? '<slot name="actions" />' : ''}
      </div>
    </template>

    <div class="-mx-6 px-6">
      ${hasSlots ? '<slot />' : '<!-- Card content -->'}
    </div>
  </UPageCard>
</template>`
  } else {
    template = `<template>
  <div class="${name.toLowerCase()}">
    ${hasSlots ? '<slot />' : `<!-- ${name} content -->`}
  </div>
</template>`
  }

  return `<script setup lang="ts">
import { ref } from 'vue'
${propsInterface}${emitsDefinition}
${type === 'modal' ? `const isOpen = ref(false)

function handleSubmit() {
  // Handle submit logic
  ${emits.includes('submit') ? 'emit(\'submit\')' : ''}
  isOpen.value = false
}
` : type === 'form' ? `const form = ref({})
const loading = ref(false)

function handleSubmit() {
  loading.value = true
  // Handle submit logic
  ${emits.includes('submit') ? 'emit(\'submit\', form.value)' : ''}
  loading.value = false
}

function handleCancel() {
  ${emits.includes('cancel') ? 'emit(\'cancel\')' : ''}
}
` : type === 'list' ? `const items = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' }
]
` : ''}
</script>

${template}

<style scoped>
/* Component styles */
</style>
`
}

export function generateComponentFile(options: ComponentGeneratorOptions): { path: string, content: string } {
  return {
    path: `app/components/${options.name}.vue`,
    content: generateComponent(options)
  }
}
