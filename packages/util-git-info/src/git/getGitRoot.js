const { exec } = require('child_process')

/** @type {Map<string, string>} */
const gitRootCache = new Map()

/**
 * Gets the root directory of the git repository
 * @param {string} [cwd] - Working directory to run git command from (defaults to process.cwd())
 * @returns {Promise<string>} A promise that resolves to the root directory path of the git repository
 */
function getGitRoot(cwd) {
  return new Promise((resolve, reject) => {
    const dir = cwd || process.cwd()
    const cached = gitRootCache.get(dir)
    if (cached) {
      return resolve(cached)
    }
    exec('git rev-parse --show-toplevel', { cwd: dir }, (err, stdout, stderr) => {
      if (err) return reject(err)
      if (stderr) return reject(stderr)
      const root = stdout.trim()
      gitRootCache.set(dir, root)
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
