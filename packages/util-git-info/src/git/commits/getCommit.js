const { executeCommand } = require('../utils/exec')
const { parse, getPrettyFormat } = require('./utils/pretty-format')
const HASH_REGEX = /\b[0-9a-f]{5,40}\b/

/**
 * @typedef {import('../../types').CommitInfo} CommitInfo
 */

/**
 * Gets detailed information about a specific git commit by its hash
 * @param {string} hash - The git commit hash (short or full SHA)
 * @param {Object} [options] - Optional execution options
 * @returns {Promise<CommitInfo>} Promise that resolves to commit details including SHA, author, committer, message, branch, and tags
 * @throws {Error} Throws if hash is not provided or invalid
 * @example
 * const commit = await getCommit('abc123')
 * console.log('Author:', commit.author.name)
 * console.log('Message:', commit.subject)
 * console.log('SHA:', commit.sha)
 */
function getCommit(hash, options) {
  if (!hash || !HASH_REGEX.test(hash)) {
    throw new Error('Must use git hash')
  }
  /* git show
    --format="%h<##>%H<##>%s<##>%f<##>%b<##>%at<##>%ct<##>%an<##>%ae<##>%cn<##>%ce<##>%N<##>"
    -s 7d7162118aeb2bd9b7f0e12f4a8ff63a4c928d21
  */
  const command = `git show --format="${getPrettyFormat()}" -s ${hash} && git rev-parse --abbrev-ref HEAD && git tag --contains HEAD`
  return new Promise((resolve, reject) => {
    executeCommand(command, options, function(err, res) {
      if (err) return reject(err)
      resolve(parse(res))
    })
  })
}

/*
getCommit('361a0cc56b323911af9fb740fe2e37cf134092ed').then((d) => {
  console.log('getCommit', d)
})
/**/

module.exports = {
  getCommit
}
