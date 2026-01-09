/**
 * Form Generator
 * Generates form components with validation
 */

export interface FormField {
  name: string
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file' | 'remote-select'
  label: string
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string | number, label: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
    custom?: string
  }
  remoteConfig?: {
    serviceName: string
    fetchMethod: string
    labelField: string
    valueField: string
  }
}

export interface FormGeneratorOptions {
  name: string
  fields: FormField[]
  layout?: 'single' | 'two-column' | 'custom'
  hasValidation?: boolean
  submitLabel?: string
  cancelLabel?: string
}

export function generateFormValidation(fields: FormField[]): string {
  const validationRules = fields
    .filter(f => f.required || f.validation)
    .map(field => {
      const rules: string[] = []
      
      if (field.required) {
        rules.push(`  ${field.name}: { required: true, message: '${field.label} is required' }`)
      }
      
      if (field.validation?.min !== undefined) {
        rules.push(`  ${field.name}Min: { min: ${field.validation.min}, message: '${field.label} must be at least ${field.validation.min}' }`)
      }
      
      if (field.validation?.max !== undefined) {
        rules.push(`  ${field.name}Max: { max: ${field.validation.max}, message: '${field.label} must be at most ${field.validation.max}' }`)
      }
      
      if (field.validation?.pattern) {
        rules.push(`  ${field.name}Pattern: { pattern: ${field.validation.pattern}, message: '${field.label} format is invalid' }`)
      }
      
      return rules.join(',\n')
    })
    .filter(Boolean)

  return validationRules.length > 0 
    ? `const validationRules = {
${validationRules.join(',\n')}
}

const errors = ref<Record<string, string>>({})

function validate(): boolean {
  errors.value = {}
  let isValid = true
  
${fields.filter(f => f.required).map(f => `  if (!form.value.${f.name}) {
    errors.value.${f.name} = '${f.label} is required'
    isValid = false
  }`).join('\n')}
  
  return isValid
}
`
    : ''
}

export function generateFormField(field: FormField): string {
  const colSpan = field.type === 'textarea' ? 'md:col-span-2' : ''
  const errorBinding = `:class="errors.${field.name} ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'"`
  const errorDisplay = `<p v-if="errors.${field.name}" class="text-xs text-red-500 mt-1">{{ errors.${field.name} }}</p>`

  if (field.type === 'select') {
    return `                  <div${colSpan ? ` class="${colSpan}"` : ''}>
                    <label class="block text-xs font-medium text-gray-600 mb-1">
                      ${field.label}${field.required ? ' <span class="text-red-500">*</span>' : ''}
                    </label>
                    <select v-model="form.${field.name}"
                      class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      ${errorBinding}>
                      <option value="">${field.placeholder || `Select ${field.label}`}</option>
${field.options?.map(opt => `                      <option value="${opt.value}">${opt.label}</option>`).join('\n') || ''}
                    </select>
                    ${errorDisplay}
                  </div>`
  } else if (field.type === 'textarea') {
    return `                  <div class="${colSpan}">
                    <label class="block text-xs font-medium text-gray-600 mb-1">
                      ${field.label}${field.required ? ' <span class="text-red-500">*</span>' : ''}
                    </label>
                    <textarea v-model="form.${field.name}" rows="4"
                      class="w-full px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      ${errorBinding}
                      placeholder="${field.placeholder || `Enter ${field.label.toLowerCase()}`}" />
                    ${errorDisplay}
                  </div>`
  } else if (field.type === 'checkbox') {
    return `                  <div${colSpan ? ` class="${colSpan}"` : ''}>
                    <label class="flex items-center gap-2">
                      <input v-model="form.${field.name}" type="checkbox"
                        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500">
                      <span class="text-sm text-gray-700">${field.label}</span>
                    </label>
                  </div>`
  } else if (field.type === 'remote-select' && field.remoteConfig) {
    return `                  <div${colSpan ? ` class="${colSpan}"` : ''}>
                    <label class="block text-xs font-medium text-gray-600 mb-1">
                      ${field.label}${field.required ? ' <span class="text-red-500">*</span>' : ''}
                    </label>
                    <RemoteSearchSelect
                      v-model="selected${field.name.charAt(0).toUpperCase() + field.name.slice(1)}"
                      :fetch-fn="${field.remoteConfig.fetchMethod}"
                      placeholder="${field.placeholder || `Select ${field.label}`}"
                      label-field="${field.remoteConfig.labelField}"
                      clearable
                      searchable
                      :full-width="true"
                      @select="onSelect${field.name.charAt(0).toUpperCase() + field.name.slice(1)}"
                      @clear="onClear${field.name.charAt(0).toUpperCase() + field.name.slice(1)}"
                    />
                    ${errorDisplay}
                  </div>`
  } else {
    return `                  <div${colSpan ? ` class="${colSpan}"` : ''}>
                    <label class="block text-xs font-medium text-gray-600 mb-1">
                      ${field.label}${field.required ? ' <span class="text-red-500">*</span>' : ''}
                    </label>
                    <input v-model="form.${field.name}" type="${field.type}"
                      class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      ${errorBinding}
                      placeholder="${field.placeholder || `Enter ${field.label.toLowerCase()}`}">
                    ${errorDisplay}
                  </div>`
  }
}

export function generateForm(options: FormGeneratorOptions): string {
  const { name, fields, layout = 'two-column', hasValidation = true, submitLabel = 'Submit', cancelLabel = 'Cancel' } = options

  const formFields = fields.map(f => `  ${f.name}: ${f.type === 'number' ? '0' : f.type === 'checkbox' ? 'false' : "''"},`).join('\n')
  const validation = hasValidation ? generateFormValidation(fields) : ''
  const gridClass = layout === 'two-column' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'

  const remoteSelectImports = fields
    .filter(f => f.type === 'remote-select' && f.remoteConfig)
    .map(f => `import { ${f.remoteConfig!.serviceName} } from '@/services/${f.remoteConfig!.serviceName}.service'`)
    .join('\n')

  const remoteSelectRefs = fields
    .filter(f => f.type === 'remote-select')
    .map(f => {
      const capitalizedName = f.name.charAt(0).toUpperCase() + f.name.slice(1)
      return `const selected${capitalizedName} = ref<any>(null)

async function ${f.remoteConfig!.fetchMethod}(search: string) {
  try {
    const res = await ${f.remoteConfig!.serviceName}.getList({ search: { name: search } })
    return res.data?.data || []
  } catch {
    return []
  }
}

function onSelect${capitalizedName}(item: any) {
  selected${capitalizedName}.value = item
  form.value.${f.name} = item.${f.remoteConfig!.valueField}
}

function onClear${capitalizedName}() {
  selected${capitalizedName}.value = null
  form.value.${f.name} = ''
}
`
    }).join('\n')

  return `<script setup lang="ts">
import { ref } from 'vue'
${remoteSelectImports ? remoteSelectImports + '\n' : ''}
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
${formFields}
})

${validation}
${remoteSelectRefs}

const submitting = ref(false)

async function handleSubmit() {
  ${hasValidation ? 'if (!validate()) return\n  ' : ''}submitting.value = true
  try {
    emit('submit', form.value)
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="${name.toLowerCase()}-form">
    <div class="${gridClass}">
${fields.map(f => generateFormField(f)).join('\n\n')}
    </div>

    <div class="flex justify-end gap-2 mt-6">
      <button type="button"
        class="px-6 h-10 rounded-md font-semibold text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        @click="handleCancel">
        ${cancelLabel}
      </button>
      <button type="button"
        class="px-6 h-10 rounded-md font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition shadow bg-primary-600 text-white hover:bg-primary-700"
        :disabled="submitting"
        @click="handleSubmit">
        <span v-if="!submitting">${submitLabel}</span>
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
}

export function generateFormFile(options: FormGeneratorOptions): { path: string, content: string } {
  return {
    path: `app/components/${options.name}Form.vue`,
    content: generateForm(options)
  }
}
