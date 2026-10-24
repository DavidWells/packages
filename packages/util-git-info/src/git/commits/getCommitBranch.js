const { spawnGit } = require('../utils/exec')
const { validateRef } = require('../utils/validateRef')

/**
 * Lists the local and remote branches that contain a commit
 * @param {string} sha - Commit SHA or ref
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Working directory (defaults to process.cwd())
 * @returns {Promise<string[]>} Branch names as `git branch -a` prints them (current branch prefixed with `* `)
 */
// https://stackoverflow.com/questions/2706797/finding-what-branch-a-git-commit-came-from
async function getCommitBranch(sha, options) {
  validateRef(sha, 'SHA')
  const res = await spawnGit(['branch', '-a', '--contains', sha], options && options.cwd)
  return res.split('\n').map((line) => {
    return line.trim()
  }).filter(Boolean)
}

/*
if (require.main === module) {
  getCommitBranch('0750a8c57f85f2cdda9920c04441e2ce1a41e590').then((d) => {
    console.log('getCommitBranch', d)
  })
}
/** */

module.exports = {
  getCommitBranch
}
