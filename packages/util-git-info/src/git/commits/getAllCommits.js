const { getFirstCommit } = require('./getFirstCommit')
const { getLastCommit } = require('./getLastCommit')
const { localGetCommits } = require('../localGetCommits')

/**
 * @typedef {import('../../types').CommitInfo} CommitInfo
 */

/**
 * Gets all commits in the repository from first to last
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Working directory (defaults to process.cwd())
 * @returns {Promise<CommitInfo[]>} Promise that resolves to array of all commits in chronological order
 * @example
 * const commits = await getAllCommits()
 * commits.forEach(commit => {
 *   console.log(`${commit.sha}: ${commit.subject}`)
 * })
 */
async function getAllCommits(options) {
  const firstCommit = await getFirstCommit(options)
  // console.log('firstCommit', firstCommit)
  const lastCommit = await getLastCommit(options)
  // console.log('lastCommit', lastCommit)
  // Only the commit list is needed, so skip the full-history diff gitDetails would compute
  const commits = await localGetCommits(
    // base === now
    lastCommit.sha,
    // head == start
    firstCommit.sha,
    options && options.cwd
  )
  return [firstCommit].concat(commits.reverse()).concat(lastCommit)
}

/*
if (require.main === module) {
  getAllCommits().then((d) => {
    console.log('xd', d)
  })
}
/** */

module.exports = {
  getAllCommits
}
