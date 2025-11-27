#!/usr/bin/env node

const { checkDiff } = require('../src/index')

/**
 * Example: Check for file differences
 *
 * This example demonstrates how to use checkDiff to detect
 * file changes since a git reference.
 */

async function main() {
  console.log('=== Check Diff Example ===\n')

  // Example 1: Check for any changes since HEAD
  console.log('1. Check for any changes since HEAD:')
  const result1 = await checkDiff()
  console.log(`   ${result1.count} file(s) changed`)
  if (result1.count > 0) {
    console.log(`   Files: ${result1.files.join(', ')}`)
  }
  console.log()

  // Example 2: Check for changes since a specific ref
  console.log('2. Check for changes since master:')
  const result2 = await checkDiff({ since: 'master' })
  console.log(`   ${result2.count} file(s) changed`)
  console.log(`   Added: ${result2.added.length}`)
  console.log(`   Modified: ${result2.modified.length}`)
  console.log(`   Deleted: ${result2.deleted.length}`)
  console.log()

  // Example 3: Check for changes to specific files
  console.log('3. Check for changes to JavaScript files:')
  const result3 = await checkDiff({
    since: 'HEAD~5',
    filePath: '**/*.js'
  })
  console.log(`   ${result3.count} JavaScript file(s) changed`)
  if (result3.count > 0) {
    console.log(`   Files:`)
    result3.files.forEach(file => console.log(`     - ${file}`))
  }
  console.log()

  // Example 4: Check for only modified files
  console.log('4. Check for only modified files:')
  const result4 = await checkDiff({
    since: 'HEAD~10',
    fileStatus: 'modified'
  })
  console.log(`   ${result4.count} file(s) modified`)
  console.log()

  // Example 5: Complex filtering
  console.log('5. Check for modified or added source files:')
  const result5 = await checkDiff({
    since: 'master',
    filePath: 'src/**/*.js',
    fileStatus: ['modified', 'added']
  })
  console.log(`   ${result5.count} source file(s) changed`)
  console.log(`   Added: ${result5.added.length}`)
  console.log(`   Modified: ${result5.modified.length}`)
}

main().catch(error => {
  console.error('Error:', error.message)
  process.exit(1)
})
