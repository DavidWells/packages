const { executeCommand } = require('../utils/exec')
const { parse, getPrettyFormat, removeSignedOffBy } = require('./utils/pretty-format')
// Via https://github.com/seymen/git-last-commit/blob/master/source/index.js

/**
 * @typedef {import('../../types').CommitInfo} CommitInfo
 */

/**
 * Gets detailed information about the last commit in the repository
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Working directory (defaults to process.cwd())
 * @returns {Promise<CommitInfo>} Promise that resolves to the last commit details including SHA, author, committer, message, branch, and tags
 * @example
 * const lastCommit = await getLastCommit()
 * console.log('Last commit:', lastCommit.subject)
 * console.log('Author:', lastCommit.author.name)
 * console.log('SHA:', lastCommit.sha)
 */
function getLastCommit(options) {
  const command = `git log -1 --pretty=format:"${getPrettyFormat()}" && git rev-parse --abbrev-ref HEAD && git tag --contains HEAD`
  return new Promise((resolve, reject) => {
    const opts = options ? { dst: options.cwd } : undefined
    executeCommand(command, opts, (err, res) => {
      if (err) return reject(err)
      resolve(parse(res))
    })
  })
}

/**
 * Gets the current HEAD revision SHA
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Working directory (defaults to process.cwd())
 * @returns {Promise<{sha: string, shortSha: string}>} Promise that resolves to object with full and short SHA
 * @example
 * const revision = await getCurrentRevision()
 * console.log('Current SHA:', revision.sha)
 * console.log('Short SHA:', revision.shortSha)
 */
function getCurrentRevision(options) {
  return new Promise((resolve, reject) => {
    const opts = options ? { dst: options.cwd } : undefined
    executeCommand('git rev-parse HEAD', opts, (err, res) => {
      if (err) return reject(err)
      const sha = res.toString().trim()
      resolve({
        sha: sha,
        shortSha: sha.slice(0, 7)
      })
    })
  })
}

/**
 * Gets the commit message of the current HEAD commit
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Working directory (defaults to process.cwd())
 * @returns {Promise<string>} Promise that resolves to the commit message (with Signed-off-by lines removed)
 * @example
 * const message = await getCurrentCommitMessage()
 * console.log('Current commit message:', message)
 */
function getCurrentCommitMessage(options) {
  return new Promise((resolve, reject) => {
    const opts = options ? { dst: options.cwd } : undefined
    executeCommand('git show -s --format=%B HEAD', opts, (err, res) => {
      if (err) return reject(err)
      resolve(removeSignedOffBy(res.toString()).trim())
    })
  })
}

/*
if (require.main === module) {
  getLastCommit().then((d) => {
    console.log('getLastCommit', d)
  })
}
/** */

/*
if (require.main === module) {
  getCurrentRevision().then((d) => {
    console.log('getCurrentRevision', d)
  })
}
/** */

/*
if (require.main === module) {
  getCurrentCommitMessage().then((commitMessage) => {
    console.log('getCurrentCommitMessage')
    console.log(commitMessage)
  })
}
/**/

module.exports = {
  getLastCommit,
  getCurrentRevision,
  getCurrentCommitMessage
}
