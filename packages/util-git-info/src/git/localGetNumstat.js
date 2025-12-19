const { debug } = require('../debug')
const { spawn } = require('child_process')

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
const localGetNumstat = (base, head, cwd) => {
  return new Promise((resolve, reject) => {
    const args = ['diff', `${base}...${head}`, '--numstat']
    let stdout = ''
    const child = spawn('git', args, { env: process.env, cwd: cwd || process.cwd() })
    d('> git', args.join(' '))

    child.stdout.on('data', chunk => {
      stdout += chunk
    })

    child.stderr.on('data', data => {
      console.error(`Could not get numstat from git between ${base} and ${head}`)
      console.error(`Please double check "${base}" is a valid ref`)
      reject(data.toString())
    })

    child.on('close', function(code) {
      if (code === 0) {
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

        resolve(total)
      }
    })
  })
}

module.exports.localGetNumstat = localGetNumstat
