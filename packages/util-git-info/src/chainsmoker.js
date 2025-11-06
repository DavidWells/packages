// vendored from https://github.com/paulmelnikow/chainsmoker
const micromatch = require('micromatch')
// const mapValues = require('lodash.mapvalues')

const isExclude = p => p.startsWith('!')

/**
 * @typedef {import('./types').FileMatchResult} FileMatchResult
 */

/**
 * Creates a file matching function for categorized file paths
 * @param {Object<string, string[]>} keyedPaths - Object with keys (modified, created, deleted, edited) mapped to file path arrays
 * @returns {function(...(string|string[])): FileMatchResult} Function that accepts glob patterns and returns matching results
 */
module.exports = function chainsmoker(keyedPaths) {
  /**
   * Matches files against glob patterns
   * @param {...(string|string[])} globPatterns - One or more glob patterns or arrays of patterns. Use '!' prefix for exclusion
   * @returns {FileMatchResult} Object containing boolean flags and arrays of matching files
   * @example
   * // Single pattern
   * fileMatch('src/**\/*.js')
   *
   * // Multiple patterns
   * fileMatch('**\/*.js', '**\/*.ts')
   *
   * // Array of patterns
   * fileMatch(['**\/*.js', '**\/*.ts'])
   *
   * // Exclusion patterns
   * fileMatch('src/**\/*', '!**\/*.test.js')
   */
  const matchFunction = (...globPatterns) => {
    /** @type {string[]} */
    const patterns = globPatterns.flatMap((glob) => glob)
    const excludePatterns = patterns.filter(p => isExclude(p))
    const includePatterns = patterns.filter(p => !isExclude(p))

    /** @type {Record<string, string[]>} */
    const matches = {}
    Object.keys(keyedPaths).forEach((key) => {
      const paths = keyedPaths[key]
      const included = includePatterns.reduce((acc, pattern) => {
        return acc.concat(micromatch.match(paths, pattern))
      }, [])
      matches[key] = excludePatterns.reduce((acc, pattern) => {
        return micromatch.match(acc, pattern)
      }, included)
    })
    /* previous with lodash
    const matches = mapValues(keyedPaths, paths => {
      const excludePatterns = patterns.filter(p => isExclude(p))
      const includePatterns = patterns.filter(p => !isExclude(p))
      const included = includePatterns.reduce((acc, pattern) => {
        return acc.concat(micromatch.match(paths, pattern))
      }, [])
      return excludePatterns.reduce((acc, pattern) => {
        return micromatch.match(acc, pattern)
      }, included)
    })
    */
    // console.log('matches', matches)
    return finalize(matches)
  }
  return matchFunction
}

/**
 * Finalizes the match results into FileMatchResult format
 * @param {Object<string, string[]>} keyedPaths - Object with matched file paths
 * @returns {FileMatchResult} Formatted result with boolean flags and file arrays
 */
function finalize(keyedPaths) {
  /** @type {any} */
  const values = {}
  Object.keys(keyedPaths).forEach((key) => {
    values[key] = keyedPaths[key].length > 0
    values[`${key}Files`] = keyedPaths[key]
  })
  /** @type {FileMatchResult} */
  const result = Object.assign(values, {
    getKeyedPaths: () => keyedPaths
  })
  return result
}
