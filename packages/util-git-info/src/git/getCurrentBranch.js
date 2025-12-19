// Gets the current git branch name
const { executeCommand } = require('./utils/exec')

/**
 * Gets the current branch name of the git repository
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Working directory (defaults to process.cwd())
 * @returns {Promise<string>} A promise that resolves to the current branch name
 */
function getCurrentBranch(options) {
  return new Promise((resolve, reject) => {
    const opts = options ? { dst: options.cwd } : undefined
    executeCommand('git rev-parse --abbrev-ref HEAD', opts, (err, res) => {
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
