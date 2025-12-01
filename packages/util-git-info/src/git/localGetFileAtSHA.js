// Gets file contents at a specific git SHA
const { debug } = require('../debug')
const { exec } = require('child_process')

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
    const call = `git show ${sha}:'${path}'`
    d(call)
    exec(call, { cwd }, (err, stdout, _stderr) => {
      if (err) {
        return resolve(undefined)
      }
      resolve(stdout)
    })
  })
  return promise
}

module.exports.localGetFileAtSHA = localGetFileAtSHA
