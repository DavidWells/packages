const { executeCommand } = require('../utils/exec')

/**
 * @typedef {Object} RemoteInfo
 * @property {string} name - The name of the remote (e.g., 'origin', 'upstream')
 * @property {string} url - The URL of the remote repository
 * @property {string} [fetchUrl] - The fetch URL (if different from push URL)
 * @property {string} [pushUrl] - The push URL (if different from fetch URL)
 */

/**
 * Parses the output of git remote -v command
 * @param {string} stdout - The raw output from git remote -v
 * @returns {Object.<string, RemoteInfo>} Object with remote names as keys and remote info as values
 */
function parseRemotes(stdout) {
  const lines = stdout.trim().split('\n').filter(Boolean)
  /** @type {Object.<string, RemoteInfo>} */
  const remotes = {}

  lines.forEach(line => {
    // Format: "remoteName url (fetch|push)"
    const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)/)
    if (match) {
      const [, name, url, type] = match

      if (!remotes[name]) {
        remotes[name] = {
          name,
          url
        }
      }

      // Store separate fetch/push URLs if they differ
      if (type === 'fetch') {
        remotes[name].fetchUrl = url
      } else if (type === 'push') {
        remotes[name].pushUrl = url
      }
    }
  })

  return remotes
}

/**
 * Gets information about all git remotes in the repository
 * @param {Object} [options] - Optional execution options
 * @param {string} [options.dst] - The directory to execute the command in
 * @returns {Promise<Object.<string, RemoteInfo>>} Promise that resolves to an object containing remote information
 * @example
 * const remotes = await getRemotes()
 * console.log('Origin URL:', remotes.origin.url)
 * console.log('All remotes:', Object.keys(remotes))
 */
function getRemotes(options) {
  const command = 'git remote -v'
  return new Promise((resolve, reject) => {
    executeCommand(command, options, function(err, res) {
      if (err) return reject(err)
      const remotes = parseRemotes(res)
      resolve(remotes)
    })
  })
}

/**
 * Gets information about a specific git remote
 * @param {string} remoteName - The name of the remote (e.g., 'origin', 'upstream')
 * @param {Object} [options] - Optional execution options
 * @returns {Promise<RemoteInfo|null>} Promise that resolves to remote info or null if not found
 * @example
 * const origin = await getRemote('origin')
 * console.log('Origin URL:', origin.url)
 */
function getRemote(remoteName, options) {
  if (!remoteName) {
    return Promise.reject(new Error('Remote name is required'))
  }

  return getRemotes(options).then(remotes => {
    return remotes[remoteName] || null
  })
}

/*
if (require.main === module) {
  getRemotes().then((remotes) => {
    console.log('All remotes:', remotes)
  })

  getRemote('origin').then((remote) => {
    console.log('Origin remote:', remote)
  })
}
/** */

module.exports = {
  getRemotes,
  getRemote,
  parseRemotes
}
