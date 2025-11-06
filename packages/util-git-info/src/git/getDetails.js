const { LocalGit } = require('../localGit')

/**
 * @typedef {import('../types').GitDetails} GitDetails
 */

/**
 * Gets detailed information about git changes between two refs (commits/branches)
 * @param {Object} [opts={}] - Options for getting git details
 * @param {string} [opts.base='master'] - The base commit/branch to compare from (e.g., 'master', commit SHA)
 * @param {string} [opts.head='HEAD'] - The head commit/branch to compare to (e.g., 'HEAD', branch name, commit SHA)
 * @param {string} [opts.from] - Alias for opts.base
 * @param {string} [opts.to] - Alias for opts.head
 * @returns {Promise<GitDetails>} Promise that resolves to git details including modified/created/deleted files, commits, and utility functions
 * @example
 * const git = await gitDetails({ base: 'main', head: 'feature-branch' })
 * console.log('Modified files:', git.modifiedFiles)
 * console.log('Created files:', git.createdFiles)
 * console.log('Deleted files:', git.deletedFiles)
 *
 * // Use fileMatch to filter files by pattern
 * const srcFiles = git.fileMatch('src/**\/*.js')
 * if (srcFiles.modified) {
 *   console.log('Source files changed:', srcFiles.modifiedFiles)
 * }
 */
async function gitDetails(opts = {}) {
  const localPlatform = new LocalGit(opts)
  const git = await localPlatform.getPlatformGitRepresentation()
  return git
}

module.exports = {
  gitDetails
}
