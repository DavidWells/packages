const { debug } = require('../debug')
const { spawnGit } = require('./utils/exec')
const { validateRef } = require('./utils/validateRef')

const d = debug('localGetDiff')

/**
 * Get git diff between two refs
 * @param {string} base - Base ref
 * @param {string} head - Head ref
 * @param {string} [cwd] - Working directory (defaults to process.cwd())
 */
const localGetDiff = async (base, head, cwd) => {
  validateRef(base, 'Base ref')
  if (head) validateRef(head, 'Head ref')
  // If head is empty/null/undefined, compare against working directory
  // Otherwise use three-dot syntax for commit-to-commit comparison
  const args = !head || head === ''
    ? ['diff', base]
    : ['diff', `${base}...${head}`]

  d('> git', args.join(' '))
  try {
    return await spawnGit(args, cwd)
  } catch (err) {
    console.error(`Could not get diff from git between ${base} and ${head}`)
    console.error(`Please double check "${base}" is a valid ref`)
    throw err
  }
}

module.exports.localGetDiff = localGetDiff
