/**
 * Code Cleanup Script
 * Remove console.log, fix any types, clean up code
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const APP_DIR = path.join(__dirname, '../app')
const stats = {
  filesScanned: 0,
  consolesRemoved: 0,
  debuggersRemoved: 0,
  todosFound: 0,
  anyTypesFound: 0
}

// Files to skip
const SKIP_FILES = [
  'logger.ts',
  'smart-logger.ts',
  'error-tracker.ts',
  'error-tracker-sentry.ts'
]

function shouldSkip(filePath) {
  return SKIP_FILES.some(skip => filePath.includes(skip))
}

function cleanFile(filePath) {
  if (shouldSkip(filePath)) {
    return false
  }

  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  // Remove console.log (but keep console.error, console.warn in dev)
  const consoleLogPattern = /console\.log\([^)]*\)\s*;?\s*\n?/g
  const consoleMatches = content.match(consoleLogPattern)
  if (consoleMatches) {
    content = content.replace(consoleLogPattern, '')
    stats.consolesRemoved += consoleMatches.length
    modified = true
  }

  // Remove debugger statements
  const debuggerPattern = /debugger\s*;?\s*\n?/g
  const debuggerMatches = content.match(debuggerPattern)
  if (debuggerMatches) {
    content = content.replace(debuggerPattern, '')
    stats.debuggersRemoved += debuggerMatches.length
    modified = true
  }

  // Find TODOs (don't remove, just count)
  const todoPattern = /\/\/\s*TODO|\/\/\s*FIXME/gi
  const todoMatches = content.match(todoPattern)
  if (todoMatches) {
    stats.todosFound += todoMatches.length
  }

  // Find any types (don't remove, just count)
  const anyPattern = /:\s*any\b/g
  const anyMatches = content.match(anyPattern)
  if (anyMatches) {
    stats.anyTypesFound += anyMatches.length
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8')
    return true
  }

  return false
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Skip node_modules, .nuxt, dist
      if (!['node_modules', '.nuxt', 'dist', '.git'].includes(file)) {
        scanDirectory(filePath)
      }
    } else if (file.endsWith('.ts') || file.endsWith('.vue')) {
      stats.filesScanned++
      const cleaned = cleanFile(filePath)
      if (cleaned) {
        console.log(`  ✓ Cleaned: ${path.relative(APP_DIR, filePath)}`)
      }
    }
  }
}

function main() {
  console.log('🧹 Cleaning up code...\n')
  
  scanDirectory(APP_DIR)
  
  console.log('\n📊 Cleanup Summary:')
  console.log(`  Files scanned: ${stats.filesScanned}`)
  console.log(`  console.log removed: ${stats.consolesRemoved}`)
  console.log(`  debugger removed: ${stats.debuggersRemoved}`)
  console.log(`  TODOs found: ${stats.todosFound}`)
  console.log(`  any types found: ${stats.anyTypesFound}`)
  
  if (stats.todosFound > 0) {
    console.log('\n⚠️  Please review and fix TODOs')
  }
  
  if (stats.anyTypesFound > 0) {
    console.log('⚠️  Please replace any types with proper types')
  }
  
  console.log('\n✅ Cleanup complete!')
}

main()
