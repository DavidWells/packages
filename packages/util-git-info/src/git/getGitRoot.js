const { executeCommand } = require('./utils/exec')

let gitRoot
/**
 * Gets the root directory of the git repository
 * @returns {Promise<string>} A promise that resolves to the root directory path of the git repository
 */
function getGitRoot() {
  return new Promise((resolve, reject) => {
    if (gitRoot) {
      return resolve(gitRoot)
    }
    executeCommand('git rev-parse --show-toplevel', (err, res) => {
      if (err) return reject(err)
      gitRoot = res.trim()
      resolve(res.trim())
    })
  })
}

/*
if (require.main === module) {
  getGitRoot().then(res => {
    console.log('getGitRoot', res)
  })
}
/** */

module.exports = { getGitRoot }
