// Gets file contents at a specific git SHA
const { debug } = require('../debug')
const { execFile } = require('child_process')
const { validateRef } = require('./utils/validateRef')

const d = debug('localGetFileAtSHA')

/**
 * Gets file contents at a specific git commit (internal)
 * @param {string} path - File path relative to git root
 * @param {string|null} _repo - Unused, kept for interface compatibility
 * @param {string} sha - Git commit SHA or ref
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Working directory (defaults to process.cwd())
 * @returns {Promise<string|undefined>} File contents or undefined if not found
 */
const localGetFileAtSHA = (path, _repo, sha, options = {}) => {
  const cwd = options.cwd || process.cwd()
  /** @type {Promise<string|undefined>} */
  const promise = new Promise(resolve => {
    validateRef(sha, 'SHA')
    // No shell: sha and path reach git as one argument, never as shell syntax
    const args = ['show', `${sha}:${path}`]
    d('git', args.join(' '))
    execFile('git', args, { cwd }, (err, stdout, _stderr) => {
      if (err) {
        return resolve(undefined)
      }
      resolve(stdout)
    })
  })
  return promise
}

module.exports.localGetFileAtSHA = localGetFileAtSHA
