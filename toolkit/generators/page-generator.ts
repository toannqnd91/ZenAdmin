/**
 * Page Generator
 * Generates CRUD pages following the project patterns
 */

export interface PageGeneratorOptions {
  name: string
  entityName: string
  hasGrid?: boolean
  hasCreate?: boolean
  hasEdit?: boolean
  hasDetail?: boolean
  fields?: Array<{
    name: string
    type: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'checkbox'
    label: string
    required?: boolean
    options?: string[]
  }>
}

export function generateIndexPage(options: PageGeneratorOptions): string {
  const { name, entityName } = options

  return `<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ${name}Service } from '@/services/${name}.service'
import type { ${entityName}Item } from '@/services/${name}.service'

const router = useRouter()

const items = ref<${entityName}Item[]>([])
const loading = ref(false)
const totalRecords = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')

const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize.value))

async function loadData() {
  loading.value = true
  try {
    const res = await ${name}Service.getList({
      pagination: {
        start: (currentPage.value - 1) * pageSize.value,
        number: pageSize.value
      },
      search: {
        name: searchQuery.value || null
      }
    })
    
    if (res.success && res.data) {
      items.value = res.data.data || []
      totalRecords.value = res.data.numberOfRecords || 0
    }
  } catch (e) {
    console.error('Failed to load ${name}:', e)
  } finally {
    loading.value = false
  }
}

function goToCreate() {
  router.push('/${name}/create')
}

function goToEdit(id: number) {
  router.push(\`/${name}/\${id}/edit\`)
}

function goToDetail(id: number) {
  router.push(\`/${name}/\${id}\`)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <UDashboardPanel id="${name}-list" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="text-lg font-semibold">
            ${entityName} Management
          </div>
        </template>
        <template #trailing>
          <UButton @click="goToCreate">
            Add New
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-screen-xl mx-auto px-6 py-6">
        <UPageCard variant="soft" class="bg-white rounded-lg">
          <div class="mb-4">
            <UInput
              v-model="searchQuery"
              placeholder="Search..."
              @input="loadData"
            />
          </div>

          <UTable
            :rows="items"
            :loading="loading"
            :columns="[
              { key: 'id', label: 'ID' },
              { key: 'name', label: 'Name' },
              { key: 'isActive', label: 'Status' },
              { key: 'actions', label: 'Actions' }
            ]"
          >
            <template #actions-data="{ row }">
              <div class="flex gap-2">
                <UButton size="xs" @click="goToDetail(row.id)">View</UButton>
                <UButton size="xs" variant="outline" @click="goToEdit(row.id)">Edit</UButton>
              </div>
            </template>
          </UTable>

          <div v-if="totalPages > 1" class="flex justify-center mt-4">
            <UPagination
              v-model="currentPage"
              :total="totalRecords"
              :page-size="pageSize"
              @update:model-value="loadData"
            />
          </div>
        </UPageCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
`
}

export function generateCreatePage(options: PageGeneratorOptions): string {
  const { name, entityName, fields = [] } = options

  const formFields = fields.map(f => `  ${f.name}: ${f.type === 'number' ? '0' : f.type === 'checkbox' ? 'false' : "''"},`).join('\n')
  
  const formInputs = fields.map(field => {
    const label = field.label
    const required = field.required ? '<span class="text-red-500">*</span>' : ''
    
    if (field.type === 'select' && field.options) {
      return `                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">
                      ${label} ${required}
                    </label>
                    <select v-model="form.${field.name}"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Select ${label}</option>
${field.options.map(opt => `                      <option value="${opt}">${opt}</option>`).join('\n')}
                    </select>
                  </div>`
    } else if (field.type === 'textarea') {
      return `                  <div class="md:col-span-2">
                    <label class="block text-xs font-medium text-gray-600 mb-1">
                      ${label} ${required}
                    </label>
                    <textarea v-model="form.${field.name}" rows="4"
                      class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      placeholder="Enter ${label.toLowerCase()}" />
                  </div>`
    } else if (field.type === 'checkbox') {
      return `                  <div>
                    <label class="flex items-center gap-2">
                      <input v-model="form.${field.name}" type="checkbox"
                        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500">
                      <span class="text-sm text-gray-700">${label}</span>
                    </label>
                  </div>`
    } else {
      return `                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">
                      ${label} ${required}
                    </label>
                    <input v-model="form.${field.name}" type="${field.type}"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter ${label.toLowerCase()}">
                  </div>`
    }
  }).join('\n\n')

  return `<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ${name}Service } from '@/services/${name}.service'

const router = useRouter()

const form = ref({
${formFields}
})

const submitting = ref(false)

async function onSubmit() {
  submitting.value = true
  try {
    await ${name}Service.create(form.value)
    router.push('/${name}')
  } catch (e) {
    console.error('Create failed:', e)
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.back()
}
</script>

<template>
  <UDashboardPanel id="${name}-create" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <button
              class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              @click="goBack">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div class="text-lg font-semibold">
              Create New ${entityName}
            </div>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-screen-xl mx-auto px-6 py-6">
        <UPageCard variant="soft" class="bg-white rounded-lg">
          <div class="-mx-6 px-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
${formInputs}
            </div>
          </div>
        </UPageCard>

        <div class="flex justify-end mt-8 mb-4">
          <button type="button"
            class="px-6 h-10 rounded-md font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition shadow sm bg-primary-600 text-white hover:bg-primary-700"
            :disabled="submitting" @click="onSubmit">
            <span v-if="!submitting">Create</span>
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
  </UDashboardPanel>
</template>
`
}

export function generatePageFiles(options: PageGeneratorOptions): Array<{ path: string, content: string }> {
  const files: Array<{ path: string, content: string }> = []

  if (options.hasGrid !== false) {
    files.push({
      path: `app/pages/${options.name}/index.vue`,
      content: generateIndexPage(options)
    })
  }

  if (options.hasCreate !== false) {
    files.push({
      path: `app/pages/${options.name}/create.vue`,
      content: generateCreatePage(options)
    })
  }

  return files
}
