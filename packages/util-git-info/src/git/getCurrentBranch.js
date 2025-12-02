// Gets the current git branch name
const { executeCommand } = require('./utils/exec')

/**
 * Gets the current branch name of the git repository
 * @returns {Promise<string>} A promise that resolves to the current branch name
 */
function getCurrentBranch() {
  return new Promise((resolve, reject) => {
    executeCommand('git rev-parse --abbrev-ref HEAD', (err, res) => {
      if (err) return reject(err)
      resolve(res.trim())
    })
  })
}

/*
if (require.main === module) {
  getCurrentBranch().then(res => {
    console.log('getCurrentBranch', res)
  })
}
/** */

module.exports = { getCurrentBranch }
