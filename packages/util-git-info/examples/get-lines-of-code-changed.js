const { gitDetails } = require('../src')

async function getLinesOfCodeChanged() {
  let gitInfo
  try {
    gitInfo = await gitDetails({
      base: 'main',
      head: 'HEAD'
    })
  } catch (err) {
    console.log('Error getting git info')
    console.log(err)
    return
  }

  // Get total lines of code changed
  const totalLines = await gitInfo.linesOfCode()
  console.log(`📊 Total lines changed: ${totalLines}`)
  
  console.log(`\n📝 File Summary:`)
  console.log(`   Modified: ${gitInfo.modifiedFiles.length} files`)
  console.log(`   Created: ${gitInfo.createdFiles.length} files`)
  console.log(`   Deleted: ${gitInfo.deletedFiles.length} files`)
  
  console.log(`\n💬 Commits: ${gitInfo.commits.length}`)
}

getLinesOfCodeChanged()
