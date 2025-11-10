/* ./utils/fs.js */
const path = require('path')
const rimraf = require('rimraf')
const { promises, constants, stat } = require('fs')
const { promisify } = require('util')

const fs = promises

const deleteDir = promisify(rimraf)

/**
 * Delete a file, ignoring ENOENT errors
 * @param {string} s - Path to file to delete
 * @returns {Promise<void>}
 */
const deleteFile = (s) => fs.unlink(s).catch((e) => {
  // console.log('e', e)
  // ignore already deleted files
  if (e.code === 'ENOENT') {
    return
  }
  throw e
})

/**
 * Check if a file exists
 * @param {string} s - Path to check
 * @returns {Promise<boolean>}
 */
const fileExists = (s) => fs.access(s, constants.F_OK).then(() => true).catch(() => false)

/* Recursive read dir
async function readDir(dir, recursive = true, allFiles = []) {
  const files = (await fs.readdir(dir)).map((file) => path.join(dir, file))
  if (!recursive) return files
  allFiles.push(...files)
  await Promise.all(files.map(async (file) => {
    return (await fs.stat(file)).isDirectory() && readDir(file, recursive, allFiles)
  }))
  return allFiles
}
*/

/**
 * @typedef {Object} ReadDirOptions
 * @property {boolean} [recursive=true] - Whether to read directories recursively
 * @property {(string|RegExp)[]} [exclude=[]] - Patterns to exclude from results
 */

// Recursive read dir
const readDirOpts = {
  recursive: true,
  exclude: []
}

/**
 * Recursively read directory contents
 * @param {string} dir - Directory path to read
 * @param {ReadDirOptions} [opts] - Options for reading directory
 * @param {string[]} [allFiles] - Internal parameter for recursive calls
 * @returns {Promise<string[]>} Array of file paths
 */
async function readDir(dir, opts = readDirOpts, allFiles = []) {
  let files = (await fs.readdir(dir)).map((file) => path.join(dir, file))
  const exclude = !Array.isArray(opts.exclude) ? [opts.exclude] : opts.exclude
  if (exclude.length) {
    files = files.filter((filePath) => {
      return !exclude.some((matcher) => {
        if (typeof matcher === 'string') {
          return filePath.indexOf(matcher) !== -1
        } else if (matcher instanceof RegExp) {
          return filePath.match(matcher)
        }
      })
    })
  }
  if (opts.recursive === false) {
    return files
  }
  allFiles.push(...files)
  await Promise.all(files.map(async (file) => {
    return (await fs.stat(file)).isDirectory() && readDir(file, opts, allFiles)
  }))
  return allFiles
}

/**
 * Create a directory recursively
 * @param {string} directoryPath - Path to directory to create
 * @param {boolean} [recursive=true] - Whether to create parent directories
 * @returns {Promise<void>}
 */
async function createDir(directoryPath, recursive = true) {
  // ignore errors - throws if the path already exists
  return fs.mkdir(directoryPath, { recursive: recursive }).catch((e) => {})
}

/**
 * Copy a directory recursively
 * @param {string} src - Source directory path
 * @param {string} dest - Destination directory path
 * @param {boolean} [recursive=true] - Whether to copy recursively
 * @returns {Promise<void>}
 */
async function copyDir(src, dest, recursive = true) {
  await createDir(dest, recursive) // Ensure directory exists

  const filePaths = await fs.readdir(src)
  await Promise.all(filePaths.map(async (item) => {
    const srcPath = path.join(src, item)
    const destPath = path.join(dest, item)
    const itemStat = await fs.lstat(srcPath)

    if (itemStat.isFile()) {
      return fs.copyFile(srcPath, destPath)
    }
    // Return early if recursive false
    if (!recursive) return
    // Copy child directory
    return copyDir(srcPath, destPath, recursive)
  }))
}

/**
 * @typedef {Object} FileSizeResult
 * @property {number} bytes - File size in bytes
 * @property {number} mb - File size in megabytes (rounded to 2 decimal places)
 */

/**
 * Get file size information
 * @param {string} filePath - Path to the file
 * @returns {Promise<FileSizeResult>} File size information
 */
async function getFileSize(filePath) {
  return new Promise((resolve, reject) => {
    stat(filePath, (err, stats) => {
      if (err) {
        return reject(err)
      }
      const fileSizeInBytes = stats.size
      const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024)
      const mb = Math.round(fileSizeInMegabytes * 100) / 100
      return resolve({
        bytes: fileSizeInBytes,
        mb: mb
      })
    })
  })
}

/**
 * Write data to a file
 * @type {typeof import('fs').promises.writeFile}
 */
const writeFile = fs.writeFile

/**
 * Read data from a file
 * @type {typeof import('fs').promises.readFile}
 */
const readFile = fs.readFile

/**
 * Copy a file from source to destination
 * @type {typeof import('fs').promises.copyFile}
 */
const copyFile = fs.copyFile

module.exports = {
  // Check if file exists
  fileExists: fileExists,
  // Write file
  writeFile: writeFile,
  // Read file
  readFile: readFile,
  // Copy file
  copyFile: copyFile,
  // Delete file
  deleteFile: deleteFile,
  // Check if directory exists
  directoryExists: fileExists,
  // Recursively create directory
  createDir: createDir,
  // Recursively get file names in dir
  readDir: readDir,
  // Recursively copy directory
  copyDir: copyDir,
  // Recursively delete directory & contents
  deleteDir: deleteDir,
  // Get size of file
  getFileSize
}
