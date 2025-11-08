const { debug } = require('../debug')
const { spawn } = require('child_process')

const d = debug('localGetDiff')

const localGetDiff = (base, head) => {
  return new Promise((resolve, reject) => {
    // If head is empty/null/undefined, compare against working directory
    // Otherwise use three-dot syntax for commit-to-commit comparison
    const args = !head || head === ''
      ? ['diff', base]
      : ['diff', `${base}...${head}`]

    let stdout = ''
    const child = spawn('git', args, { env: process.env })
    d('> git', args.join(' '))
    child.stdout.on('data', chunk => {
      stdout += chunk
    })
    child.stderr.on('data', data => {
      console.error(`Could not get diff from git between ${base} and ${head}`)
      console.error(`Please double check "${base}" is a valid ref`)
      reject(data.toString())
    })
    child.on('close', function(code) {
      if (code === 0) {
        resolve(stdout)
      }
    })
  })
}

module.exports.localGetDiff = localGetDiff
