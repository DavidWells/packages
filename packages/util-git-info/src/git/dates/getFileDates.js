const { executeCommand } = require('../utils/exec')
const path = require('path')
const { getGitRoot } = require('../getGitRoot')

/**
 * @typedef {Object} FileDateInfo
 * @property {number} created - Unix timestamp (seconds) of when the file was first committed
 * @property {number} modified - Unix timestamp (seconds) of when the file was last modified
 * @property {Date} createdDate - JavaScript Date object of creation time
 * @property {Date} modifiedDate - JavaScript Date object of last modification
 */

/**
 * Gets the last modification date of a file from git history
 * @param {string} filePath - Path to the file (absolute or relative to git root)
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Current working directory (defaults to process.cwd())
 * @returns {Promise<number>} Promise that resolves to Unix timestamp (seconds) of last modification
 * @example
 * const modifiedDate = await getFileModifiedDate('src/index.js')
 * console.log('Last modified:', new Date(modifiedDate * 1000))
 */
async function getFileModifiedDate(filePath, options = {}) {
  const cwd = options.cwd || process.cwd()

  return new Promise((resolve, reject) => {
    // Get most recent commit timestamp for the file
    const command = `git log -1 --pretty=format:%at --follow -- "${filePath}"`

    executeCommand(command, { dst: cwd }, (err, stdout) => {
      if (err) {
        return reject(new Error(`Failed to get modified date for ${filePath}: ${err.message}`))
      }

      const timestamp = stdout.trim()
      if (!timestamp || timestamp === '') {
        // File might not be committed yet
        return reject(new Error(`No git history found for ${filePath}`))
      }

      const unixTimestamp = parseInt(timestamp, 10)
      if (isNaN(unixTimestamp)) {
        return reject(new Error(`Invalid timestamp received for ${filePath}`))
      }

      resolve(unixTimestamp)
    })
  })
}

/**
 * Gets the creation date of a file from git history (first commit)
 * @param {string} filePath - Path to the file (absolute or relative to git root)
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Current working directory (defaults to process.cwd())
 * @returns {Promise<number>} Promise that resolves to Unix timestamp (seconds) of creation
 * @example
 * const createdDate = await getFileCreatedDate('src/index.js')
 * console.log('Created:', new Date(createdDate * 1000))
 */
async function getFileCreatedDate(filePath, options = {}) {
  const cwd = options.cwd || process.cwd()

  return new Promise((resolve, reject) => {
    // Get all commit timestamps following history, then take the last one (oldest)
    const command = `git log --follow --pretty=format:%at -- "${filePath}"`

    executeCommand(command, { dst: cwd }, (err, stdout) => {
      if (err) {
        return reject(new Error(`Failed to get created date for ${filePath}: ${err.message}`))
      }

      const timestamps = stdout.trim().split('\n').filter(Boolean)
      if (timestamps.length === 0) {
        return reject(new Error(`No git history found for ${filePath}`))
      }

      // Last timestamp in the log is the oldest (creation)
      const createdTimestamp = timestamps[timestamps.length - 1]
      const unixTimestamp = parseInt(createdTimestamp, 10)

      if (isNaN(unixTimestamp)) {
        return reject(new Error(`Invalid timestamp received for ${filePath}`))
      }

      resolve(unixTimestamp)
    })
  })
}

/**
 * Gets both creation and modification dates for a file from git history
 * @param {string} filePath - Path to the file (absolute or relative to git root)
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Current working directory (defaults to process.cwd())
 * @returns {Promise<FileDateInfo>} Promise that resolves to object with created and modified timestamps
 * @example
 * const dates = await getFileDates('src/index.js')
 * console.log('Created:', dates.createdDate)
 * console.log('Modified:', dates.modifiedDate)
 * console.log('Created timestamp:', dates.created)
 * console.log('Modified timestamp:', dates.modified)
 */
async function getFileDates(filePath, options = {}) {
  const cwd = options.cwd || process.cwd()

  return new Promise((resolve, reject) => {
    // Get all commit timestamps following history
    const command = `git log --follow --pretty=format:%at -- "${filePath}"`

    executeCommand(command, { dst: cwd }, (err, stdout) => {
      if (err) {
        return reject(new Error(`Failed to get dates for ${filePath}: ${err.message}`))
      }

      const timestamps = stdout.trim().split('\n').filter(Boolean)
      if (timestamps.length === 0) {
        return reject(new Error(`No git history found for ${filePath}`))
      }

      // First timestamp is most recent (modified), last is oldest (created)
      const modifiedTimestamp = parseInt(timestamps[0], 10)
      const createdTimestamp = parseInt(timestamps[timestamps.length - 1], 10)

      if (isNaN(modifiedTimestamp) || isNaN(createdTimestamp)) {
        return reject(new Error(`Invalid timestamp received for ${filePath}`))
      }

      resolve({
        created: createdTimestamp,
        modified: modifiedTimestamp,
        createdDate: new Date(createdTimestamp * 1000),
        modifiedDate: new Date(modifiedTimestamp * 1000)
      })
    })
  })
}

/**
 * Gets modification dates for multiple files efficiently
 * @param {string[]} filePaths - Array of file paths
 * @param {Object} [options] - Options
 * @param {string} [options.cwd] - Current working directory (defaults to process.cwd())
 * @returns {Promise<Object<string, FileDateInfo>>} Promise that resolves to object mapping file paths to their date info
 * @example
 * const dates = await getMultipleFileDates(['src/index.js', 'README.md'])
 * console.log('Index modified:', dates['src/index.js'].modifiedDate)
 */
async function getMultipleFileDates(filePaths, options = {}) {
  const results = {}

  // Process files in parallel
  await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        results[filePath] = await getFileDates(filePath, options)
      } catch (err) {
        // Store error but don't fail entire operation
        results[filePath] = { error: err.message }
      }
    })
  )

  return results
}

module.exports = {
  getFileModifiedDate,
  getFileCreatedDate,
  getFileDates,
  getMultipleFileDates
}
