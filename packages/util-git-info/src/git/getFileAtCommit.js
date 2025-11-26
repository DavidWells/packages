// Returns file contents at a specific git commit
const { localGetFileAtSHA } = require('./localGetFileAtSHA')
const { validateFilePath } = require('./utils/validateFilePath')

/**
 * Gets the contents of a file at a specific git commit
 * @param {string} filePath - Path to the file (relative to git root)
 * @param {string} sha - Git commit SHA or ref (e.g., 'HEAD', 'main', 'abc123')
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Working directory (defaults to process.cwd())
 * @returns {Promise<string|undefined>} File contents at that commit, or undefined if not found
 * @example
 * const contents = await getFileAtCommit('src/index.js', 'HEAD~1')
 * console.log('Previous version:', contents)
 *
 * // With cwd option
 * const contents = await getFileAtCommit('package.json', 'HEAD', { cwd: '/path/to/repo' })
 */
async function getFileAtCommit(filePath, sha, options = {}) {
  validateFilePath(filePath)
  if (!sha || typeof sha !== 'string') {
    throw new Error('SHA must be a non-empty string')
  }
  return localGetFileAtSHA(filePath, null, sha, options)
}

module.exports = { getFileAtCommit }
