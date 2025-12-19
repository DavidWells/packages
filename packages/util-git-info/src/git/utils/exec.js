const childProcess = require('child_process')

function executeCommand(command, opts, cb) {
  const callback = (typeof opts === 'function') ? opts : cb
  const options = (typeof opts === 'object') ? opts : null
  const dst = (options && options.dst) || process.cwd()

  childProcess.exec(command, { cwd: dst }, function(err, stdout, stderr) {
    if (err) console.log(err)
    if (stdout === '') {
      callback(new Error('this does not look like a git repo'))
      return
    }
    if (stderr) {
      return callback(stderr)
    }
    callback(null, stdout)
  })
}

module.exports = { executeCommand }
