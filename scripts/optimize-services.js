/**
 * Auto-optimize all services
 * Converts .get() to .getCached() for read methods
 */

const fs = require('fs')
const path = require('path')

const SERVICES_DIR = path.join(__dirname, '../app/services')
const CACHE_TTL = {
  fast: '1 * 60 * 1000',      // 1 minute
  medium: '5 * 60 * 1000',    // 5 minutes (default)
  slow: '15 * 60 * 1000'      // 15 minutes
}

// Methods that should use fast cache
const FAST_CACHE_METHODS = ['getProfile', 'getStats', 'getOverview']

// Methods that should use slow cache
const SLOW_CACHE_METHODS = ['getMenu', 'getWidgetZones', 'getCategories']

function shouldOptimize(methodName) {
  // Skip if already using getCached
  if (methodName.includes('getCached')) return false
  
  // Optimize read methods
  const readPrefixes = ['get', 'fetch', 'list', 'find', 'search', 'load']
  return readPrefixes.some(prefix => methodName.startsWith(prefix))
}

function getCacheTTL(methodName) {
  if (FAST_CACHE_METHODS.includes(methodName)) return CACHE_TTL.fast
  if (SLOW_CACHE_METHODS.includes(methodName)) return CACHE_TTL.slow
  return CACHE_TTL.medium
}

function optimizeService(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false
  
  // Find all async get() calls
  const getPattern = /async\s+(\w+)\s*\([^)]*\)\s*\{[^}]*return\s+this\.get<([^>]+)>\(([^)]+)\)/g
  
  content = content.replace(getPattern, (match, methodName, typeParam, args) => {
    if (!shouldOptimize(methodName)) return match
    
    const ttl = getCacheTTL(methodName)
    modified = true
    
    console.log(`  ✓ Optimized ${methodName}() with ${ttl}ms cache`)
    
    // Convert to getCached
    return match.replace(
      `return this.get<${typeParam}>(${args})`,
      `return this.getCached<${typeParam}>(${args}, {}, ${ttl}) // Auto-optimized`
    )
  })
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8')
    return true
  }
  
  return false
}

function main() {
  console.log('🚀 Auto-optimizing services...\n')
  
  const files = fs.readdirSync(SERVICES_DIR)
    .filter(f => f.endsWith('.service.ts') && f !== 'base.service.ts')
  
  let optimizedCount = 0
  
  for (const file of files) {
    const filePath = path.join(SERVICES_DIR, file)
    const serviceName = file.replace('.service.ts', '')
    
    console.log(`📦 ${serviceName}:`)
    
    if (optimizeService(filePath)) {
      optimizedCount++
    } else {
      console.log(`  ℹ Already optimized or no read methods`)
    }
    
    console.log()
  }
  
  console.log(`\n✅ Optimized ${optimizedCount}/${files.length} services`)
}

main()
