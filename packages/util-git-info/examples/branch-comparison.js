const { gitDetails } = require('../src')

async function compareBranches() {
  const branch1 = 'main'
  const branch2 = 'HEAD'

  console.log(`🔍 Comparing ${branch1}...${branch2}\n`)
  console.log('═══════════════════════════════════════\n')

  let gitInfo
  try {
    gitInfo = await gitDetails({
      base: branch1,
      head: branch2
    })
  } catch (err) {
    console.log('Error getting git info')
    console.log(err)
    return
  }

  // Commits
  console.log(`📝 Commits: ${gitInfo.commits.length}\n`)
  if (gitInfo.commits.length > 0) {
    const recentCommits = gitInfo.commits.slice(0, 5)
    console.log('Recent commits:')
    recentCommits.forEach(commit => {
      console.log(`   ${commit.abbreviatedCommitHash} - ${commit.subject}`)
      console.log(`   ${commit.author.name} (${commit.author.date})\n`)
    })

    if (gitInfo.commits.length > 5) {
      console.log(`   ... and ${gitInfo.commits.length - 5} more commits\n`)
    }
  }

  // Contributors
  const contributors = new Map()
  gitInfo.commits.forEach(commit => {
    const name = commit.author.name
    contributors.set(name, (contributors.get(name) || 0) + 1)
  })

  console.log('👥 Contributors:\n')
  Array.from(contributors.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      console.log(`   ${name}: ${count} commit${count > 1 ? 's' : ''}`)
    })
  console.log()

  // File changes
  console.log('📊 File Changes:\n')
  console.log(`   Modified: ${gitInfo.modifiedFiles.length}`)
  console.log(`   Created: ${gitInfo.createdFiles.length}`)
  console.log(`   Deleted: ${gitInfo.deletedFiles.length}`)

  const totalLines = await gitInfo.linesOfCode()
  console.log(`   Lines changed: ${totalLines}`)
  console.log()

  // File type breakdown
  const getExtension = (file) => {
    const match = file.match(/\.([^.]+)$/)
    return match ? match[1] : 'no extension'
  }

  const allFiles = [
    ...gitInfo.modifiedFiles,
    ...gitInfo.createdFiles,
    ...gitInfo.deletedFiles
  ]

  const fileTypes = {}
  allFiles.forEach(file => {
    const ext = getExtension(file)
    fileTypes[ext] = (fileTypes[ext] || 0) + 1
  })

  console.log('📁 File Types:\n')
  Object.entries(fileTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([ext, count]) => {
      console.log(`   .${ext}: ${count} file${count > 1 ? 's' : ''}`)
    })
  console.log()

  // Notable changes
  console.log('🔍 Notable Changes:\n')

  const tests = gitInfo.fileMatch(['**/*.test.js', '**/*.test.ts', '**/*.spec.js'])
  if (tests.edited) {
    console.log(`   ✅ ${tests.editedFiles.length} test file${tests.editedFiles.length > 1 ? 's' : ''} changed`)
  }

  const docs = gitInfo.fileMatch('**/*.md')
  if (docs.edited) {
    console.log(`   📝 ${docs.editedFiles.length} documentation file${docs.editedFiles.length > 1 ? 's' : ''} changed`)
  }

  const configs = gitInfo.fileMatch(['**/package.json', '**/*.config.js', '**/tsconfig.json'])
  if (configs.edited) {
    console.log(`   ⚙️  ${configs.editedFiles.length} config file${configs.editedFiles.length > 1 ? 's' : ''} changed`)
  }

  console.log('\n═══════════════════════════════════════')
}

compareBranches()
