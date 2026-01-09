/**
 * CRUD Generator
 * Generates complete CRUD functionality (service + pages + components)
 */

import { generateServiceFile, type ServiceGeneratorOptions } from './service-generator'
import { generatePageFiles, type PageGeneratorOptions } from './page-generator'
import { generateComponentFile, type ComponentGeneratorOptions } from './component-generator'

export interface CRUDGeneratorOptions {
  name: string
  entityName: string
  displayName: string
  fields: Array<{
    name: string
    type: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'checkbox' | 'relation'
    label: string
    required?: boolean
    options?: string[]
    relationService?: string
  }>
  hasCache?: boolean
  hasModal?: boolean
  customMethods?: Array<{
    name: string
    method: 'get' | 'post' | 'put' | 'delete'
    hasParams?: boolean
  }>
}

export function generateCRUD(options: CRUDGeneratorOptions) {
  const files: Array<{ path: string, content: string }> = []

  const serviceOptions: ServiceGeneratorOptions = {
    name: options.name,
    entityName: options.entityName,
    hasCache: options.hasCache,
    hasCRUD: true,
    customMethods: options.customMethods
  }
  files.push(generateServiceFile(serviceOptions))

  const pageOptions: PageGeneratorOptions = {
    name: options.name,
    entityName: options.entityName,
    hasGrid: true,
    hasCreate: true,
    hasEdit: true,
    hasDetail: true,
    fields: options.fields.filter(f => f.type !== 'relation')
  }
  files.push(...generatePageFiles(pageOptions))

  const formComponentOptions: ComponentGeneratorOptions = {
    name: `${options.entityName}Form`,
    type: 'form',
    props: [
      { name: 'modelValue', type: 'any', required: false },
      { name: 'mode', type: "'create' | 'edit'", required: false, default: 'create' }
    ],
    emits: ['submit', 'cancel'],
    hasSlots: true
  }
  files.push(generateComponentFile(formComponentOptions))

  if (options.hasModal) {
    const modalComponentOptions: ComponentGeneratorOptions = {
      name: `Add${options.entityName}Modal`,
      type: 'modal',
      props: [],
      emits: ['created'],
      hasSlots: false
    }
    files.push(generateComponentFile(modalComponentOptions))
  }

  return files
}

export function generateAPIEndpoints(options: CRUDGeneratorOptions): string {
  const upperName = options.name.toUpperCase()
  
  return `  // ${options.displayName} endpoints
  ${upperName}_GRID: '/api/v1/${options.entityName}/grid',
  ${upperName}_BY_ID: (id: string | number) => \`/api/v1/${options.entityName}/\${id}\`,
  ${upperName}_CREATE: '/api/v1/${options.entityName}',
  ${upperName}_UPDATE: (id: string | number) => \`/api/v1/${options.entityName}/\${id}\`,
  ${upperName}_DELETE: (id: string | number) => \`/api/v1/${options.entityName}/\${id}\`,
${options.customMethods?.map(m => `  ${upperName}_${m.name.toUpperCase()}: ${m.hasParams ? `(id: string | number) => \`/api/v1/${options.entityName}/\${id}/${m.name}\`` : `'/api/v1/${options.entityName}/${m.name}'`},`).join('\n') || ''}`
}
