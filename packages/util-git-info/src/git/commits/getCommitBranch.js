const { executeCommand } = require('../utils/exec')

// https://stackoverflow.com/questions/2706797/finding-what-branch-a-git-commit-came-from
function getCommitBranch(sha) {
  const command = `git branch -a --contains ${sha}`
  return new Promise((resolve, reject) => {
    executeCommand(command, (err, res) => {
      if (err) return reject(err)
      if (res) {
        const answer = res.split('\n').map((line) => {
          return line.trim()
        }).filter(Boolean)
        console.log(answer)
      }
    })
  })
}

/*
if (require.main === module) {
  getCommitBranch('0750a8c57f85f2cdda9920c04441e2ce1a41e590').then((d) => {
    console.log('getCommitBranch', d)
  })
}
/** */

module.exports = {
  getCommitBranch
}
