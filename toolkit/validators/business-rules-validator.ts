/**
 * Business Rules Validator
 * Ensures domain isolation and microservices principles
 */

export interface ServiceBoundary {
  name: string
  domain: string
  allowedDependencies: string[]
  forbiddenPatterns: string[]
}

export interface BusinessRule {
  name: string
  description: string
  validate: (context: any) => boolean | Promise<boolean>
  errorMessage: string
}

export class BusinessRulesValidator {
  private rules: Map<string, BusinessRule> = new Map()

  addRule(rule: BusinessRule): this {
    this.rules.set(rule.name, rule)
    return this
  }

  removeRule(name: string): this {
    this.rules.delete(name)
    return this
  }

  async validate(context: any): Promise<{ valid: boolean, errors: string[] }> {
    const errors: string[] = []

    for (const [name, rule] of this.rules.entries()) {
      try {
        const result = await rule.validate(context)
        if (!result) {
          errors.push(`[${name}] ${rule.errorMessage}`)
        }
      } catch (error) {
        errors.push(`[${name}] Validation failed: ${error}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  async validateRule(name: string, context: any): Promise<boolean> {
    const rule = this.rules.get(name)
    if (!rule) {
      throw new Error(`Rule "${name}" not found`)
    }

    return await rule.validate(context)
  }
}

export const microservicesRules = {
  noCrossServiceDatabaseAccess: {
    name: 'no-cross-service-db-access',
    description: 'Services must not access other services databases directly',
    validate: (context: { imports: string[], serviceName: string }) => {
      const forbiddenPatterns = [
        /import.*from.*['"].*\/services\/(?!base\.service|${context.serviceName}\.service)/,
        /import.*from.*['"].*models\/(?!${context.serviceName})/
      ]
      
      return !context.imports.some(imp => 
        forbiddenPatterns.some(pattern => pattern.test(imp))
      )
    },
    errorMessage: 'Service is accessing another service\'s database or models directly. Use APIs or events instead.'
  },

  useOutboxPattern: {
    name: 'use-outbox-pattern',
    description: 'Services must use Outbox pattern for reliable event publishing',
    validate: (context: { hasEventEmission: boolean, hasOutboxImplementation: boolean }) => {
      if (context.hasEventEmission) {
        return context.hasOutboxImplementation
      }
      return true
    },
    errorMessage: 'Service emits events but does not implement Outbox pattern for reliability.'
  },

  domainBoundaryRespect: {
    name: 'domain-boundary-respect',
    description: 'Services must respect domain boundaries',
    validate: (context: { serviceName: string, accessedDomains: string[], allowedDomains: string[] }) => {
      return context.accessedDomains.every(domain => 
        context.allowedDomains.includes(domain) || domain === context.serviceName
      )
    },
    errorMessage: 'Service is accessing domains outside its bounded context.'
  },

  noTightCoupling: {
    name: 'no-tight-coupling',
    description: 'Services must be loosely coupled',
    validate: (context: { directServiceCalls: number, eventBasedCalls: number }) => {
      const totalCalls = context.directServiceCalls + context.eventBasedCalls
      if (totalCalls === 0) return true
      
      const directCallRatio = context.directServiceCalls / totalCalls
      return directCallRatio <= 0.3
    },
    errorMessage: 'Service has too many direct service calls. Consider using events for better decoupling.'
  },

  apiVersioning: {
    name: 'api-versioning',
    description: 'APIs must be versioned',
    validate: (context: { apiEndpoints: string[] }) => {
      return context.apiEndpoints.every(endpoint => 
        /\/api\/v\d+\//.test(endpoint)
      )
    },
    errorMessage: 'API endpoints must include version number (e.g., /api/v1/).'
  },

  noCircularDependencies: {
    name: 'no-circular-dependencies',
    description: 'Services must not have circular dependencies',
    validate: (context: { serviceName: string, dependencies: string[], dependencyGraph: Map<string, string[]> }) => {
      const visited = new Set<string>()
      const recursionStack = new Set<string>()
      
      function hasCycle(service: string): boolean {
        if (recursionStack.has(service)) return true
        if (visited.has(service)) return false
        
        visited.add(service)
        recursionStack.add(service)
        
        const deps = context.dependencyGraph.get(service) || []
        for (const dep of deps) {
          if (hasCycle(dep)) return true
        }
        
        recursionStack.delete(service)
        return false
      }
      
      return !hasCycle(context.serviceName)
    },
    errorMessage: 'Circular dependency detected between services.'
  }
}

export function createMicroservicesValidator(): BusinessRulesValidator {
  const validator = new BusinessRulesValidator()
  
  Object.values(microservicesRules).forEach(rule => {
    validator.addRule(rule)
  })
  
  return validator
}

export function validateServiceBoundary(
  serviceName: string,
  sourceCode: string,
  boundary: ServiceBoundary
): { valid: boolean, violations: string[] } {
  const violations: string[] = []

  const importRegex = /import\s+.*\s+from\s+['"](.+)['"]/g
  const imports: string[] = []
  let match

  while ((match = importRegex.exec(sourceCode)) !== null) {
    imports.push(match[1])
  }

  imports.forEach(importPath => {
    const isAllowed = boundary.allowedDependencies.some(dep => 
      importPath.includes(dep)
    )
    
    const isForbidden = boundary.forbiddenPatterns.some(pattern => 
      new RegExp(pattern).test(importPath)
    )
    
    if (isForbidden) {
      violations.push(`Forbidden import detected: ${importPath}`)
    }
    
    if (!isAllowed && !importPath.startsWith('.') && !importPath.startsWith('@/')) {
      const isExternalPackage = !importPath.includes('/services/') && 
                                !importPath.includes('/models/')
      
      if (!isExternalPackage) {
        violations.push(`Unauthorized cross-service import: ${importPath}`)
      }
    }
  })

  return {
    valid: violations.length === 0,
    violations
  }
}
