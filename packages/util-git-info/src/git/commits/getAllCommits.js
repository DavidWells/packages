const { getFirstCommit } = require('./getFirstCommit')
const { getLastCommit } = require('./getLastCommit')
const { gitDetails } = require('../getDetails')

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
  const data = await gitDetails({
    // base === now
    base: lastCommit.sha,
    // head == start
    head: firstCommit.sha,
    cwd: options && options.cwd
  })
  // console.log('data.commits', data.commits.reverse())
  // process.exit(1)
  return [firstCommit].concat(data.commits.reverse()).concat(lastCommit)
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
