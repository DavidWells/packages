const { getFirstCommit } = require('./getFirstCommit')
const { getLastCommit } = require('./getLastCommit')
const { gitDetails } = require('../getDetails')

/**
 * @typedef {import('../../types').CommitInfo} CommitInfo
 */

/**
 * Gets all commits in the repository from first to last
 * @returns {Promise<CommitInfo[]>} Promise that resolves to array of all commits in chronological order
 * @example
 * const commits = await getAllCommits()
 * commits.forEach(commit => {
 *   console.log(`${commit.sha}: ${commit.subject}`)
 * })
 */
async function getAllCommits() {
  const firstCommit = await getFirstCommit()
  // console.log('firstCommit', firstCommit)
  const lastCommit = await getLastCommit()
  // console.log('lastCommit', lastCommit)
  const data = await gitDetails({
    // base === now
    base: lastCommit.sha,
    // head == start
    head: firstCommit.sha
  })
  // console.log('data.commits', data.commits.reverse())
  // process.exit(1)
  return [firstCommit].concat(data.commits.reverse()).concat(lastCommit)
}

/*
getAllCommits().then((d) => {
  console.log('xd', d)
})
/**/

module.exports = {
  getAllCommits
}
