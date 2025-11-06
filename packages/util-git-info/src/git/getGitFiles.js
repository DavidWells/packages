const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { findUp } = require('./utils/find-up')

const regex = /^([A-Z?])\s+(\d{6})\s+([a-z0-9]{40})\s+(\d+)\s+(.*)$/u

/**
 * Gets all files tracked by Git in the repository with their hashes
 * @param {string} [dir] - Optional directory path to search from. If not provided, searches from current working directory
 * @returns {Promise<Record<string, string>>} Promise that resolves to an object mapping file paths to their Git hashes (or modified timestamps for changed files)
 * @throws {Error} Throws if the directory is not a Git repository
 * @example
 * const files = await getGitFiles('/path/to/repo')
 * // Returns: { 'src/index.js': 'abc123...', 'package.json': 'def456...' }
 */
async function getGitFiles(dir) {
  const directory = (dir) ? dir : findUp('.git', process.cwd())
  if (!directory) {
    throw new Error(`Not a Git repository ${directory}`)
  }

  return new Promise((resolve, reject) => {
    exec(
      'git ls-files --full-name -s -d -c -m -o --directory -t',
      { cwd: directory, maxBuffer: 1024 * 1024 * 1024 },
      (error, stdout) => {
        if (error) return reject(error)
        return resolve(parseFiles(stdout, directory))
      }
    )
  })
}

/**
 * Parses the output from git ls-files command and creates a mapping of file paths to hashes
 * @param {string} data - Raw output from git ls-files command
 * @param {string} dir - The directory path being processed
 * @returns {Record<string, string>} Object mapping file paths to their Git hashes or modification timestamps
 * @private
 */
function parseFiles(data, dir) {
  /** @type {Record<string, string>} */
  const ret = {}
  data.split('\n').forEach((line) => {
    const m = regex.exec(line)
    if (m) {
      const file = m[5]
      let hash = m[3]
      if (m[1] === 'C') {
        const filePath = path.resolve(dir, file)
        hash += fs.existsSync(filePath) ? `.${fs.lstatSync(filePath).mtimeMs}` : '.del'
      }
      ret[file] = hash
    } else {
      const file = line.slice(2)
      const filePath = path.resolve(dir, file)
      if (file && fs.existsSync(filePath)) {
        ret[file] = `${fs.lstatSync(filePath).mtimeMs}`
      }
    }
  })
  return ret
}

const cache = {}

/**
 * Gets Git files relative to a specific directory with optional exclusions and caching
 * @param {string} directory - The directory path to get relative files from
 * @param {string[]} [exclude=[]] - Optional array of file paths to exclude from results
 * @returns {Promise<Record<string, string>>} Promise that resolves to an object mapping relative file paths to their Git hashes (or modified timestamps for changed files)
 * @throws {Error} Throws if the directory is not in a Git repository
 * @example
 * const files = await getGitFilesRelative('/path/to/repo/src', ['node_modules'])
 * // Returns: { 'index.js': 'abc123...', 'utils/helper.js': 'def456...' }
 */
async function getGitFilesRelative(directory, exclude = []) {
  const root = findUp('.git', directory)
  if (!root) throw new Error(`Not a Git repository ${directory}`)

  if (!cache[root]) {
    cache[root] = await getGitFiles(root)
  }
  const files = cache[root]
  /** @type {Record<string, string>} */
  const ret = {}

  Object.entries(files)
    .filter(([file]) => {
      const filePath = path.resolve(root, file)
      if (file && exclude.includes(file)) return false
      return (
        filePath === directory || filePath.startsWith(directory + path.sep)
      )
    })
    .map(([file, hash]) => [
      path.relative(directory, path.resolve(root, file)),
      hash,
    ])
    .filter(([file]) => file.length && !exclude.includes(file))
    .forEach(([file, hash]) => (ret[file] = hash))

  return ret
}

module.exports = {
  getGitFiles,
  getGitFilesRelative
}
