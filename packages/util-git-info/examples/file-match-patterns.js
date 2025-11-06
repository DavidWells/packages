const { gitDetails } = require('../src')

async function demonstrateFileMatchPatterns() {
  let gitInfo
  try {
    gitInfo = await gitDetails({
      base: 'master'
    })
  } catch (err) {
    console.log('Error getting git info')
    console.log(err)
    return
  }

  console.log('🎯 File Matching Pattern Examples\n')
  console.log('═══════════════════════════════════════\n')

  // Example 1: Simple extension matching
  console.log('1️⃣  Match all JavaScript files:\n')
  const jsFiles = gitInfo.fileMatch('**/*.js')
  console.log(`   Pattern: '**/*.js'`)
  console.log(`   Matches: ${jsFiles.editedFiles.length} files`)
  if (jsFiles.edited) {
    console.log('   Files:', jsFiles.editedFiles.slice(0, 3).join(', '))
    if (jsFiles.editedFiles.length > 3) {
      console.log(`   ... and ${jsFiles.editedFiles.length - 3} more`)
    }
  }
  console.log()

  // Example 2: Multiple patterns with array
  console.log('2️⃣  Match multiple extensions:\n')
  const codeFiles = gitInfo.fileMatch(['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'])
  console.log(`   Pattern: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx']`)
  console.log(`   Matches: ${codeFiles.editedFiles.length} files`)
  console.log()

  // Example 3: Using negation patterns
  console.log('3️⃣  Match with exclusions:\n')
  const srcFiles = gitInfo.fileMatch('src/**/*.js', ['!**/*.test.js', '!**/*.spec.js'])
  console.log(`   Pattern: 'src/**/*.js', excluding tests`)
  console.log(`   Matches: ${srcFiles.editedFiles.length} files`)
  console.log()

  // Example 4: Specific directory matching
  console.log('4️⃣  Match files in specific directory:\n')
  const exampleFiles = gitInfo.fileMatch('examples/**/*')
  console.log(`   Pattern: 'examples/**/*'`)
  console.log(`   Matches: ${exampleFiles.editedFiles.length} files`)
  console.log()

  // Example 5: Configuration files
  console.log('5️⃣  Match configuration files:\n')
  const configs = gitInfo.fileMatch([
    '**/.eslintrc*',
    '**/.prettierrc*',
    '**/tsconfig.json',
    '**/package.json'
  ])
  console.log(`   Pattern: Various config file patterns`)
  console.log(`   Matches: ${configs.editedFiles.length} files`)
  console.log()

  // Example 6: Using getKeyedPaths()
  console.log('6️⃣  Get categorized paths:\n')
  const categorized = jsFiles.getKeyedPaths()
  console.log(`   Returns object with categorized file paths:`)
  console.log(`   - modified: ${categorized.modified.length} files`)
  console.log(`   - created: ${categorized.created.length} files`)
  console.log(`   - deleted: ${categorized.deleted.length} files`)
  console.log(`   - edited: ${categorized.edited.length} files (modified + created)`)
  console.log()

  // Example 7: Boolean checks
  console.log('7️⃣  Boolean checks for workflow:\n')
  const tests = gitInfo.fileMatch('**/*.test.js')
  console.log(`   Pattern: '**/*.test.js'`)
  console.log(`   .edited (modified or created): ${tests.edited}`)
  console.log(`   .modified: ${tests.modified}`)
  console.log(`   .created: ${tests.created}`)
  console.log(`   .deleted: ${tests.deleted}`)
  console.log()

  // Example 8: Complex negation pattern
  console.log('8️⃣  Complex exclusion pattern:\n')
  const jsonNoPackage = gitInfo.fileMatch('**/*.json', '!**/package*.json')
  console.log(`   Pattern: All JSON except package.json files`)
  console.log(`   Matches: ${jsonNoPackage.editedFiles.length} files`)
  console.log()

  console.log('═══════════════════════════════════════')
  console.log('\n💡 Tips:\n')
  console.log('   • Use ** for recursive directory matching')
  console.log('   • Use * for single path segment matching')
  console.log('   • Use ! prefix for negation/exclusion')
  console.log('   • Patterns can be string or array of strings')
  console.log('   • .edited combines .modified and .created')
  console.log('   • .editedFiles combines modifiedFiles and createdFiles')
}

demonstrateFileMatchPatterns()
