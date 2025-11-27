const { gitDetails } = require('../getDetails')
const micromatch = require('micromatch')

/**
 * @typedef {Object} DiffOptions
 * @property {string} [since='HEAD'] - Git reference to compare against (commit, tag, or branch)
 * @property {string|string[]} [filePath] - Glob pattern(s) to filter files
 * @property {string|string[]} [fileStatus] - Filter by file status ('added', 'modified', 'deleted')
 * @property {string} [cwd] - Working directory
 */

/**
 * @typedef {Object} DiffResult
 * @property {number} count - Number of files that changed
 * @property {string[]} files - List of files that changed
 * @property {string[]} added - List of added files
 * @property {string[]} modified - List of modified files
 * @property {string[]} deleted - List of deleted files
 */

/**
 * Check for file differences since a git reference
 * @param {DiffOptions} [options={}] - Options for checking diff
 * @returns {Promise<DiffResult>} Promise that resolves to diff results
 * @example
 * // Check for any changes since HEAD
 * const result = await checkDiff()
 * console.log(`${result.count} files changed`)
 *
 * // Check for changes since a specific commit
 * const result = await checkDiff({ since: 'abc123' })
 *
 * // Check for changes to specific files
 * const result = await checkDiff({
 *   since: 'main',
 *   filePath: 'src/**\/*.js'
 * })
 *
 * // Check for only modified files
 * const result = await checkDiff({
 *   since: 'HEAD~1',
 *   fileStatus: 'modified'
 * })
 */
async function checkDiff(options = {}) {
  const {
    since = 'HEAD',
    filePath,
    fileStatus,
    cwd
  } = options

  // Get git details comparing since ref to current HEAD
  const git = await gitDetails({
    base: since,
    head: 'HEAD',
    cwd
  })

  let added = git.createdFiles || []
  let modified = git.modifiedFiles || []
  let deleted = git.deletedFiles || []

  // Filter by file path patterns if provided
  if (filePath) {
    const patterns = Array.isArray(filePath) ? filePath : [filePath]
    added = micromatch(added, patterns)
    modified = micromatch(modified, patterns)
    deleted = micromatch(deleted, patterns)
  }

  // Filter by file status if provided
  const statusFilters = Array.isArray(fileStatus) ? fileStatus : fileStatus ? [fileStatus] : null
  if (statusFilters) {
    const normalizedFilters = statusFilters.map(s => s.toLowerCase())

    if (!normalizedFilters.includes('added')) {
      added = []
    }
    if (!normalizedFilters.includes('modified')) {
      modified = []
    }
    if (!normalizedFilters.includes('deleted')) {
      deleted = []
    }
  }

  // Combine all filtered files
  const files = [...added, ...modified, ...deleted]

  return {
    count: files.length,
    files,
    added,
    modified,
    deleted
  }
}

module.exports = {
  checkDiff
}
