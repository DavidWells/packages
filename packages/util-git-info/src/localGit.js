const { readFileSync } = require('fs')
const { gitJSONToGitDSL } = require('./git/gitJSONToGitDSL')
const { diffToGitJSONDSL } = require('./git/diffToGitJSONDSL')
const { localGetDiff } = require('./git/localGetDiff')
const { localGetFileAtSHA } = require('./git/localGetFileAtSHA')
const { localGetCommits } = require('./git/localGetCommits')
const { localGetNumstat } = require('./git/localGetNumstat')
const { getGitRoot } = require('./git/getGitRoot')

const DEBUG_TIMING = false

/**
 * @typedef {import('./types').GitDetails} GitDetails
 */

/**
 * LocalGit class for working with local git repositories
 * @class
 */
class LocalGit {
  /**
   * Creates a new LocalGit instance
   * @param {Object} options - Configuration options
   * @param {string} [options.from] - Alias for base commit/branch
   * @param {string} [options.base='master'] - The base commit/branch to compare from
   * @param {string} [options.to] - Alias for head commit/branch
   * @param {string} [options.head='HEAD'] - The head commit/branch to compare to. Pass empty string '' to compare against working directory
   * @param {boolean} [options.includeWorkingChanges=false] - If true, compares against uncommitted changes in working directory instead of HEAD
   * @param {string} [options.cwd] - Working directory for git commands (defaults to process.cwd())
   */
  constructor(options) {
    this.options = options
    this.cwd = options.cwd
    this.getFileContents = path => {
      // eslint-disable-next-line promise/param-names
      return new Promise(res => res(readFileSync(path, 'utf8')))
    }
    this.name = 'local git'
    this.base = this.options.from || this.options.base || 'master'

    // Determine head: support includeWorkingChanges flag or explicit empty string
    if (this.options.includeWorkingChanges) {
      this.head = ''
    } else if (this.options.to !== undefined) {
      this.head = this.options.to
    } else if (this.options.head !== undefined) {
      this.head = this.options.head
    } else {
      this.head = 'HEAD'
    }
  }
  /**
   * Gets the git diff between base and head
   * @returns {Promise<string>} Promise that resolves to the git diff output
   */
  async getGitDiff() {
    if (this.gitDiff) {
      return this.gitDiff
    }
    this.gitDiff = await localGetDiff(this.base, this.head, this.cwd)
    return this.gitDiff
  }
  /**
   * Validates that there are changes between base and head
   * @returns {Promise<boolean>} Promise that resolves to true if there are changes, false otherwise
   */
  async validateThereAreChanges() {
    const diff = await this.getGitDiff()
    return diff.trim().length > 0
  }
  /**
   * Gets platform review DSL representation (not implemented for local git)
   * @returns {Promise<null>} Always resolves to null
   */
  async getPlatformReviewDSLRepresentation() {
    return null
  }
  /**
   * Gets the git representation including modified/created/deleted files, commits, and utility functions
   * @returns {Promise<GitDetails>} Promise that resolves to git details object
   */
  async getPlatformGitRepresentation() {
    const base = this.base
    const head = this.head
    const cwd = this.cwd

    const t0 = DEBUG_TIMING ? Date.now() : 0
    const diff = await this.getGitDiff()
    const t1 = DEBUG_TIMING ? Date.now() : 0
    if (DEBUG_TIMING) console.log(`    ⏱️  getGitDiff: ${t1 - t0}ms`)

    // Array of commits
    const commits = await localGetCommits(base, head, cwd)
    const t2 = DEBUG_TIMING ? Date.now() : 0
    if (DEBUG_TIMING) console.log(`    ⏱️  localGetCommits: ${t2 - t1}ms`)

    // console.log('commits', commits)
    const gitJSON = diffToGitJSONDSL(diff, commits)
    const t3 = DEBUG_TIMING ? Date.now() : 0
    if (DEBUG_TIMING) console.log(`    ⏱️  diffToGitJSONDSL: ${t3 - t2}ms (parsing ${diff.split('\n').length} lines of diff)`)

    const gitRoot = await getGitRoot(cwd)

    const config = {
      repo: gitRoot,
      baseSHA: base,
      headSHA: head,
      cwd,
      getFileContents: localGetFileAtSHA,
      getFullDiff: localGetDiff,
      getNumstat: localGetNumstat
    }
    const result = gitJSONToGitDSL(gitJSON, config)
    const t4 = DEBUG_TIMING ? Date.now() : 0
    if (DEBUG_TIMING) console.log(`    ⏱️  gitJSONToGitDSL: ${t4 - t3}ms`)

    return result
  }
  /**
   * Gets inline comments (not implemented for local git)
   * @param {*} _ - Unused parameter
   * @returns {Promise<Array>} Always resolves to empty array
   */
  async getInlineComments(_) {
    return []
  }
  /**
   * Gets review info (not implemented for local git)
   * @returns {Promise<Object>} Always resolves to empty object
   */
  async getReviewInfo() {
    return {}
  }
}

module.exports.LocalGit = LocalGit
