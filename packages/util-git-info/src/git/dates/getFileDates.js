const { executeCommand } = require('../utils/exec')
const { validateFilePath } = require('../utils/validateFilePath')

/**
 * @typedef {Object} FileDateInfo
 * @property {number} created - Unix timestamp (seconds) of when the file was first committed
 * @property {number} modified - Unix timestamp (seconds) of when the file was last modified
 * @property {Date} createdDate - JavaScript Date object of creation time
 * @property {Date} modifiedDate - JavaScript Date object of last modification
 */

/**
 * @typedef {Object} FileDateError
 * @property {string} error - Error message when file date retrieval fails
 */

/**
 * Gets the last modification date of a file from git history
 * @param {string} filePath - Path to the file (absolute or relative to git root)
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Current working directory (defaults to process.cwd())
 * @returns {Promise<number>} Promise that resolves to Unix timestamp (seconds) of last modification
 * @example
 * const modifiedDate = await getFileModifiedTimeStamp('src/index.js')
 * console.log('Last modified:', new Date(modifiedDate * 1000))
 */
async function getFileModifiedTimeStamp(filePath, options = {}) {
  // Get most recent commit timestamp for the file
  const [timestamp] = await readTimestamps(filePath, options, '-1 --pretty=format:%at --follow', 'modified date')

  const unixTimestamp = parseInt(timestamp, 10)
  if (isNaN(unixTimestamp)) {
    throw new Error(`Invalid timestamp received for ${filePath}`)
  }

  return unixTimestamp
}

/**
 * Gets the creation date of a file from git history (first commit)
 * @param {string} filePath - Path to the file (absolute or relative to git root)
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Current working directory (defaults to process.cwd())
 * @returns {Promise<number>} Promise that resolves to Unix timestamp (seconds) of creation
 * @example
 * const createdDate = await getFileCreatedTimeStamp('src/index.js')
 * console.log('Created:', new Date(createdDate * 1000))
 */
async function getFileCreatedTimeStamp(filePath, options = {}) {
  // Get all commit timestamps following history, then take the last one (oldest)
  const timestamps = await readTimestamps(filePath, options, '--follow --pretty=format:%at', 'created date')

  const unixTimestamp = parseInt(timestamps[timestamps.length - 1], 10)
  if (isNaN(unixTimestamp)) {
    throw new Error(`Invalid timestamp received for ${filePath}`)
  }

  return unixTimestamp
}

/**
 * Validates `filePath`, runs `git log <logArgs> -- "<filePath>"` and resolves the
 * non-empty output lines (newest first) (internal helper)
 * @param {string} filePath - Path to the file
 * @param {Object} options - Options
 * @param {string} [options.cwd] - Current working directory (defaults to process.cwd())
 * @param {string} logArgs - git log arguments before `--`
 * @param {string} what - What is being read, for the error message
 * @returns {Promise<string[]>}
 */
function readTimestamps(filePath, options, logArgs, what) {
  const cwd = options.cwd || process.cwd()

  return new Promise((resolve, reject) => {
    // Validate file path to prevent command injection
    try {
      validateFilePath(filePath)
    } catch (err) {
      return reject(err)
    }

    const command = `git log ${logArgs} -- "${filePath}"`

    executeCommand(command, { dst: cwd }, (err, stdout) => {
      if (err) {
        return reject(new Error(`Failed to get ${what} for ${filePath}: ${err.message}`))
      }

      const timestamps = stdout.trim().split('\n').filter(Boolean)
      if (timestamps.length === 0) {
        // File might not be committed yet
        return reject(new Error(`No git history found for ${filePath}`))
      }

      resolve(timestamps)
    })
  })
}

/**
 * Gets dates for a single file (internal helper)
 * @param {string} filePath - Path to the file
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Current working directory
 * @returns {Promise<FileDateInfo>}
 */
async function getSingleFileDates(filePath, options = {}) {
  // Get all commit timestamps following history
  const timestamps = await readTimestamps(filePath, options, '--follow --pretty=format:%at', 'dates')

  // First timestamp is most recent (modified), last is oldest (created)
  const modifiedTimestamp = parseInt(timestamps[0], 10)
  const createdTimestamp = parseInt(timestamps[timestamps.length - 1], 10)

  if (isNaN(modifiedTimestamp) || isNaN(createdTimestamp)) {
    throw new Error(`Invalid timestamp received for ${filePath}`)
  }

  return {
    created: createdTimestamp,
    modified: modifiedTimestamp,
    createdDate: new Date(createdTimestamp * 1000),
    modifiedDate: new Date(modifiedTimestamp * 1000)
  }
}

/**
 * Gets both creation and modification dates for file(s) from git history
 * @param {string | string[]} filePaths - Path or array of paths to file(s)
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Current working directory (defaults to process.cwd())
 * @returns {Promise<FileDateInfo | Object<string, FileDateInfo | FileDateError>>} Single file returns FileDateInfo, multiple files returns object keyed by path
 * @example
 * // Single file
 * const dates = await getFileDates('src/index.js')
 * console.log('Created:', dates.createdDate)
 * console.log('Modified:', dates.modifiedDate)
 *
 * // Multiple files
 * const dates = await getFileDates(['src/index.js', 'README.md'])
 * console.log('Index modified:', dates['src/index.js'].modifiedDate)
 */
async function getFileDates(filePaths, options = {}) {
  // Single file path
  if (typeof filePaths === 'string') {
    return getSingleFileDates(filePaths, options)
  }

  // Multiple file paths
  /** @type {Object<string, FileDateInfo | FileDateError>} */
  const results = {}

  await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        results[filePath] = await getSingleFileDates(filePath, options)
      } catch (err) {
        // Store error but don't fail entire operation
        results[filePath] = { error: err.message }
      }
    })
  )

  return results
}

module.exports = {
  getFileModifiedTimeStamp,
  getFileCreatedTimeStamp,
  getFileDates
}
