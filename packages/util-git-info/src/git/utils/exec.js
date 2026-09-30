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

module.exports = { executeCommand, startCommand }
