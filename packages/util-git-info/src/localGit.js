const { readFileSync } = require('fs')
const { gitJSONToGitDSL } = require('./git/gitJSONToGitDSL')
const { diffToGitJSONDSL } = require('./git/diffToGitJSONDSL')
const { localGetDiff } = require('./git/localGetDiff')
const { localGetFileAtSHA } = require('./git/localGetFileAtSHA')
const { localGetCommits } = require('./git/localGetCommits')
const { localGetNumstat } = require('./git/localGetNumstat')

const DEBUG_TIMING = false

class LocalGit {
  constructor(options) {
    this.options = options
    this.getFileContents = path => {
      // eslint-disable-next-line promise/param-names
      return new Promise(res => res(readFileSync(path, 'utf8')))
    }
    this.name = 'local git'
    this.base = this.options.from || this.options.base || 'master'
    this.head = this.options.to || this.options.head || 'HEAD'
  }
  async getGitDiff() {
    if (this.gitDiff) {
      return this.gitDiff
    }
    this.gitDiff = await localGetDiff(this.base, this.head)
    return this.gitDiff
  }
  async validateThereAreChanges() {
    const diff = await this.getGitDiff()
    return diff.trim().length > 0
  }
  async getPlatformReviewDSLRepresentation() {
    return null
  }
  async getPlatformGitRepresentation() {
    const base = this.base
    const head = this.head

    const t0 = DEBUG_TIMING ? Date.now() : 0
    const diff = await this.getGitDiff()
    const t1 = DEBUG_TIMING ? Date.now() : 0
    if (DEBUG_TIMING) console.log(`    ⏱️  getGitDiff: ${t1 - t0}ms`)

    // Array of commits
    const commits = await localGetCommits(base, head)
    const t2 = DEBUG_TIMING ? Date.now() : 0
    if (DEBUG_TIMING) console.log(`    ⏱️  localGetCommits: ${t2 - t1}ms`)

    // console.log('commits', commits)
    const gitJSON = diffToGitJSONDSL(diff, commits)
    const t3 = DEBUG_TIMING ? Date.now() : 0
    if (DEBUG_TIMING) console.log(`    ⏱️  diffToGitJSONDSL: ${t3 - t2}ms (parsing ${diff.split('\n').length} lines of diff)`)

    const config = {
      repo: process.cwd(),
      baseSHA: base,
      headSHA: head,
      getFileContents: localGetFileAtSHA,
      getFullDiff: localGetDiff,
      getNumstat: localGetNumstat
    }
    const result = gitJSONToGitDSL(gitJSON, config)
    const t4 = DEBUG_TIMING ? Date.now() : 0
    if (DEBUG_TIMING) console.log(`    ⏱️  gitJSONToGitDSL: ${t4 - t3}ms`)

    return result
  }
  async getInlineComments(_) {
    return []
  }
  async getReviewInfo() {
    return {}
  }
}

module.exports.LocalGit = LocalGit
