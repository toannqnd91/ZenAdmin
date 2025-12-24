/**
 * Script to clean up console.log statements from production code
 * Usage: node scripts/cleanup-console-logs.js [--dry-run]
 */

const fs = require('fs')
const path = require('path')

// Configuration
const TARGET_DIRS = ['app']
const EXCLUDE_DIRS = ['node_modules', '.nuxt', '.output', 'dist']
const EXCLUDE_FILES = ['smart-logger.ts', 'logger.ts'] // Files that should keep console.log
const FILE_EXTENSIONS = ['.ts', '.vue', '.js']

// Stats
let filesScanned = 0
let filesModified = 0
let consoleLogsRemoved = 0
let consoleLogsKept = 0

// Command line args
const isDryRun = process.argv.includes('--dry-run')

/**
 * Check if path should be excluded
 */
function shouldExclude(filePath) {
    const relativePath = path.relative(process.cwd(), filePath)

    // Exclude directories
    for (const dir of EXCLUDE_DIRS) {
        if (relativePath.includes(dir)) return true
    }

    // Exclude specific files
    const fileName = path.basename(filePath)
    if (EXCLUDE_FILES.includes(fileName)) {
        return true
    }

    return false
}

/**
 * Check if file has target extension
 */
function hasTargetExtension(filePath) {
    const ext = path.extname(filePath)
    return FILE_EXTENSIONS.includes(ext)
}

/**
 * Process a single file
 */
function processFile(filePath) {
    filesScanned++

    try {
        const content = fs.readFileSync(filePath, 'utf8')
        const lines = content.split('\n')
        const newLines = []
        let modified = false
        let removedCount = 0

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const trimmed = line.trim()

            // Check if line contains console.log
            // But keep lines that are:
            // 1. Comments about console.log
            // 2. String literals containing "console.log"
            // 3. Part of logger implementation

            const isComment = trimmed.startsWith('//') || trimmed.startsWith('*')
            const isStringLiteral = /['"`].*console\.log.*['"`]/.test(line)

            if (!isComment && !isStringLiteral && /console\.log\s*\(/.test(line)) {
                // This is an actual console.log statement
                console.log(`  Found: ${filePath}:${i + 1}`)
                console.log(`    ${trimmed}`)

                removedCount++
                modified = true
                // Skip this line (remove it)
                continue
            }

            newLines.push(line)
        }

        if (modified) {
            filesModified++
            consoleLogsRemoved += removedCount

            if (!isDryRun) {
                // Write back to file
                fs.writeFileSync(filePath, newLines.join('\n'), 'utf8')
                console.log(`  ✓ Cleaned: ${filePath} (removed ${removedCount} console.log)`)
            } else {
                console.log(`  [DRY RUN] Would clean: ${filePath} (${removedCount} console.log)`)
            }
        }
    } catch (error) {
        console.error(`  ✗ Error processing ${filePath}:`, error.message)
    }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dirPath) {
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true })

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name)

            if (shouldExclude(fullPath)) {
                continue
            }

            if (entry.isDirectory()) {
                scanDirectory(fullPath)
            } else if (entry.isFile() && hasTargetExtension(fullPath)) {
                processFile(fullPath)
            }
        }
    } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error.message)
    }
}

/**
 * Main function
 */
function main() {
    console.log('🧹 Cleaning up console.log statements...\n')

    if (isDryRun) {
        console.log('⚠️  DRY RUN MODE - No files will be modified\n')
    }

    const startTime = Date.now()

    // Scan target directories
    for (const dir of TARGET_DIRS) {
        const dirPath = path.join(process.cwd(), dir)
        if (fs.existsSync(dirPath)) {
            console.log(`Scanning: ${dir}/`)
            scanDirectory(dirPath)
        } else {
            console.warn(`Warning: Directory not found: ${dir}`)
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    // Print summary
    console.log('\n📊 Cleanup Summary:')
    console.log(`  Files scanned: ${filesScanned}`)
    console.log(`  Files modified: ${filesModified}`)
    console.log(`  console.log removed: ${consoleLogsRemoved}`)
    console.log(`  Duration: ${duration}s`)

    if (isDryRun) {
        console.log('\n⚠️  This was a DRY RUN. Run without --dry-run to apply changes.')
    } else {
        console.log('\n✅ Cleanup complete!')
    }

    // Exit with error code if issues found
    if (consoleLogsRemoved > 0 && isDryRun) {
        process.exit(1)
    }
}

// Run
main()
