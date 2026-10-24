const { debug } = require('../debug')
const { spawnGit } = require('./utils/exec')
const { validateRef } = require('./utils/validateRef')

const d = debug('localGetNumstat')

/**
 * Get line count statistics using git diff --numstat
 * Returns total additions + deletions across all files
 *
 * @param {string} base - Base commit SHA
 * @param {string} head - Head commit SHA
 * @param {string} [cwd] - Working directory (defaults to process.cwd())
 * @returns {Promise<number>} Total lines of code changed (additions + deletions)
 */
const localGetNumstat = async (base, head, cwd) => {
  validateRef(base, 'Base ref')
  validateRef(head, 'Head ref')
  const args = ['diff', `${base}...${head}`, '--numstat']
  d('> git', args.join(' '))

  let stdout
  try {
    stdout = await spawnGit(args, cwd)
  } catch (err) {
    console.error(`Could not get numstat from git between ${base} and ${head}`)
    console.error(`Please double check "${base}" is a valid ref`)
    throw err
  }

  // Parse numstat output: "additions deletions filename" per line
  // Sum all additions and deletions
  let total = 0
  const lines = stdout.trim().split('\n')

  for (const line of lines) {
    if (!line) continue

    const parts = line.split(/\s+/)
    const additions = parseInt(parts[0], 10) || 0
    const deletions = parseInt(parts[1], 10) || 0
    total += additions + deletions
  }

  return total
}

module.exports.localGetNumstat = localGetNumstat
