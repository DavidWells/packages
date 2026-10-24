const { getCommit } = require('./getCommit')
const { spawnGit } = require('../utils/exec')

/**
 * @typedef {import('../../types').CommitInfo} CommitInfo
 */

/**
 * Gets the hash of the first commit in the repository
 * Uses git rev-list to find the initial commit with no parents
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Working directory (defaults to process.cwd())
 * @returns {Promise<string>} Promise that resolves to the SHA hash of the first commit
 * @throws {Error} Throws if git command fails or if not in a git repository
 * @example
 * const hash = await getFirstCommitHash()
 * // Returns: 'a1b2c3d4e5f6...' (40-character SHA-1 hash)
 */
async function getFirstCommitHash(options) {
  // git rev-list --max-parents=0 HEAD
  const args = ['rev-list', '--max-parents=0', 'HEAD', '--reverse']
  const stdout = await spawnGit(args, options && options.cwd)
  // A repo with several root commits (merged histories) lists one per line: take the first
  return stdout.trim().split('\n')[0]
}

/**
 * Gets detailed information about the first commit in the repository
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Working directory (defaults to process.cwd())
 * @returns {Promise<CommitInfo>} Promise that resolves to commit details object containing SHA, author, committer, message, branch, and tags
 * @throws {Error} Throws if git command fails or if not in a git repository
 * @example
 * const firstCommit = await getFirstCommit()
 * console.log('Subject:', firstCommit.subject)
 * console.log('Author:', firstCommit.author.name)
 * console.log('SHA:', firstCommit.sha)
 */
async function getFirstCommit(options) {
  const hash = await getFirstCommitHash(options)
  const opts = options ? { dst: options.cwd } : undefined
  return getCommit(hash, opts)
}

/*
if (require.main === module) {
  getFirstCommit().then((d) => {
    console.log('getFirstCommit', d)
  })
}
/** */

module.exports = {
  getFirstCommit,
  getFirstCommitHash
}
