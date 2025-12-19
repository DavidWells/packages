const { debug } = require('../debug')
const { spawn } = require('child_process')

const d = debug('localGetJSONCommits')

var format = "'{%n  ^^^^commit^^^^: ^^^^%H^^^^,%n  ^^^^abbreviated_commit^^^^: ^^^^%h^^^^,%n  ^^^^tree^^^^: ^^^^%T^^^^,%n  ^^^^abbreviated_tree^^^^: ^^^^%t^^^^,%n  ^^^^parent^^^^: ^^^^%P^^^^,%n  ^^^^abbreviated_parent^^^^: ^^^^%p^^^^,%n  ^^^^refs^^^^: ^^^^%D^^^^,%n  ^^^^encoding^^^^: ^^^^%e^^^^,%n  ^^^^subject^^^^: ^^^^%s^^^^,%n  ^^^^sanitized_subject_line^^^^: ^^^^%f^^^^,%n  ^^^^commit_notes^^^^: ^^^^%N^^^^,%n  ^^^^verification_flag^^^^: ^^^^%G?^^^^,%n  ^^^^signer^^^^: ^^^^%GS^^^^,%n  ^^^^signer_key^^^^: ^^^^%GK^^^^,%n  ^^^^author^^^^: {%n    ^^^^name^^^^: ^^^^%aN^^^^,%n    ^^^^email^^^^: ^^^^%aE^^^^,%n    ^^^^date^^^^: ^^^^%aD^^^^%n  },%n  ^^^^commiter^^^^: {%n    ^^^^name^^^^: ^^^^%cN^^^^,%n    ^^^^email^^^^: ^^^^%cE^^^^,%n    ^^^^date^^^^: ^^^^%cD^^^^%n  }%n},'"

// https://gist.github.com/varemenos/e95c2e098e657c7688fd
/**
 * Get git log as JSON
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Working directory (defaults to process.cwd())
 */
function getLogAsJson(options) {
  return new Promise((resolve, reject) => {
    let stdout = ''
    let result = ''
    const args = ['log', '--pretty=format:' + format] // eslint-disable-line
    const cwd = (options && options.cwd) || process.cwd()
    const child = spawn('git', args, { env: process.env, cwd })
    d('> git', args.join(' '))
    try {
      child.stdout.on('data', chunk => {
        stdout += chunk
      })
      child.stderr.on('data', data => {
        if (!data.toString().match(/No such file or directory/)) {
          reject(data.toString())
        }
      })
      child.on('close', function(code) {
        console.log('close')
        if (code === 0) {
          const json = stdout.replace(/\^\^\^\^/g, '"')
            .replace(/^'{/gm, '{')
            .replace(/^},'/gm, '},')
          // console.log('stdout', json)
          result = JSON.parse('[' + json.slice(0, -1) + ']')
          console.log('result', result)
          return resolve(result)
        }
      })
    } catch (e) {
      console.log('e', e)
    }
  })
}

if (require.main === module) {
  getLogAsJson().then((d) => {
    console.log('d', d)
  }).catch((e) => {
    console.log('e', e)
  })
}

module.exports.getLogAsJson = getLogAsJson
