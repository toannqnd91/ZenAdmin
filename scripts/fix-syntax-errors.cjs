/**
 * Script to fix syntax errors caused by console.log cleanup
 * Finds and fixes missing object declarations after TODO comments
 */

const fs = require('fs')
const path = require('path')

const TARGET_DIRS = ['app/pages/cash-flow']
const FILE_EXTENSIONS = ['.vue']

let filesFixed = 0

function fixFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8')

        // Pattern: TODO comment followed by object properties without declaration
        // Example:
        //   // TODO: ...
        //   propertyName: value,
        const pattern = /(\/\/\s*TODO:[^\n]*\n)(\s+)([a-zA-Z_$][a-zA-Z0-9_$]*:\s*)/

        if (pattern.test(content)) {
            console.log(`\nFixing: ${filePath}`)

            // Add const declaration
            const fixed = content.replace(
                pattern,
                '$1$2const data = {\n$2$3'
            )

            // Also fix the closing }) to just }
            const finalFixed = fixed.replace(/\n(\s+)\}\)\n(\s+)\/\/ After/, '\n$1}\n$2\n$2// After')

            fs.writeFileSync(filePath, finalFixed, 'utf8')
            filesFixed++
            console.log(`✓ Fixed`)
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message)
    }
}

function scanDirectory(dirPath) {
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true })

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name)

            if (entry.isDirectory()) {
                scanDirectory(fullPath)
            } else if (entry.isFile() && FILE_EXTENSIONS.includes(path.extname(fullPath))) {
                fixFile(fullPath)
            }
        }
    } catch (error) {
        console.error(`Error scanning ${dirPath}:`, error.message)
    }
}

function main() {
    console.log('🔧 Fixing syntax errors from cleanup...\n')

    for (const dir of TARGET_DIRS) {
        const dirPath = path.join(process.cwd(), dir)
        if (fs.existsSync(dirPath)) {
            console.log(`Scanning: ${dir}/`)
            scanDirectory(dirPath)
        }
    }

    console.log(`\n✅ Fixed ${filesFixed} files`)
}

main()
