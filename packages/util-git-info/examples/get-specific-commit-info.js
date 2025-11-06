const { getCommit, getLastCommit } = require('../src')

async function getSpecificCommitInfo() {
  try {
    // Get the last commit first to demonstrate
    const lastCommit = await getLastCommit()
    console.log('🔍 Getting info for commit:', lastCommit.sha)
    console.log('───────────────────────────────────────')
    
    // Get detailed info about that commit
    const commitInfo = await getCommit(lastCommit.sha)
    
    console.log('📝 Commit Details:')
    console.log(`   SHA: ${commitInfo.sha}`)
    console.log(`   Short SHA: ${commitInfo.abbreviatedCommitHash}`)
    console.log(`   Subject: ${commitInfo.subject}`)
    console.log(`   Sanitized: ${commitInfo.sanitizedSubject}`)
    
    console.log('\n👤 Author:')
    console.log(`   Name: ${commitInfo.author.name}`)
    console.log(`   Email: ${commitInfo.author.email}`)
    console.log(`   Date: ${commitInfo.author.date}`)
    
    console.log('\n👥 Committer:')
    console.log(`   Name: ${commitInfo.committer.name}`)
    console.log(`   Email: ${commitInfo.committer.email}`)
    console.log(`   Date: ${commitInfo.committer.date}`)
    
    if (commitInfo.body) {
      console.log('\n📄 Body:')
      console.log(commitInfo.body)
    }
    
    if (commitInfo.branch) {
      console.log('\n🌿 Branch:', commitInfo.branch)
    }
    
    if (commitInfo.tags && commitInfo.tags.length) {
      console.log('\n🏷️  Tags:', commitInfo.tags.join(', '))
    }
  } catch (err) {
    console.log('Error getting commit info')
    console.log(err)
  }
}

getSpecificCommitInfo()
