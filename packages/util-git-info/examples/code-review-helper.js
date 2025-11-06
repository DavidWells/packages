const { gitDetails } = require('../src')

async function codeReviewHelper() {
  let gitInfo
  try {
    gitInfo = await gitDetails({
      base: 'main'
    })
  } catch (err) {
    console.log('Error getting git info')
    console.log(err)
    return
  }

  console.log('🔍 Code Review Checklist\n')
  console.log('═══════════════════════════════════════\n')

  const warnings = []
  const suggestions = []

  // Check if source code changed but tests didn't
  const sourceCode = gitInfo.fileMatch(['src/**/*.js', 'src/**/*.ts'], ['**/*.test.js', '**/*.test.ts', '**/*.spec.js', '**/*.spec.ts'])
  const testFiles = gitInfo.fileMatch(['**/*.test.js', '**/*.test.ts', '**/*.spec.js', '**/*.spec.ts'])

  if (sourceCode.edited && !testFiles.edited) {
    warnings.push('⚠️  Source code changed but no test files modified')
    suggestions.push('Consider adding or updating tests for the changes')
  }

  // Check if code changed but docs didn't
  const codeFiles = gitInfo.fileMatch(['**/*.js', '**/*.ts'], ['**/*.md', '**/README.md'])
  const docFiles = gitInfo.fileMatch(['**/*.md', '**/README.md'])

  if (codeFiles.edited && !docFiles.edited) {
    warnings.push('📝 Code changed but documentation not updated')
    suggestions.push('Review if README or other docs need updates')
  }

  // Check for package.json changes without lock file changes
  const packageJson = gitInfo.fileMatch('**/package.json')
  const lockFiles = gitInfo.fileMatch(['**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml'])

  if (packageJson.edited && !lockFiles.edited) {
    warnings.push('📦 package.json changed but lock file not updated')
    suggestions.push('Run npm install to update package-lock.json')
  }

  // Check for large number of files changed
  const totalFilesChanged = gitInfo.modifiedFiles.length + gitInfo.createdFiles.length + gitInfo.deletedFiles.length
  if (totalFilesChanged > 50) {
    warnings.push(`📊 Large changeset: ${totalFilesChanged} files changed`)
    suggestions.push('Consider breaking this into smaller pull requests')
  }

  // Check for deleted files without corresponding test deletions
  if (gitInfo.deletedFiles.length > 0) {
    const deletedCode = gitInfo.deletedFiles.filter(f => /\.(js|ts)$/.test(f) && !f.includes('.test.') && !f.includes('.spec.'))
    if (deletedCode.length > 0) {
      console.log('🗑️  Deleted files:')
      deletedCode.forEach(file => console.log(`   - ${file}`))
      suggestions.push('Verify associated tests are also removed or updated')
      console.log()
    }
  }

  // Check for API/interface changes
  const apiFiles = gitInfo.fileMatch(['**/api/**/*.js', '**/api/**/*.ts', '**/types.ts', '**/types.js', '**/*.d.ts'])
  if (apiFiles.edited) {
    warnings.push('🔌 API or type definition files changed')
    suggestions.push('Ensure backward compatibility or version bump')
  }

  // Print warnings
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n')
    warnings.forEach(warning => {
      console.log(`   ${warning}`)
    })
    console.log()
  }

  // Print suggestions
  if (suggestions.length > 0) {
    console.log('💡 Suggestions:\n')
    suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion}`)
    })
    console.log()
  }

  // Summary
  console.log('═══════════════════════════════════════')
  console.log('\n📊 Change Summary:\n')
  console.log(`   Modified: ${gitInfo.modifiedFiles.length} files`)
  console.log(`   Created: ${gitInfo.createdFiles.length} files`)
  console.log(`   Deleted: ${gitInfo.deletedFiles.length} files`)
  console.log(`   Commits: ${gitInfo.commits.length}`)

  const totalLines = await gitInfo.linesOfCode()
  console.log(`   Lines changed: ${totalLines}`)

  if (warnings.length === 0) {
    console.log('\n✅ All checks passed!')
  }
}

codeReviewHelper()
