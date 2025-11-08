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
 * @param {boolean} [opts.includeWorkingChanges=false] - If true, compares against uncommitted changes in working directory instead of HEAD
 * @returns {Promise<GitDetails>} Promise that resolves to git details including modified/created/deleted files, commits, and utility functions
 * @example
 * // Compare between commits
 * const git = await gitDetails({ base: 'main', head: 'feature-branch' })
 * console.log('Modified files:', git.modifiedFiles)
 * console.log('Created files:', git.createdFiles)
 * console.log('Deleted files:', git.deletedFiles)
 *
 * // Compare against uncommitted working directory changes
 * const workingGit = await gitDetails({ base: 'main', includeWorkingChanges: true })
 * console.log('Uncommitted changes:', workingGit.modifiedFiles)
 *
 * // Use fileMatch to filter files by pattern(s)
 * const srcFiles = git.fileMatch('src/**\/*.js', '!**\/*.test.js')
 * if (srcFiles.modified) {
 *   console.log('Source files changed:', srcFiles.modifiedFiles)
 * }
 *
 * // Or use array syntax
 * const configFiles = git.fileMatch(['**\/package.json', '**\/*.config.js'])
 */
async function gitDetails(opts = {}) {
  const localPlatform = new LocalGit(opts)
  const git = await localPlatform.getPlatformGitRepresentation()
  return git
}

/*
if (require.main === module) {
  gitDetails({ base: 'master', head: 'HEAD' }).then(git => {
    console.log('git', git)
  })
}
/** */

module.exports = {
  gitDetails
}
