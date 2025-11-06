const { gitDetails, getLastCommit, getFirstCommit } = require('../src')

async function generateReleaseNotes() {
  try {
    // Get commits between last tag and current HEAD
    // In production, you'd get the last tag dynamically
    const gitInfo = await gitDetails({
      base: 'main',
      head: 'HEAD'
    })

    console.log('# Release Notes\n')
    console.log(`Generated from ${gitInfo.commits.length} commits\n`)

    // Group commits by type (based on conventional commits)
    const features = []
    const fixes = []
    const docs = []
    const chores = []
    const breaking = []
    const other = []

    gitInfo.commits.forEach(commit => {
      const subject = commit.subject.toLowerCase()
      const item = {
        subject: commit.subject,
        sha: commit.abbreviatedCommitHash,
        author: commit.author.name
      }

      if (subject.includes('breaking')) {
        breaking.push(item)
      } else if (subject.startsWith('feat') || subject.startsWith('feature')) {
        features.push(item)
      } else if (subject.startsWith('fix')) {
        fixes.push(item)
      } else if (subject.startsWith('docs')) {
        docs.push(item)
      } else if (subject.startsWith('chore')) {
        chores.push(item)
      } else {
        other.push(item)
      }
    })

    // Print sections
    if (breaking.length > 0) {
      console.log('## ⚠️  BREAKING CHANGES\n')
      breaking.forEach(item => {
        console.log(`- ${item.subject} (${item.sha})`)
      })
      console.log()
    }

    if (features.length > 0) {
      console.log('## ✨ Features\n')
      features.forEach(item => {
        console.log(`- ${item.subject} (${item.sha})`)
      })
      console.log()
    }

    if (fixes.length > 0) {
      console.log('## 🐛 Bug Fixes\n')
      fixes.forEach(item => {
        console.log(`- ${item.subject} (${item.sha})`)
      })
      console.log()
    }

    if (docs.length > 0) {
      console.log('## 📝 Documentation\n')
      docs.forEach(item => {
        console.log(`- ${item.subject} (${item.sha})`)
      })
      console.log()
    }

    if (other.length > 0) {
      console.log('## 🔧 Other Changes\n')
      other.forEach(item => {
        console.log(`- ${item.subject} (${item.sha})`)
      })
      console.log()
    }

    // File statistics
    console.log('## 📊 Statistics\n')
    console.log(`- ${gitInfo.modifiedFiles.length} files modified`)
    console.log(`- ${gitInfo.createdFiles.length} files created`)
    console.log(`- ${gitInfo.deletedFiles.length} files deleted`)

    const totalLines = await gitInfo.linesOfCode()
    console.log(`- ${totalLines} total lines changed`)

    // Contributors
    const contributors = new Set(gitInfo.commits.map(c => c.author.name))
    console.log(`\n👥 Contributors: ${[...contributors].join(', ')}`)

  } catch (err) {
    console.log('Error generating release notes')
    console.log(err)
  }
}

generateReleaseNotes()
