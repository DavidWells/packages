const { executeCommand } = require('./utils/exec')

/** @type {Map<string, string>} */
const gitRootCache = new Map()

/**
 * Gets the root directory of the git repository
 * @returns {Promise<string>} A promise that resolves to the root directory path of the git repository
 */
function getGitRoot() {
  return new Promise((resolve, reject) => {
    const cwd = process.cwd()
    const cached = gitRootCache.get(cwd)
    if (cached) {
      return resolve(cached)
    }
    executeCommand('git rev-parse --show-toplevel', (err, res) => {
      if (err) return reject(err)
      const root = res.trim()
      gitRootCache.set(cwd, root)
      resolve(root)
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
