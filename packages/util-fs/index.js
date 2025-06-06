/* ./utils/fs.js */
const path = require('path')
const rimraf = require('rimraf')
const { promises, constants, stat } = require('fs')
const { promisify } = require('util')

const fs = promises

const deleteDir = promisify(rimraf)

const deleteFile = (s) => fs.unlink(s).catch((e) => {
  // console.log('e', e)
  // ignore already deleted files
  if (e.code === 'ENOENT') {
    return
  }
  throw e
})

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

// Recursive read dir
const readDirOpts = {
  recursive: true,
  exclude: []
}
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

async function createDir(directoryPath, recursive = true) {
  // ignore errors - throws if the path already exists
  return fs.mkdir(directoryPath, { recursive: recursive }).catch((e) => {})
}

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

module.exports = {
  // Check if file exists
  fileExists: fileExists,
  // Write file
  writeFile: fs.writeFile,
  // Read file
  readFile: fs.readFile,
  // Copy file
  copyFile: fs.copyFile,
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
