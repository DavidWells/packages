const childProcess = require('child_process')

function getDst(opts) {
  const options = (typeof opts === 'object') ? opts : null
  return (options && options.dst) || process.cwd()
}

function handleResult(err, stdout, stderr, callback) {
  if (err) console.log(err)
  if (stdout === '') {
    callback(new Error('this does not look like a git repo'))
    return
  }
  if (stderr) {
    return callback(stderr)
  }
  callback(null, stdout)
}

function executeCommand(command, opts, cb) {
  const callback = (typeof opts === 'function') ? opts : cb
  childProcess.exec(command, { cwd: getDst(opts) }, function(err, stdout, stderr) {
    handleResult(err, stdout, stderr, callback)
  })
}

/**
 * Like executeCommand, but resolves once the command exits to a function that
 * runs executeCommand's result handling (including its error logging) on a
 * callback. Lets callers start a command early and skip the handling entirely
 * if they never need the result.
 * @param {string} command
 * @param {Object} [opts]
 * @returns {Promise<(callback: Function) => void>}
 */
function startCommand(command, opts) {
  return new Promise(resolve => {
    childProcess.exec(command, { cwd: getDst(opts) }, function(err, stdout, stderr) {
      resolve(callback => handleResult(err, stdout, stderr, callback))
    })
  })
}

/**
 * Runs `git <args>` without a shell and settles once it exits: resolves stdout on exit
 * code 0 (stderr warnings don't fail it), rejects with stderr (or the exit code when
 * stderr is empty) otherwise, and rejects if git can't be spawned.
 * @param {string[]} args
 * @param {string} [cwd] - Working directory (defaults to process.cwd())
 * @returns {Promise<string>}
 */
function spawnGit(args, cwd) {
  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    const child = childProcess.spawn('git', args, { env: process.env, cwd: cwd || process.cwd() })
    child.stdout.on('data', chunk => {
      stdout += chunk
    })
    child.stderr.on('data', chunk => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', code => {
      if (code === 0) return resolve(stdout)
      reject(stderr || `git ${args.join(' ')} exited with code ${code}`)
    })
  })
}

module.exports = { executeCommand, startCommand, spawnGit }
